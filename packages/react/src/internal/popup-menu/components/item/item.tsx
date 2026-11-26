'use client'

import { useRender } from '@base-ui/react/use-render'
import type { ItemFields } from '@bazza-ui/menu-core'
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
import { PopupMenuItemDataAttributes } from './item.data-attrs.js'

export { PopupMenuItemDataAttributes }

export interface PopupMenuItemState extends Record<string, unknown> {
  /**
   * Whether the item is highlighted (via keyboard or pointer).
   */
  highlighted: boolean
  /**
   * Whether the item is disabled.
   */
  disabled: boolean
  first: boolean
  last: boolean
  firstInGroup: boolean
  lastInGroup: boolean
}

export interface PopupMenuItemProps
  extends ItemFields,
    Omit<ComponentProps<'div', PopupMenuItem.State>, 'onSelect'> {}

const stateAttributesMapping = {
  highlighted: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuItemDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuItemDataAttributes.disabled]: '' } : null,
  first: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuItemDataAttributes.first]: '' } : null,
  last: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuItemDataAttributes.last]: '' } : null,
  firstInGroup: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuItemDataAttributes.firstInGroup]: '' } : null,
  lastInGroup: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuItemDataAttributes.lastInGroup]: '' } : null,
}

/**
 * A selectable item in the popup menu.
 * Renders a `<div>` element with role="option".
 */
export const PopupMenuItem = React.forwardRef<
  HTMLDivElement,
  PopupMenuItem.Props
>(function PopupMenuItem(props, forwardedRef) {
  const {
    id,
    value,
    keywords,
    disabled: disabledProp = false,
    activatable = true,
    onSelect,
    forceMount = false,
    closeOnClick = true,
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

  const item = usePopupMenuItem({
    id,
    value,
    keywords,
    disabled: disabledProp,
    activatable,
    forceMount,
    shortcut,
    forceOrder,
    forceScore,
    onSelect,
    closeOnClick,
    children,
    describedBy: ariaDescribedBy,
  })

  const disabled = item.disabled

  const state: PopupMenuItem.State = React.useMemo(
    () => ({
      highlighted: item.isHighlighted,
      disabled,
      first: item.positional.first,
      last: item.positional.last,
      firstInGroup: item.positional.firstInGroup,
      lastInGroup: item.positional.lastInGroup,
    }),
    [item.isHighlighted, disabled, item.positional],
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

  // Wrap children with ItemContext.Provider so child components can access item state
  const wrappedChildren = (
    <ItemContext.Provider value={item.contextValue}>
      {children}
    </ItemContext.Provider>
  )

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'item')

  return useRender({
    render,
    ref: [item.ref, item.rowRef, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      id: item.id,
      role: 'option',
      'aria-describedby': item.describedBy,
      tabIndex: -1,
      'aria-selected': item.isHighlighted,
      'aria-disabled': disabled || undefined,
      className: resolveClassName(className, state),
      style: resolveStyle(style, state),
      onClick: handleClick,
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      children: wrappedChildren,
    },
    enabled: item.isVisible,
    defaultTagName: 'div',
  })
})

export namespace PopupMenuItem {
  export type State = PopupMenuItemState
  export interface Props extends PopupMenuItemProps {}
}
