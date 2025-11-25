import { EventBus, normalizeMenuDef } from '@bazza-ui/menu'
import * as Dialog from '@radix-ui/react-dialog'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import type { StoreApi } from 'zustand'
import type { CommandMenuControl } from '../control.js'
import {
  type CommandMenuContextValue,
  CommandMenuProvider,
} from '../context.js'
import { COMMAND_MENU_EVENTS } from '../events.js'
import { useNavigation } from '../hooks/use-navigation.js'
import {
  CommandMenuStoreProvider,
  createCommandMenuStore,
  type CommandMenuStore,
} from '../store/index.js'
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
  controlRef,
  children,
}: CommandMenuProps<T>) {
  // Generate scope ID for this menu instance
  const scopeId = React.useMemo(
    () => `command-menu-${Math.random().toString(36).slice(2, 9)}`,
    [],
  )

  // Create the global store for this menu tree
  const storeRef = React.useRef<StoreApi<CommandMenuStore<T>> | null>(null)
  if (!storeRef.current) {
    storeRef.current = createCommandMenuStore<T>({
      scopeId,
      dir,
      vimBindings,
      showBreadcrumbs,
    })
  }
  const store = storeRef.current

  // Normalize the menu to inject inferred IDs into all nodes
  const menu = React.useMemo(() => normalizeMenuDef(menuProp), [menuProp])

  // Set root menu def in store when menu changes
  React.useEffect(() => {
    store.getState().setRootMenuDef(menu as any)
  }, [menu, store])

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

  // Event bus for control
  const eventBus = React.useRef(new EventBus())

  // Internal state for control
  const [controlState, setControlState] = React.useState({
    loading: false,
    error: null as string | null,
    disabled: false,
  })

  // Create control implementation
  const control = React.useMemo<CommandMenuControl<T>>(() => {
    const ctrl: CommandMenuControl<T> = {
      // ===== Core MenuControl (enable/disable only) =====
      getState: () => ({
        disabled: controlState.disabled,
      }),
      disable: () => {
        setControlState((prev) => ({ ...prev, disabled: true }))
        eventBus.current.emit(COMMAND_MENU_EVENTS.MENU_DISABLE)

        // Return cleanup function to re-enable
        return () => {
          setControlState((prev) => ({ ...prev, disabled: false }))
          eventBus.current.emit(COMMAND_MENU_EVENTS.MENU_ENABLE)

          // Return focus to input after re-enabling
          // Use requestAnimationFrame to ensure DOM has updated
          requestAnimationFrame(() => {
            inputRef.current?.focus()
          })
        }
      },
      enable: () => {
        setControlState((prev) => ({ ...prev, disabled: false }))
        eventBus.current.emit(COMMAND_MENU_EVENTS.MENU_ENABLE)

        // Return focus to input
        requestAnimationFrame(() => {
          inputRef.current?.focus()
        })
      },
      setDisabled: (disabled: boolean) => {
        setControlState((prev) => ({ ...prev, disabled }))
        eventBus.current.emit(
          disabled
            ? COMMAND_MENU_EVENTS.MENU_DISABLE
            : COMMAND_MENU_EVENTS.MENU_ENABLE,
        )

        // Return focus to input when enabling
        if (!disabled) {
          requestAnimationFrame(() => {
            inputRef.current?.focus()
          })
        }
      },
    }
    return ctrl
  }, [controlState, inputRef])

  // Expose via controlRef
  React.useEffect(() => {
    if (!controlRef) return

    if (typeof controlRef === 'function') {
      controlRef(control)
    } else {
      ;(controlRef as React.MutableRefObject<CommandMenuControl<T>>).current =
        control
    }
  }, [control, controlRef])

  // Cleanup event bus on unmount
  React.useEffect(() => {
    return () => eventBus.current.clear()
  }, [])

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
        control, // Add control to context for middleware access
        disabled: controlState.disabled, // Menu-wide disabled state
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
      control,
      controlState.disabled,
    ],
  )

  // Sync open state to store
  React.useEffect(() => {
    store.getState().setOpen(open ?? false)
  }, [open, store])

  // Sync navigation stack to store
  React.useEffect(() => {
    const state = store.getState()
    // Only sync if stack has changed (to avoid loops)
    if (
      JSON.stringify(navigationStack) !== JSON.stringify(state.navigation.stack)
    ) {
      // Clear and rebuild the stack by pushing each entry
      state.clearNavigationStack()
      for (const entry of navigationStack) {
        state.pushSubmenu(entry)
      }
    }
  }, [navigationStack, store])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <CommandMenuStoreProvider store={store as any}>
        <CommandMenuProvider value={contextValue}>
          {children}
        </CommandMenuProvider>
      </CommandMenuStoreProvider>
    </Dialog.Root>
  )
}
