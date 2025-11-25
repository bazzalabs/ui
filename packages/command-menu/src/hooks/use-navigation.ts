import type { MenuDef } from '@bazza-ui/menu'
import * as React from 'react'
import type { NavigationStackEntry } from '../types.js'

export interface UseNavigationOptions {
  /** Callback when query changes (for clearing on navigation) */
  onQueryChange?: (query: string) => void
  /** Callback when navigation changes */
  onNavigationChange?: (event: {
    direction: 'forward' | 'back'
    prevBreadcrumbs: NavigationStackEntry[]
    nextBreadcrumbs: NavigationStackEntry[]
  }) => void
}

export interface UseNavigationResult<T> {
  /** Current menu being displayed */
  currentMenu: MenuDef<T>
  /** Navigation stack for paged navigation */
  navigationStack: NavigationStackEntry[]
  /** Push a submenu onto the stack */
  pushSubmenu: (entry: NavigationStackEntry) => void
  /** Pop the current submenu from the stack */
  popSubmenu: () => void
  /** Clear the entire navigation stack */
  clearStack: () => void
  /** Whether we're in a submenu (stack has items) */
  isInSubmenu: boolean
}

/**
 * Deep search for a submenu node by ID anywhere in the tree
 */
function findSubmenuDeep(
  nodes: Array<any>,
  submenuId: string,
): any | undefined {
  for (const node of nodes) {
    if (node.kind === 'submenu' && node.id === submenuId) {
      return node
    }
    if (node.kind === 'submenu' && node.nodes) {
      const found = findSubmenuDeep(node.nodes, submenuId)
      if (found) return found
    }
  }
  return undefined
}

/**
 * Hook for managing navigation stack and current menu state.
 * Consolidates navigation logic from CommandMenuRoot.
 */
export function useNavigation<T>(
  menu: MenuDef<T>,
  options: UseNavigationOptions = {},
): UseNavigationResult<T> {
  const { onQueryChange, onNavigationChange } = options

  // Navigation stack for paged navigation
  const [navigationStack, setNavigationStack] = React.useState<
    NavigationStackEntry[]
  >([])

  // Track previous navigation stack to detect changes
  const prevNavigationStackRef = React.useRef<NavigationStackEntry[]>([])

  // Current menu to display - derive from menu prop using navigation stack
  const currentMenu = React.useMemo(() => {
    if (navigationStack.length === 0) {
      return menu
    }

    // Traverse the navigation stack to find the current submenu
    let currentMenuDef: MenuDef<any> = menu
    let isFirstEntry = true

    for (const entry of navigationStack) {
      // Find the submenu node in the current menu's nodes
      const nodes = currentMenuDef.nodes || []
      let submenuNode = nodes.find(
        (n) => n.kind === 'submenu' && n.id === entry.menuId,
      )

      // If not found and this is the first entry (from root), try deep search
      // This handles deep search results that inject nested submenus into root results
      if (!submenuNode && isFirstEntry) {
        submenuNode = findSubmenuDeep(menu.nodes || [], entry.menuId)
      }
      isFirstEntry = false

      if (submenuNode && submenuNode.kind === 'submenu') {
        // Check if this submenu has injected deep search results
        const hasInjectedResults = (submenuNode as any).__originalLoader

        // Convert SubmenuDef to MenuDef
        // If deep search injected results, clear nodes and restore original loader
        currentMenuDef = {
          id: submenuNode.id || entry.menuId,
          title: submenuNode.title,
          nodes: hasInjectedResults ? undefined : submenuNode.nodes,
          loader: hasInjectedResults
            ? (submenuNode as any).__originalLoader
            : submenuNode.loader,
          search: submenuNode.search,
          defaults: submenuNode.defaults,
          ui: submenuNode.ui,
          virtualization: submenuNode.virtualization,
          inputPlaceholder: submenuNode.inputPlaceholder,
          hideSearchUntilActive: submenuNode.hideSearchUntilActive,
          input: submenuNode.input,
          open: submenuNode.open,
          middleware: submenuNode.middleware,
        } as MenuDef<any>
      } else {
        // Submenu not found - fallback to root menu
        console.warn(`Submenu not found: ${entry.menuId}`)
        return menu
      }
    }

    return currentMenuDef
  }, [menu, navigationStack])

  // Push submenu onto stack
  const pushSubmenu = React.useCallback(
    (entry: NavigationStackEntry) => {
      // Clear query when navigating to a submenu
      onQueryChange?.('')
      setNavigationStack((prev) => [...prev, entry])
    },
    [onQueryChange],
  )

  // Pop submenu from stack
  const popSubmenu = React.useCallback(() => {
    // Clear query when navigating back
    onQueryChange?.('')
    setNavigationStack((prev) => {
      if (prev.length === 0) return prev
      return prev.slice(0, -1)
    })
  }, [onQueryChange])

  // Clear stack
  const clearStack = React.useCallback(() => {
    setNavigationStack([])
  }, [])

  // Fire onNavigationChange when navigation stack changes
  React.useEffect(() => {
    const prevStack = prevNavigationStackRef.current
    const currentStack = navigationStack

    // Skip if both stacks are empty (initial render)
    if (prevStack.length === 0 && currentStack.length === 0) {
      return
    }

    // Determine direction based on stack length change
    if (currentStack.length > prevStack.length) {
      // Forward navigation (pushed)
      onNavigationChange?.({
        direction: 'forward',
        prevBreadcrumbs: prevStack,
        nextBreadcrumbs: currentStack,
      })
    } else if (currentStack.length < prevStack.length) {
      // Back navigation (popped)
      onNavigationChange?.({
        direction: 'back',
        prevBreadcrumbs: prevStack,
        nextBreadcrumbs: currentStack,
      })
    }

    // Update ref for next comparison
    prevNavigationStackRef.current = currentStack
  }, [navigationStack, onNavigationChange])

  return {
    currentMenu,
    navigationStack,
    pushSubmenu,
    popSubmenu,
    clearStack,
    isInSubmenu: navigationStack.length > 0,
  }
}
