import * as React from 'react'
import { useRoot } from '../../contexts/root-context.js'
import { useSub } from '../submenu/submenu-context.js'
import type {
  PopupMenuDef,
  PopupSubmenuDef,
  PopupSubmenuNode,
} from '../../types.js'
import { Surface } from '../surface/surface.js'
import { Positioner } from '../positioner/positioner.js'

interface PopupMenuSubmenuContentProps<T = unknown> {
  node: PopupSubmenuNode<T>
}

/**
 * PopupMenuSubmenuContent renders the positioned submenu content.
 * Uses the shared Surface component for consistent behavior with root menus.
 */
export function PopupMenuSubmenuContent<T>({
  node,
}: PopupMenuSubmenuContentProps<T>) {
  const sub = useSub()
  const root = useRoot()

  // Convert submenu node to menu def with required id
  const menuDef: PopupMenuDef<T> | PopupSubmenuDef<T> = React.useMemo(() => {
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
      <Surface
        menu={menuDef}
        open={sub?.open}
        contentRef={sub?.contentRef}
        defaults={baseDefaults}
      />
    </Positioner>
  )
}
