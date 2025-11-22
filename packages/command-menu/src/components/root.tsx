import { normalizeMenuDef } from '@bazza-ui/menu'
import * as Dialog from '@radix-ui/react-dialog'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import {
  type CommandMenuContextValue,
  CommandMenuProvider,
} from '../context.js'
import { useNavigation } from '../hooks/use-navigation.js'
import type { CommandMenuProps } from '../types.js'

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

  // Shared input ref for focus management
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Navigation state management (extracted to hook)
  const {
    currentMenu,
    navigationStack,
    pushSubmenu,
    popSubmenu,
    clearStack,
    isInSubmenu,
  } = useNavigation(menu, { onQueryChange, onNavigationChange })

  // Clear stack when dialog closes
  React.useEffect(() => {
    if (!open) {
      clearStack()
    }
  }, [open, clearStack])

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
