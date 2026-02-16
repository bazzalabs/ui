'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { ItemContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { usePopupMenuItem } from '../../hooks/use-popup-menu-item.js'
import { useRadioGroupContext } from '../radio-group/radio-group-context.js'
import { PopupMenuRadioItemDataAttributes } from './radio-item.data-attrs.js'
import {
  RadioItemContext,
  type RadioItemContextValue,
} from './radio-item-context.js'

export { PopupMenuRadioItemDataAttributes }

export interface PopupMenuRadioItemState extends Record<string, unknown> {
  /**
   * Whether the item is highlighted (via keyboard or pointer).
   */
  highlighted: boolean
  /**
   * Whether the item is disabled.
   */
  disabled: boolean
  /**
   * Whether the item is currently selected/checked.
   */
  checked: boolean
}

export interface PopupMenuRadioItemProps
  extends ComponentProps<'div', PopupMenuRadioItem.State> {
  /**
   * The value to set when this item is selected.
   * This is required and must be unique within the RadioGroup.
   */
  value: string

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
   * Callback when this item is selected.
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
      ? { [PopupMenuRadioItemDataAttributes.checked]: '' }
      : { [PopupMenuRadioItemDataAttributes.unchecked]: '' },
  highlighted: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuRadioItemDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuRadioItemDataAttributes.disabled]: '' } : null,
}

/**
 * A selectable radio item within a RadioGroup.
 * Only one RadioItem can be selected at a time within a RadioGroup.
 * Renders a `<div>` element with role="menuitemradio".
 */
export const PopupMenuRadioItem = React.forwardRef(function PopupMenuRadioItem(
  props: PopupMenuRadioItemProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    id,
    value,
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

  const radioGroupContext = useRadioGroupContext()

  // Combine disabled from props and RadioGroup
  const localDisabled = disabledProp || radioGroupContext.disabled

  // Check if this item is selected
  const checked = radioGroupContext.value === value

  const item = usePopupMenuItem({
    id,
    keywords,
    disabled: localDisabled,
    forceMount,
    shortcut,
    forceOrder,
    forceScore,
    closeOnClick,
    children,
  })

  const disabled = item.disabled

  // Register the select handler that sets the radio value
  // Note: closeOnClick is handled by usePopupMenuItem's onAfterSelect
  React.useEffect(() => {
    const handleSelect = () => {
      if (disabled) return
      radioGroupContext.setValue(value)
      onSelect?.()
    }
    return item.registerSelect(handleSelect)
  }, [disabled, radioGroupContext, value, onSelect, item])

  const state: PopupMenuRadioItem.State = React.useMemo(
    () => ({ highlighted: item.isHighlighted, disabled, checked }),
    [item.isHighlighted, disabled, checked],
  )

  const radioItemContextValue: RadioItemContextValue = React.useMemo(
    () => ({
      ...item.contextValue,
      checked,
    }),
    [item.contextValue, checked],
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
  const slotAttr = getSlotAttribute(componentName, 'radio-item')

  const element = useRender({
    render,
    ref: [item.ref, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      id: item.id,
      role: 'menuitemradio',
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
      <RadioItemContext.Provider value={radioItemContextValue}>
        {element}
      </RadioItemContext.Provider>
    </ItemContext.Provider>
  )
})

export namespace PopupMenuRadioItem {
  export type State = PopupMenuRadioItemState
  export interface Props extends PopupMenuRadioItemProps {}
}
