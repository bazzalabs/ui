'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { ItemContext, useSurfaceContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useSubpageStack } from '../../contexts/subpage-stack-context.js'
import { usePopupMenuItem } from '../../hooks/use-popup-menu-item.js'
import { PopupMenuSubpageTriggerDataAttributes } from './subpage-trigger.data-attrs.js'

export { PopupMenuSubpageTriggerDataAttributes }

export interface PopupMenuSubpageTriggerState extends Record<string, unknown> {
  /** Whether this is a subpage trigger (always true). */
  subpageTrigger: boolean
  /** Whether the target page is active. */
  popupOpen: boolean
  /** Whether the target page owns keyboard focus. */
  popupFocused: boolean
  /** Whether the item is highlighted. */
  highlighted: boolean
  /** Whether the item is disabled. */
  disabled: boolean
}

const stateAttributesMapping = {
  subpageTrigger: (value: unknown) =>
    value
      ? { [PopupMenuSubpageTriggerDataAttributes.subpageTrigger]: '' }
      : null,
  popupOpen: (value: unknown) =>
    value ? { [PopupMenuSubpageTriggerDataAttributes.popupOpen]: '' } : null,
  popupFocused: (value: unknown) =>
    value ? { [PopupMenuSubpageTriggerDataAttributes.popupFocused]: '' } : null,
  highlighted: (value: unknown) =>
    value ? { [PopupMenuSubpageTriggerDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown) =>
    value ? { [PopupMenuSubpageTriggerDataAttributes.disabled]: '' } : null,
}

export interface PopupMenuSubpageTriggerProps
  extends ComponentProps<'div', PopupMenuSubpageTrigger.State> {
  /** Explicit unique identifier for this item in the store. */
  id?: string
  /** Unique value for this item used for filtering. */
  value?: string
  /** Additional keywords to match against when filtering. */
  keywords?: string[]
  /** Whether this item is disabled. */
  disabled?: boolean
  /** Whether to force render this item regardless of filter results. */
  forceMount?: boolean
  /** Target page ID to open when this trigger is selected. */
  targetPageId: string
  /**
   * Whether the target page opens when this trigger is highlighted.
   * @default true
   */
  openOnHighlight?: boolean
  /**
   * Delay before opening the page (in milliseconds).
   * Can be a number (applies to both pointer and keyboard) or an object
   * with separate `pointer` and `keyboard` values.
   * @default { pointer: 0, keyboard: 150 }
   */
  delay?: number | { pointer?: number; keyboard?: number }
}

/**
 * A menu item that pushes a new page in the same popup.
 * Renders a `<div>` element with role="menuitem".
 */
export const PopupMenuSubpageTrigger = React.forwardRef<
  HTMLDivElement,
  PopupMenuSubpageTrigger.Props
>(function PopupMenuSubpageTrigger(props, forwardedRef) {
  const {
    id: idProp,
    value,
    keywords,
    disabled = false,
    forceMount = false,
    targetPageId,
    openOnHighlight = true,
    delay: delayProp,
    render,
    className,
    style,
    onPointerDown,
    onPointerMove,
    onPointerEnter,
    children,
    ...rest
  } = props

  const delay = React.useMemo(() => {
    if (typeof delayProp === 'number') {
      return { pointer: delayProp, keyboard: delayProp }
    }

    return {
      pointer: delayProp?.pointer ?? 0,
      keyboard: delayProp?.keyboard ?? 150,
    }
  }, [delayProp])

  const { store: parentStore } = useSurfaceContext()
  const focusOwnerStore = useFocusOwner()
  const subpageStack = useSubpageStack()
  const activePageId = subpageStack.activePageId
  const openPage = subpageStack.openPage
  const getSurfaceId = subpageStack.getSurfaceId

  const openTargetPage = React.useCallback(() => {
    const didOpen = openPage(targetPageId)
    if (!didOpen) {
      return
    }

    const targetSurfaceId = getSurfaceId(targetPageId)
    if (targetSurfaceId) {
      focusOwnerStore.setOwnerId(targetSurfaceId)
    }
  }, [openPage, getSurfaceId, targetPageId, focusOwnerStore])

  const item = usePopupMenuItem({
    id: idProp,
    value,
    keywords,
    disabled,
    forceMount,
    isSubmenuTrigger: true,
    closeOnClick: false,
    onSelect: openTargetPage,
    children,
  })

  React.useEffect(() => {
    return parentStore.registerSubmenuOpen(item.storeId, openTargetPage)
  }, [parentStore, item.storeId, openTargetPage])

  const openTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearOpenTimer = React.useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
  }, [])

  React.useEffect(() => clearOpenTimer, [clearOpenTimer])

  const isTargetOpen = activePageId === targetPageId
  const targetSurfaceId = getSurfaceId(targetPageId)
  const isPopupFocused = focusOwnerStore.useState(
    'isOwner',
    targetSurfaceId ?? '',
  )

  // Suppress immediate keyboard auto-open after explicit back navigation.
  const suppressAutoOpenRef = React.useRef(false)
  const prevIsTargetOpenRef = React.useRef(isTargetOpen)

  React.useEffect(() => {
    if (prevIsTargetOpenRef.current && !isTargetOpen && item.isHighlighted) {
      suppressAutoOpenRef.current = true
    }
    prevIsTargetOpenRef.current = isTargetOpen
  }, [isTargetOpen, item.isHighlighted])

  React.useEffect(() => {
    if (!item.isHighlighted) {
      suppressAutoOpenRef.current = false
    }
  }, [item.isHighlighted])

  React.useEffect(() => {
    if (!openOnHighlight) {
      return
    }

    if (
      !item.isHighlighted ||
      parentStore.state.highlightSource !== 'keyboard' ||
      suppressAutoOpenRef.current
    ) {
      clearOpenTimer()
      return
    }

    if (isTargetOpen) {
      return
    }

    const keyboardDelay = delay.keyboard
    if (keyboardDelay <= 0) {
      openTargetPage()
    } else {
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null
        openTargetPage()
      }, keyboardDelay)
    }

    return clearOpenTimer
  }, [
    openOnHighlight,
    item.isHighlighted,
    parentStore,
    clearOpenTimer,
    isTargetOpen,
    delay.keyboard,
    openTargetPage,
  ])

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      item.handlers.onPointerDown(event)
      onPointerDown?.(event)
    },
    [item.handlers, onPointerDown],
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)
      if (!event.defaultPrevented) {
        item.handlers.onPointerMove(event)
      }
    },
    [onPointerMove, item.handlers],
  )

  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerEnter?.(event)

      if (event.defaultPrevented || disabled) {
        return
      }

      parentStore.setHighlightedId(item.storeId)

      if (!openOnHighlight || isTargetOpen) {
        return
      }

      clearOpenTimer()

      const pointerDelay = delay.pointer
      if (pointerDelay <= 0) {
        openTargetPage()
      } else {
        openTimerRef.current = setTimeout(() => {
          openTimerRef.current = null
          openTargetPage()
        }, pointerDelay)
      }
    },
    [
      onPointerEnter,
      disabled,
      parentStore,
      item.storeId,
      openOnHighlight,
      isTargetOpen,
      clearOpenTimer,
      delay.pointer,
      openTargetPage,
    ],
  )

  const state: PopupMenuSubpageTrigger.State = React.useMemo(
    () => ({
      subpageTrigger: true,
      popupOpen: isTargetOpen,
      popupFocused: isPopupFocused,
      highlighted: item.isHighlighted,
      disabled,
    }),
    [isTargetOpen, isPopupFocused, item.isHighlighted, disabled],
  )

  const wrappedChildren = (
    <ItemContext.Provider value={item.contextValue}>
      {children}
    </ItemContext.Provider>
  )

  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'subpage-trigger')

  return useRender({
    render,
    ref: [item.ref, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      id: item.id,
      role: 'menuitem',
      'aria-haspopup': 'menu',
      'aria-expanded': isTargetOpen,
      tabIndex: -1,
      'aria-disabled': disabled || undefined,
      className,
      style,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerEnter: handlePointerEnter,
      children: wrappedChildren,
    },
    enabled: item.isVisible,
    defaultTagName: 'div',
  })
})

export namespace PopupMenuSubpageTrigger {
  export type State = PopupMenuSubpageTriggerState
  export interface Props extends PopupMenuSubpageTriggerProps {}
}
