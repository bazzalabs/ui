import type { MenuDef, SubmenuNode } from '@bazza-ui/menu'
import * as React from 'react'
import { useSubCtx } from '../contexts/submenu-context.js'
import { PopupMenuContent } from './content.js'
import { Positioner } from './positioner.js'

interface PopupMenuSubmenuContentProps<T> {
  node: SubmenuNode<T>
}

/**
 * PopupMenuSubmenuContent renders the positioned submenu content.
 * Uses the shared PopupMenuContent component for consistent behavior with root menus.
 */
export function PopupMenuSubmenuContent<T>({
  node,
}: PopupMenuSubmenuContentProps<T>) {
  const sub = useSubCtx()!

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
      {(popupProps: React.HTMLAttributes<HTMLElement>) => (
        <PopupMenuContent
          menu={menuDef}
          open={sub.open}
          contentRef={sub.contentRef}
          popupProps={popupProps}
        />
      )}
    </Positioner>
  )
}
