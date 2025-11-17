import type { MenuDef, SubmenuNode } from '@bazza-ui/menu'
import * as React from 'react'
import { useSub } from '../contexts/submenu-context.js'
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
  const sub = useSub()!

  // Convert submenu node to menu def with required id
  const menuDef: MenuDef<any> = React.useMemo(() => {
    const def = node.def

    // IMPORTANT: If this submenu has deep search injected results (__originalLoader),
    // restore the original loader to prevent stale/filtered results when opening the submenu.
    // The __originalLoader is set by deep search injection and contains the original loader function.
    // When a submenu is opened, it should start fresh with its own query, not the parent's cached results.
    const hasOriginalLoader = (def as any).__originalLoader

    return {
      id: node.id, // Use the node's id which is always defined
      title: def.title,
      inputPlaceholder: def.inputPlaceholder,
      hideSearchUntilActive: def.hideSearchUntilActive,
      // Clear injected nodes if we have an original loader - they'll be loaded fresh with the submenu's own query
      nodes: hasOriginalLoader ? undefined : def.nodes,
      // Restore the original loader if it exists, otherwise use the current loader
      loader: hasOriginalLoader ? (def as any).__originalLoader : def.loader,
      defaults: def.defaults,
      virtualization: def.virtualization,
      search: def.search,
      ui: def.ui,
      input: def.input,
      open: def.open,
    }
  }, [node])

  // Get parent menu's defaults to pass to submenu
  const parentDefaults = node.parent?.defaults

  return (
    <Positioner>
      {(popupProps: React.HTMLAttributes<HTMLElement>) => (
        <PopupMenuContent
          menu={menuDef}
          open={sub.open}
          contentRef={sub.contentRef}
          popupProps={popupProps}
          defaults={parentDefaults}
        />
      )}
    </Positioner>
  )
}
