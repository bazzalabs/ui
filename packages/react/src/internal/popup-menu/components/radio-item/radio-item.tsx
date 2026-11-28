'use client'

import { useRender } from '@base-ui/react/use-render'
import { useStore } from '@base-ui/utils/store'
import type { RadioItemFields } from '@bazza-ui/menu-core'
import * as React from 'react'
import {
  resolveClassName,
  resolveStyle,
} from '../../../../utils/resolve-state-props.js'
import type { ComponentProps } from '../../../../utils/types.js'
import { ItemContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { usePopupMenuItem } from '../../hooks/use-popup-menu-item.js'
import { isSelected } from '../../store/RadioGroupStore.js'
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
  first: boolean
  last: boolean
  firstInGroup: boolean
  lastInGroup: boolean
}

export interface PopupMenuRadioItemProps
  extends RadioItemFields,
    Omit<ComponentProps<'div', PopupMenuRadioItem.State>, 'onSelect'> {}

const stateAttributesMapping = {
  checked: (value: unknown): Record<string, string> | null =>
    value
      ? { [PopupMenuRadioItemDataAttributes.checked]: '' }
      : { [PopupMenuRadioItemDataAttributes.unchecked]: '' },
  highlighted: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuRadioItemDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuRadioItemDataAttributes.disabled]: '' } : null,
  first: (value: unknown) =>
    value ? { [PopupMenuRadioItemDataAttributes.first]: '' } : null,
  last: (value: unknown) =>
    value ? { [PopupMenuRadioItemDataAttributes.last]: '' } : null,
  firstInGroup: (value: unknown) =>
    value ? { [PopupMenuRadioItemDataAttributes.firstInGroup]: '' } : null,
  lastInGroup: (value: unknown) =>
    value ? { [PopupMenuRadioItemDataAttributes.lastInGroup]: '' } : null,
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
    'aria-describedby': ariaDescribedBy,
    ...rest
  } = props

  const radioGroupContext = useRadioGroupContext()

  // Combine disabled from props and RadioGroup
  const localDisabled = disabledProp || radioGroupContext.disabled

  // Whether this item is selected: in the prop while one controls the group
  // (from the context, as fresh as this render's props), else in the group's
  // own value, read by this item's value from its store (a key selector), so
  // a change re-renders only the item that loses the selection and the one
  // that takes it.
  const ownSelected = useStore(radioGroupContext.store, isSelected, value)
  const { controlledValue } = radioGroupContext
  const checked =
    controlledValue === undefined ? ownSelected : controlledValue === value

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
    describedBy: ariaDescribedBy,
  })

  const disabled = item.disabled

  // Register the select handler that sets the radio value
  // Note: closeOnClick is handled by usePopupMenuItem's onAfterSelect
  React.useEffect(() => {
    const handleSelect = () => {
      if (disabled) return
      radioGroupContext.store.setValue(value)
      onSelect?.()
    }
    return item.registerSelect(handleSelect)
  }, [disabled, radioGroupContext, value, onSelect, item])

  const state: PopupMenuRadioItem.State = React.useMemo(
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
    ref: [item.ref, item.rowRef, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      id: item.id,
      role: 'menuitemradio',
      'aria-describedby': item.describedBy,
      tabIndex: -1,
      'aria-checked': checked,
      'aria-disabled': disabled || undefined,
      className: resolveClassName(className, state),
      style: resolveStyle(style, state),
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
