import type { SubmenuNode, Menu, MenuDef } from '@bazza-ui/menu'
import * as React from 'react'
import { useSubCtx } from '../contexts/submenu-context.js'
import { Positioner } from './positioner.js'
import { PopupMenuList } from './list.js'

interface PopupMenuSubmenuContentProps<T> {
  node: SubmenuNode<T>
}

/**
 * PopupMenuSubmenuContent renders the positioned submenu content.
 * Handles focus transfer and hover suppression for keyboard-triggered submenus.
 */
export function PopupMenuSubmenuContent<T>({
  node,
}: PopupMenuSubmenuContentProps<T>) {
  const sub = useSubCtx()!

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

  return (
    <Positioner>
      <PopupMenuList
        menu={menuDef}
        query=""
        showInput={false}
        open={sub.open}
      />
    </Positioner>
  )
}
