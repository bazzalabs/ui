'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useAimGuard } from '../contexts/aim-guard-context.js'
import { useRootContext } from '../contexts/root-context.js'
import {
  useGroupContext,
  useSurfaceContext,
} from '../contexts/surface-context.js'
import { DropdownMenuCheckboxItemDataAttributes } from './checkbox-item.data-attrs.js'
import {
  CheckboxItemContext,
  type CheckboxItemContextValue,
} from './checkbox-item-context.js'

export interface DropdownMenuCheckboxItemState extends Record<string, unknown> {
  /**
   * Whether the item is highlighted (via keyboard or pointer).
   */
  highlighted: boolean
  /**
   * Whether the item is disabled.
   */
  disabled: boolean
  /**
   * Whether the item is currently checked.
   */
  checked: boolean
}

export interface DropdownMenuCheckboxItemProps
  extends ComponentProps<'div', DropdownMenuCheckboxItemState> {
  /**
   * The controlled checked state.
   */
  checked?: boolean

  /**
   * The default checked state for uncontrolled mode.
   * @default false
   */
  defaultChecked?: boolean

  /**
   * Callback fired when the checked state changes.
   */
  onCheckedChange?: (checked: boolean) => void

  /**
   * Additional keywords to match against when filtering.
   * Useful for aliases or synonyms.
   */
  keywords?: string[]

  /**
   * Whether this item is disabled.
   * Disabled items are not selectable and are skipped during keyboard navigation.
   * @default false
   */
  disabled?: boolean

  /**
   * Callback when this item is selected (via click or Enter key).
   */
  onSelect?: () => void

  /**
   * Whether to force render this item regardless of filter results.
   * @default false
   */
  forceMount?: boolean

  /**
   * Whether clicking this item should close the menu.
   * @default false
   */
  closeOnClick?: boolean
}

const stateAttributesMapping = {
  checked: (value: unknown): Record<string, string> | null =>
    value
      ? { [DropdownMenuCheckboxItemDataAttributes.checked]: '' }
      : { [DropdownMenuCheckboxItemDataAttributes.unchecked]: '' },
  highlighted: (value: unknown): Record<string, string> | null =>
    value ? { [DropdownMenuCheckboxItemDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { [DropdownMenuCheckboxItemDataAttributes.disabled]: '' } : null,
}

/**
 * A selectable checkbox item within a dropdown menu.
 * Manages its own checked state independently.
 * Renders a `<div>` element with role="menuitemcheckbox".
 */
export const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuCheckboxItemProps
>(function DropdownMenuCheckboxItem(props, forwardedRef) {
  const {
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    keywords,
    disabled = false,
    onSelect,
    forceMount = false,
    closeOnClick = false,
    render,
    className,
    style,
    onClick,
    onPointerDown,
    onPointerMove,
    children,
    ...rest
  } = props

  const { store } = useSurfaceContext()
  const groupContext = useGroupContext()
  const { depth, closeAll } = useRootContext()
  const { aimGuardActiveRef, guardedDepthRef } = useAimGuard()

  const id = React.useId()
  const ref = React.useRef<HTMLDivElement>(null)

  // Controlled/uncontrolled state management
  const [internalChecked, setInternalChecked] =
    React.useState<boolean>(defaultChecked)
  const isControlled = checkedProp !== undefined
  const checked = isControlled ? checkedProp : internalChecked

  const toggleChecked = React.useCallback(() => {
    const newChecked = !checked
    if (!isControlled) {
      setInternalChecked(newChecked)
    }
    onCheckedChange?.(newChecked)
  }, [checked, isControlled, onCheckedChange])

  // Infer text value for filtering
  const [inferredValue, setInferredValue] = React.useState<string>('')

  React.useLayoutEffect(() => {
    if (ref.current) {
      const textContent = ref.current.textContent?.trim() ?? ''
      setInferredValue(textContent)
    }
  }, [children])

  // Register with store for navigation/filtering
  React.useEffect(() => {
    if (!inferredValue && !forceMount) return

    const unregister = store.registerItem(id, {
      value: inferredValue,
      keywords,
      groupId: groupContext?.groupId,
      disabled,
    })

    return unregister
  }, [
    id,
    inferredValue,
    keywords,
    groupContext?.groupId,
    disabled,
    store,
    forceMount,
  ])

  // Register onSelect handler (called when Enter is pressed on highlighted item)
  React.useEffect(() => {
    const handleSelect = () => {
      if (disabled) return
      toggleChecked()
      onSelect?.()
      if (closeOnClick) {
        closeAll()
      }
    }
    return store.registerItemSelect(id, handleSelect)
  }, [id, disabled, toggleChecked, onSelect, closeOnClick, closeAll, store])

  // Use selectors for state
  const search = store.useState('search')
  const isHighlighted = store.useState('isHighlighted', id)
  const score = store.useState('getItemScore', id)

  // Visibility based on filter
  const hasSearch = search.length > 0
  const isVisible = forceMount || !hasSearch || score > 0

  // Scroll into view on keyboard highlight
  React.useEffect(() => {
    if (
      isHighlighted &&
      store.state.highlightSource === 'keyboard' &&
      ref.current
    ) {
      ref.current.scrollIntoView({ block: 'nearest' })
    }
  }, [isHighlighted, store])

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(event)
      if (event.defaultPrevented || disabled) return

      event.preventDefault()
      toggleChecked()
      onSelect?.()

      if (closeOnClick) {
        closeAll()
      }
    },
    [onClick, disabled, toggleChecked, onSelect, closeOnClick, closeAll],
  )

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      onPointerDown?.(event)
    },
    [onPointerDown],
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)
      if (event.defaultPrevented || disabled) return
      if (aimGuardActiveRef.current && guardedDepthRef.current === depth) return
      store.setHighlightedId(id)
    },
    [
      onPointerMove,
      disabled,
      aimGuardActiveRef,
      guardedDepthRef,
      depth,
      store,
      id,
    ],
  )

  const state: DropdownMenuCheckboxItemState = React.useMemo(
    () => ({ highlighted: isHighlighted, disabled, checked }),
    [isHighlighted, disabled, checked],
  )

  const checkboxItemContextValue: CheckboxItemContextValue = React.useMemo(
    () => ({
      checked,
      highlighted: isHighlighted,
      disabled,
      toggle: toggleChecked,
    }),
    [checked, isHighlighted, disabled, toggleChecked],
  )

  const element = useRender({
    render,
    ref: [ref, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      id,
      role: 'menuitemcheckbox',
      tabIndex: -1,
      'aria-checked': checked,
      'aria-disabled': disabled || undefined,
      className,
      style,
      onClick: handleClick,
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      children,
    },
    enabled: isVisible,
    defaultTagName: 'div',
  })

  if (!isVisible) {
    return null
  }

  return (
    <CheckboxItemContext.Provider value={checkboxItemContextValue}>
      {element}
    </CheckboxItemContext.Provider>
  )
})

export namespace DropdownMenuCheckboxItem {
  export type State = DropdownMenuCheckboxItemState
  export interface Props extends DropdownMenuCheckboxItemProps {}
}
