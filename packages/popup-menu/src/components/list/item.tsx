import { MenuItemPrimitive } from '@bazza-ui/menu'
import type { ItemNode, SearchContext, SurfaceStore } from '@bazza-ui/menu'
import type { VirtualItem } from '@tanstack/react-virtual'
import * as React from 'react'
import type { PopupMenuSlots } from '../../types.js'

export interface PopupMenuItemProps<T> {
  /** Reference to the HTML element */
  ref?: React.Ref<HTMLElement>
  /** Virtual item for virtualized rendering */
  virtualItem?: VirtualItem
  /** Item node */
  node: ItemNode<T>
  /** Surface store for state management */
  store: SurfaceStore<T>
  /** Search context */
  search?: SearchContext
  /** Additional className */
  className?: string
  /** Display mode (popover/drawer/modal) */
  mode?: 'popover' | 'drawer' | 'modal'
  /** onSelect handler */
  onSelect?: (args: { node: ItemNode<T>; search?: SearchContext }) => void
  /** Slot function to render the item */
  slot: PopupMenuSlots<T>['Item']
}

/**
 * Wrapper component for MenuItemPrimitive that handles slot rendering internally.
 * This removes the need for children-as-function pattern in parent components.
 */
export const PopupMenuItem = React.forwardRef(function PopupMenuItem<T>(
  {
    node,
    store,
    search,
    className,
    mode = 'popover',
    onSelect,
    slot,
    virtualItem,
  }: PopupMenuItemProps<T>,
  ref: React.Ref<HTMLElement>,
) {
  return (
    <MenuItemPrimitive
      ref={ref}
      node={node}
      store={store}
      search={search}
      className={className}
      mode={mode}
      onSelect={onSelect}
      virtualItem={virtualItem}
    >
      {(bind) => slot({ node, bind, search })}
    </MenuItemPrimitive>
  )
}) as <T>(
  props: PopupMenuItemProps<T> & { ref?: React.Ref<HTMLElement> },
) => React.ReactElement
