'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { ItemContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useSubpageContext } from '../../contexts/subpage-context.js'
import { usePopupMenuItem } from '../../hooks/use-popup-menu-item.js'
import { PopupMenuSubpageBackItemDataAttributes } from './subpage-back-item.data-attrs.js'

export { PopupMenuSubpageBackItemDataAttributes }

export interface PopupMenuSubpageBackItemState extends Record<string, unknown> {
  /** Whether this is a subpage back item (always true). */
  subpageBackItem: boolean
  /** Whether the item is highlighted. */
  highlighted: boolean
  /** Whether the item is disabled. */
  disabled: boolean
}

const stateAttributesMapping = {
  subpageBackItem: (value: unknown) =>
    value
      ? { [PopupMenuSubpageBackItemDataAttributes.subpageBackItem]: '' }
      : null,
  highlighted: (value: unknown) =>
    value ? { [PopupMenuSubpageBackItemDataAttributes.highlighted]: '' } : null,
  disabled: (value: unknown) =>
    value ? { [PopupMenuSubpageBackItemDataAttributes.disabled]: '' } : null,
}

export interface PopupMenuSubpageBackItemProps
  extends ComponentProps<'div', PopupMenuSubpageBackItem.State> {
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
  /** Callback when this item is selected. */
  onSelect?: () => void
}

/**
 * A list row that navigates back one page in the current subpage stack.
 * Renders a `<div>` element with role="option".
 */
export const PopupMenuSubpageBackItem = React.forwardRef<
  HTMLDivElement,
  PopupMenuSubpageBackItem.Props
>(function PopupMenuSubpageBackItem(props, forwardedRef) {
  const {
    id,
    value,
    keywords,
    disabled: disabledProp = false,
    forceMount = false,
    onSelect,
    render,
    className,
    style,
    onClick,
    onPointerMove,
    onPointerDown,
    children,
    ...rest
  } = props

  const subpageContext = useSubpageContext()
  const focusOwnerStore = useFocusOwner()

  const handleBack = React.useCallback(() => {
    onSelect?.()

    const didGoBack = subpageContext.goBack()
    if (didGoBack && subpageContext.parentSurfaceId) {
      focusOwnerStore.setOwnerId(subpageContext.parentSurfaceId)
    }
  }, [onSelect, subpageContext, focusOwnerStore])

  const item = usePopupMenuItem({
    id,
    value,
    keywords,
    disabled: disabledProp,
    forceMount,
    closeOnClick: false,
    onSelect: handleBack,
    children,
  })

  const disabled = item.disabled

  const state: PopupMenuSubpageBackItem.State = React.useMemo(
    () => ({
      subpageBackItem: true,
      highlighted: item.isHighlighted,
      disabled,
    }),
    [item.isHighlighted, disabled],
  )

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

  const wrappedChildren = (
    <ItemContext.Provider value={item.contextValue}>
      {children}
    </ItemContext.Provider>
  )

  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'subpage-back-item')

  return useRender({
    render,
    ref: [item.ref, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      id: item.id,
      role: 'option',
      tabIndex: -1,
      'aria-selected': item.isHighlighted,
      'aria-disabled': disabled || undefined,
      className,
      style,
      onClick: handleClick,
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      children: wrappedChildren,
    },
    enabled: item.isVisible,
    defaultTagName: 'div',
  })
})

export namespace PopupMenuSubpageBackItem {
  export type State = PopupMenuSubpageBackItemState
  export interface Props extends PopupMenuSubpageBackItemProps {}
}
