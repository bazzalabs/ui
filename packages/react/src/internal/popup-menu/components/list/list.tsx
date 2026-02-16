'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { useMaybeComboboxContext } from '../../../../combobox/contexts/combobox-context.js'
import type { ComponentProps } from '../../../../utils/types.js'
import {
  RowWidthContext,
  useListboxContext,
  useStickyRowWidth,
  useSurfaceContext,
} from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { usePopupMenuContext } from '../../contexts/popup-menu-context.js'
import { useMaybeSubmenuContext } from '../../contexts/submenu-context.js'
import { useMaybeSubpageContext } from '../../contexts/subpage-context.js'
import { usePopupMenuKeyboard } from '../../hooks/use-popup-menu-keyboard.js'
import { PopupMenuListCssVars } from './list.css-vars.js'
import { PopupMenuListDataAttributes } from './list.data-attrs.js'

export { PopupMenuListCssVars, PopupMenuListDataAttributes }

/**
 * State passed to children render function.
 */
export interface PopupMenuListChildrenState {
  /** Current search query */
  search: string
  /** Number of items matching the current filter */
  filteredCount: number
}

// List doesn't expose data attributes - using empty state
export interface PopupMenuListState extends Record<string, unknown> {}

export interface PopupMenuListProps
  extends Omit<ComponentProps<'div', PopupMenuList.State>, 'children'> {
  /**
   * Content to render inside the list.
   * Can be a render function that receives the current search state.
   */
  children:
    | React.ReactNode
    | ((state: PopupMenuListChildrenState) => React.ReactNode)

  /**
   * Accessible label for the listbox.
   * @default 'Suggestions'
   */
  label?: string

  /**
   * When true, measures row widths and applies `--row-width` CSS variable.
   * Keeps the list at the maximum width seen while scrolling.
   * Useful for virtualized lists where content width varies.
   * @default true
   */
  measureRowWidth?: boolean

  /**
   * Maximum width cap for row measurement (in pixels).
   * Only used when `measureRowWidth` is true.
   */
  maxRowWidth?: number
}

/**
 * Container for popup menu items.
 * Supports render props for accessing search state.
 * Renders a `<div>` element with role="listbox".
 */
export const PopupMenuList = React.forwardRef<
  HTMLDivElement,
  PopupMenuList.Props
>(function PopupMenuList(props, forwardedRef) {
  const {
    children,
    label = 'Suggestions',
    measureRowWidth = true,
    maxRowWidth,
    render,
    className,
    style,
    onKeyDown,
    onPointerDown,
    ...rest
  } = props

  const { store, surfaceId } = useSurfaceContext()
  const { depth, closeAll } = useListboxContext()
  const submenuContext = useMaybeSubmenuContext()
  const subpageContext = useMaybeSubpageContext()
  const { disabled: popupMenuDisabled } = usePopupMenuContext()
  const focusOwnerStore = useFocusOwner()
  const comboboxContext = useMaybeComboboxContext()
  const internalRef = React.useRef<HTMLDivElement>(null)

  // Ref to the popup element (found via closest) for applying --row-width CSS var
  const popupRef = React.useRef<HTMLElement | null>(null)

  // Register list ref with store for scroll behavior
  React.useEffect(() => {
    store.setListRef(internalRef)
  }, [store])

  // Find popup element on mount for row width measurement target
  React.useLayoutEffect(() => {
    if (!measureRowWidth || !internalRef.current) return
    // Find the closest popup element (Base UI's Popover.Popup adds data-open)
    const popup = internalRef.current.closest(
      '[data-open]',
    ) as HTMLElement | null
    popupRef.current = popup
  }, [measureRowWidth])

  // Row width measurement - apply CSS var to popup instead of list
  const { queueMeasurement, resetMeasurements } = useStickyRowWidth({
    listRef: internalRef,
    targetRef: popupRef,
    maxWidth: maxRowWidth,
    enabled: measureRowWidth,
  })

  // Register resetMeasurements callback with store for close completion
  React.useEffect(() => {
    if (measureRowWidth) {
      store.context.onCloseComplete = resetMeasurements
      return () => {
        store.context.onCloseComplete = undefined
      }
    }
  }, [measureRowWidth, resetMeasurements, store])

  // Row width context value
  const rowWidthContextValue = React.useMemo(
    () => (measureRowWidth ? { queueMeasurement } : null),
    [measureRowWidth, queueMeasurement],
  )

  // Get values from store
  const search = store.useState('search')
  const filteredCount = store.useState('filteredCount')
  const hasInput = store.useState('hasInput')
  const highlightedId = store.useState('highlightedId')
  const listId = store.context.listId

  // When there's no Input, the List should receive focus and handle keyboard nav
  // Note: Auto-focus is handled by Surface when it becomes the focus owner
  const shouldHandleKeyboard = !hasInput && !popupMenuDisabled

  // Use centralized keyboard navigation hook
  const { handleKeyDown } = usePopupMenuKeyboard({
    store,
    surfaceId,
    focusOwnerStore,
    depth,
    submenuContext,
    subpageContext,
    enabled: shouldHandleKeyboard,
    disabled: popupMenuDisabled,
    enableTypeToSearch: true,
    onKeyDown,
    closeAll,
  })

  // Prevent pointer down from stealing focus from Input
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      onPointerDown?.(event)
    },
    [onPointerDown],
  )

  const childrenState: PopupMenuList.ChildrenState = React.useMemo(
    () => ({
      search,
      filteredCount,
    }),
    [search, filteredCount],
  )

  const renderedChildren =
    typeof children === 'function' ? children(childrenState) : children

  // Wrap children with RowWidthContext if measurement is enabled
  const wrappedChildren = rowWidthContextValue ? (
    <RowWidthContext.Provider value={rowWidthContextValue}>
      {renderedChildren}
    </RowWidthContext.Provider>
  ) : (
    renderedChildren
  )

  // Add data-input-embedded attribute when layout is input-embedded
  const isInputEmbedded = comboboxContext?.layout === 'input-embedded'

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'list')

  return useRender({
    render,
    ref: [internalRef, forwardedRef],
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      id: listId,
      role: 'listbox',
      'aria-label': label,
      'aria-activedescendant': shouldHandleKeyboard
        ? (highlightedId ?? undefined)
        : undefined,
      tabIndex: shouldHandleKeyboard ? 0 : -1,
      [PopupMenuListDataAttributes.list]: '',
      'data-input-embedded': isInputEmbedded ? '' : undefined,
      className,
      style,
      onKeyDown: handleKeyDown,
      onPointerDown: handlePointerDown,
      children: wrappedChildren,
    },
    defaultTagName: 'div',
  })
})

export namespace PopupMenuList {
  export type State = PopupMenuListState
  export type ChildrenState = PopupMenuListChildrenState
  export interface Props extends PopupMenuListProps {}
}
