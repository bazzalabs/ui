'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import {
  createChangeEventDetails,
  REASONS,
} from '../../../../utils/events/index.js'
import type { ComponentProps } from '../../../../utils/types.js'
import { ItemContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import type {
  CheckedChangeEventDetails,
  CheckedChangeReason,
} from '../../events.js'
import { usePopupMenuItem } from '../../hooks/use-popup-menu-item.js'
import { PopupMenuCheckboxItemDataAttributes } from './checkbox-item.data-attrs.js'
import {
  CheckboxItemContext,
  type CheckboxItemContextValue,
} from './checkbox-item-context.js'

export { PopupMenuCheckboxItemDataAttributes }

export interface PopupMenuCheckboxItemState extends Record<string, unknown> {
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
  first: boolean
  last: boolean
  firstInGroup: boolean
  lastInGroup: boolean
}

export interface PopupMenuCheckboxItemProps
  extends ComponentProps<'div', PopupMenuCheckboxItem.State> {
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
   * The second parameter contains event details including the reason for the change.
   */
  onCheckedChange?: (
    checked: boolean,
    eventDetails: CheckedChangeEventDetails,
  ) => void

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

  /**
   * Keyboard shortcut to trigger this item.
   * When the menu is focused and the user presses this key, the item will be selected.
   * Should be a single character (e.g., "1", "a", etc.).
   */
  shortcut?: string

  /**
   * Forces this row's relative order during score-based sorting.
   * Lower values appear earlier.
   * @default 0
   */
  forceOrder?: number

  /**
   * Overrides this row's computed fuzzy-match score.
   */
  forceScore?: number
}

const stateAttributesMapping = {
  checked: (value: unknown): Record<string, string> | null =>
    value
      ? { [PopupMenuCheckboxItemDataAttributes.checked]: '' }
      : { [PopupMenuCheckboxItemDataAttributes.unchecked]: '' },
  highlighted: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuCheckboxItemDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuCheckboxItemDataAttributes.disabled]: '' } : null,
  first: (value: unknown) =>
    value ? { [PopupMenuCheckboxItemDataAttributes.first]: '' } : null,
  last: (value: unknown) =>
    value ? { [PopupMenuCheckboxItemDataAttributes.last]: '' } : null,
  firstInGroup: (value: unknown) =>
    value ? { [PopupMenuCheckboxItemDataAttributes.firstInGroup]: '' } : null,
  lastInGroup: (value: unknown) =>
    value ? { [PopupMenuCheckboxItemDataAttributes.lastInGroup]: '' } : null,
}

/**
 * A selectable checkbox item within a popup menu.
 * Manages its own checked state independently.
 * Renders a `<div>` element with role="menuitemcheckbox".
 */
export const PopupMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  PopupMenuCheckboxItem.Props
>(function PopupMenuCheckboxItem(props, forwardedRef) {
  const {
    id,
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    keywords,
    disabled: disabledProp = false,
    onSelect,
    forceMount = false,
    closeOnClick = false,
    shortcut,
    forceOrder,
    forceScore,
    render,
    className,
    style,
    onClick,
    onPointerDown,
    onPointerMove,
    children,
    ...rest
  } = props

  // Controlled/uncontrolled state management
  const [internalChecked, setInternalChecked] =
    React.useState<boolean>(defaultChecked)
  const isControlled = checkedProp !== undefined
  const checked = isControlled ? checkedProp : internalChecked

  const toggleChecked = React.useCallback(
    (reason: CheckedChangeReason = REASONS.itemPress, event?: Event) => {
      const newChecked = !checked
      const eventDetails = createChangeEventDetails(reason, event)

      // Call user's callback first
      onCheckedChange?.(newChecked, eventDetails)

      // If canceled, don't update internal state
      if (eventDetails.isCanceled) return

      if (!isControlled) {
        setInternalChecked(newChecked)
      }
    },
    [checked, isControlled, onCheckedChange],
  )

  const item = usePopupMenuItem({
    id,
    keywords,
    disabled: disabledProp,
    forceMount,
    shortcut,
    forceOrder,
    forceScore,
    closeOnClick,
    children,
  })

  const disabled = item.disabled

  // Register the select handler that toggles checked state
  // Note: closeOnClick is handled by usePopupMenuItem's onAfterSelect
  React.useEffect(() => {
    const handleSelect = () => {
      if (disabled) return
      toggleChecked()
      onSelect?.()
    }
    return item.registerSelect(handleSelect)
  }, [disabled, toggleChecked, onSelect, item])

  const state: PopupMenuCheckboxItem.State = React.useMemo(
    () => ({
      highlighted: item.isHighlighted,
      disabled,
      checked,
      first: item.positional.first,
      last: item.positional.last,
      firstInGroup: item.positional.firstInGroup,
      lastInGroup: item.positional.lastInGroup,
    }),
    [item.isHighlighted, disabled, checked, item.positional],
  )

  const checkboxItemContextValue: CheckboxItemContextValue = React.useMemo(
    () => ({
      ...item.contextValue,
      checked,
      toggle: toggleChecked,
    }),
    [item.contextValue, checked, toggleChecked],
  )

  // Merge user-provided handlers with item handlers
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) {
        item.handlers.onClick(event)
      }
    },
    [onClick, item.handlers],
  )

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

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'checkbox-item')

  const element = useRender({
    render,
    ref: [item.ref, item.rowRef, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      id: item.id,
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
    enabled: item.isVisible,
    defaultTagName: 'div',
  })

  if (!item.isVisible) {
    return null
  }

  return (
    <ItemContext.Provider value={item.contextValue}>
      <CheckboxItemContext.Provider value={checkboxItemContextValue}>
        {element}
      </CheckboxItemContext.Provider>
    </ItemContext.Provider>
  )
})

export namespace PopupMenuCheckboxItem {
  export type State = PopupMenuCheckboxItemState
  export interface Props extends PopupMenuCheckboxItemProps {}
}
