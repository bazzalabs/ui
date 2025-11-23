import { EventBus, normalizeMenuDef } from '@bazza-ui/menu'
import * as Dialog from '@radix-ui/react-dialog'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import type { CommandMenuControl, CommandMenuControlState } from '../control.js'
import {
  type CommandMenuContextValue,
  CommandMenuProvider,
} from '../context.js'
import { COMMAND_MENU_EVENTS } from '../events.js'
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
  controlRef,
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
      // ===== Core MenuControl =====
      getMenu: () => currentMenu,
      getState: (): CommandMenuControlState<T> => ({
        menu: currentMenu as any, // MenuDef will be assigned to Menu (compatible)
        loading: controlState.loading,
        error: controlState.error,
        disabled: controlState.disabled,
        open,
        navigationStack,
        currentMenu,
      }),
      isLoading: () => controlState.loading,
      getError: () => controlState.error,
      setLoading: (loading, message) => {
        setControlState((prev) => ({ ...prev, loading }))
        eventBus.current.emit(
          loading
            ? COMMAND_MENU_EVENTS.LOADING_START
            : COMMAND_MENU_EVENTS.LOADING_END,
          {
            message,
          },
        )
      },
      setError: (error) => {
        setControlState((prev) => ({ ...prev, error }))
        if (error) {
          eventBus.current.emit(COMMAND_MENU_EVENTS.ERROR, { error })
        } else {
          eventBus.current.emit(COMMAND_MENU_EVENTS.ERROR_CLEAR)
        }
      },
      clearError: () => {
        setControlState((prev) => ({ ...prev, error: null }))
        eventBus.current.emit(COMMAND_MENU_EVENTS.ERROR_CLEAR)
      },
      refresh: async () => {
        // TODO: Implement loader refresh
        eventBus.current.emit(COMMAND_MENU_EVENTS.REFRESH)
      },
      refreshSubmenu: async (submenuId) => {
        // TODO: Implement submenu loader refresh
        eventBus.current.emit(COMMAND_MENU_EVENTS.REFRESH_SUBMENU, {
          submenuId,
        })
      },
      selectItem: (itemId) => {
        // TODO: Implement programmatic item selection
        eventBus.current.emit(COMMAND_MENU_EVENTS.ITEM_SELECT, { itemId })
      },
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
      on: (event, handler) => eventBus.current.on(event, handler),
      emit: (event, data) => eventBus.current.emit(event, data),

      // ===== CommandMenuControl =====
      isOpen: () => open,
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((prev) => !prev),
      focusInput: () => {
        inputRef.current?.focus()
      },
      navigateTo: (submenuId) => {
        // TODO: Find submenu by ID and push to stack
        console.warn('navigateTo not yet implemented:', submenuId)
      },
      goBack: () => {
        popSubmenu()
      },
      goToRoot: () => {
        clearStack()
      },
      getNavigationStack: () => navigationStack,
    }
    return ctrl
  }, [
    currentMenu,
    controlState,
    open,
    navigationStack,
    setOpen,
    onQueryChange,
    inputRef,
    popSubmenu,
    clearStack,
  ])

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

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <CommandMenuProvider value={contextValue}>{children}</CommandMenuProvider>
    </Dialog.Root>
  )
}
