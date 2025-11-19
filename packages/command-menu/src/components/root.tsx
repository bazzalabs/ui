import { type MenuDef, normalizeMenuDef } from '@bazza-ui/menu'
import * as Dialog from '@radix-ui/react-dialog'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import {
  type CommandMenuContextValue,
  CommandMenuProvider,
} from '../context.js'
import type { CommandMenuProps, NavigationStackEntry } from '../types.js'

export function CommandMenuRoot<T = unknown>({
  open: openProp,
  onOpenChange,
  defaultOpen,
  menu: menuProp,
  vimBindings = true,
  dir = 'ltr',
  showBreadcrumbs = true,
  onQueryChange,
  onNavigationChange,
  children,
}: CommandMenuProps<T>) {
  // Normalize the menu to inject inferred IDs into all nodes
  const menu = React.useMemo(() => normalizeMenuDef(menuProp), [menuProp])
  // Controlled/uncontrolled open state
  const [open, setOpen] = useControllableState({
    prop: openProp,
    onChange: onOpenChange,
    defaultProp: defaultOpen ?? false,
  })

  // Navigation stack for paged navigation
  const [navigationStack, setNavigationStack] = React.useState<
    NavigationStackEntry[]
  >([])

  // Track previous navigation stack to detect changes
  const prevNavigationStackRef = React.useRef<NavigationStackEntry[]>([])

  // Shared input ref for focus management
  const inputRef = React.useRef<HTMLInputElement>(null)

  /**
   * Deep search for a submenu node by ID anywhere in the tree
   */
  const findSubmenuDeep = React.useCallback(
    (nodes: Array<any>, submenuId: string): any | undefined => {
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
    },
    [],
  )

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
  }, [menu, navigationStack, findSubmenuDeep])

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

  // Clear stack when dialog closes
  React.useEffect(() => {
    if (!open) {
      clearStack()
    }
  }, [open, clearStack])

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

  const contextValue = React.useMemo(
    () =>
      ({
        rootMenu: menu,
        currentMenu,
        navigationStack,
        pushSubmenu,
        popSubmenu,
        clearStack,
        isInSubmenu: navigationStack.length > 0,
        showBreadcrumbs,
        vimBindings,
        dir,
        onOpenChange: setOpen,
        onQueryChange,
        inputRef,
      }) as CommandMenuContextValue<T>,
    [
      menu,
      currentMenu,
      navigationStack,
      pushSubmenu,
      popSubmenu,
      clearStack,
      showBreadcrumbs,
      vimBindings,
      dir,
      setOpen,
      onQueryChange,
      inputRef,
    ],
  )

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <CommandMenuProvider value={contextValue}>{children}</CommandMenuProvider>
    </Dialog.Root>
  )
}
