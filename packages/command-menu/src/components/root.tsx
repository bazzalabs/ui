import type { MenuDef } from '@bazza-ui/menu'
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
  menu,
  vimBindings = true,
  dir = 'ltr',
  showBreadcrumbs = true,
  onQueryChange,
  onNavigationChange,
  children,
}: CommandMenuProps<T>) {
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

  // Shared input ref for focus management
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Current menu to display - derive from menu prop using navigation stack
  const currentMenu = React.useMemo(() => {
    if (navigationStack.length === 0) {
      return menu
    }

    // Traverse the navigation stack to find the current submenu
    let currentMenuDef: MenuDef<any> = menu

    for (const entry of navigationStack) {
      // Find the submenu node in the current menu's nodes
      const nodes = currentMenuDef.nodes || []
      const submenuNode = nodes.find(
        (n) => n.kind === 'submenu' && n.id === entry.menuId,
      )

      if (submenuNode && submenuNode.kind === 'submenu') {
        // Convert SubmenuDef to MenuDef
        currentMenuDef = {
          id: submenuNode.id || entry.menuId,
          title: submenuNode.title,
          nodes: submenuNode.nodes,
          loader: submenuNode.loader,
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
      setNavigationStack((prev) => {
        const nextStack = [...prev, entry]
        // Fire navigation change callback
        onNavigationChange?.({
          direction: 'forward',
          prevBreadcrumbs: prev,
          nextBreadcrumbs: nextStack,
        })
        return nextStack
      })
    },
    [onQueryChange, onNavigationChange],
  )

  // Pop submenu from stack
  const popSubmenu = React.useCallback(() => {
    // Clear query when navigating back
    onQueryChange?.('')
    setNavigationStack((prev) => {
      if (prev.length === 0) return prev
      const newStack = prev.slice(0, -1)
      // Fire navigation change callback
      onNavigationChange?.({
        direction: 'back',
        prevBreadcrumbs: prev,
        nextBreadcrumbs: newStack,
      })
      return newStack
    })
  }, [onQueryChange, onNavigationChange])

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

  const contextValue = React.useMemo(
    () =>
      ({
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
