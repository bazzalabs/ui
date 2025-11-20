import type { MenuDef, SubmenuDef, SubmenuNode } from '@bazza-ui/menu'
import * as React from 'react'
import { useRoot } from '../contexts/root-context.js'
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
  const root = useRoot()

  // Convert submenu node to menu def with required id
  const menuDef: MenuDef<any> | SubmenuDef<any> = React.useMemo(() => {
    const def = node.def

    // IMPORTANT: If this submenu has deep search injected results (__originalLoader),
    // restore the original loader to prevent stale/filtered results when opening the submenu.
    // The __originalLoader is set by deep search injection and contains the original loader function.
    // When a submenu is opened, it should start fresh with its own query, not the parent's cached results.
    const hasOriginalLoader = (def as any).__originalLoader

    return {
      ...def,
      // Clear injected nodes if we have an original loader - they'll be loaded fresh with the submenu's own query
      nodes: hasOriginalLoader ? undefined : def.nodes,
      // Restore the original loader if it exists, otherwise use the current loader
      loader: hasOriginalLoader ? (def as any).__originalLoader : def.loader,
    }
  }, [node])

  // Get base defaults (factory + instance) from root context
  // This ensures submenus don't inherit parent surface-level defaults
  const baseDefaults = root.defaults

  return (
    <Positioner>
      {(popupProps: React.HTMLAttributes<HTMLElement>) => (
        <PopupMenuContent
          menu={menuDef as MenuDef<any>}
          open={sub.open}
          contentRef={sub.contentRef}
          popupProps={popupProps}
          defaults={baseDefaults}
        />
      )}
    </Positioner>
  )
}
