import type { SubmenuNode, Menu, MenuDef } from '@bazza-ui/menu'
import { mergeProps } from '@bazza-ui/theming'
import * as React from 'react'
import { useSubCtx } from '../contexts/submenu-context.js'
import { useScopedTheme } from '../contexts/theme-context.js'
import { Positioner } from './positioner.js'
import { PopupMenuList } from './list.js'
import type { ContentBindAPI } from '../types.js'

interface PopupMenuSubmenuContentProps<T> {
  node: SubmenuNode<T>
}

/**
 * PopupMenuSubmenuContent renders the positioned submenu content.
 * Handles focus transfer and hover suppression for keyboard-triggered submenus.
 * Integrates with theming system to apply slots, classNames, and slotProps.
 */
export function PopupMenuSubmenuContent<T>({
  node,
}: PopupMenuSubmenuContentProps<T>) {
  const sub = useSubCtx()!
  const { slots, classNames, slotProps } = useScopedTheme()

  const suppressHover = sub.pendingOpenModalityRef.current === 'keyboard'

  React.useEffect(() => {
    sub.pendingOpenModalityRef.current = null
  }, [sub])

  // Convert submenu node to menu def with required id
  const menuDef: MenuDef<any> = React.useMemo(() => {
    const def = node.def
    return {
      id: node.id, // Use the node's id which is always defined
      title: def.title,
      inputPlaceholder: def.inputPlaceholder,
      hideSearchUntilActive: def.hideSearchUntilActive,
      nodes: def.nodes,
      loader: def.loader,
      defaults: def.defaults,
      virtualization: def.virtualization,
      search: def.search,
      ui: def.ui,
      input: def.input,
      open: def.open,
    }
  }, [node])

  // Create bind API for submenu content
  const contentBind: ContentBindAPI = {
    getContentProps: (overrides) =>
      mergeProps(
        {
          ref: sub.contentRef,
          'data-surface-id': sub.childSurfaceId,
          role: 'menu' as const,
          tabIndex: -1,
          'data-slot': 'popup-menu-submenu-content',
          'data-popup-menu-surface': true,
          'data-sub-menu': 'true',
          ...slotProps?.content,
          className: classNames?.content,
        },
        overrides,
      ) as any,
  }

  return (
    <Positioner>
      {slots.Content({
        children: (
          <PopupMenuList menu={menuDef} query="" showInput={false} open={sub.open} />
        ),
        bind: contentBind,
      })}
    </Positioner>
  )
}
