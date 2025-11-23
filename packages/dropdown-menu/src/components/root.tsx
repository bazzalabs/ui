import { Popover } from '@base-ui-components/react/popover'
import { EventBus, type MenuDef, type MenuNodeDefaults } from '@bazza-ui/menu'
import {
  type InteractionGuardOptions,
  RootProvider,
} from '@bazza-ui/popup-menu'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import type { DropdownMenuControl } from '../control.js'
import { RootContextProvider } from '../contexts/root-context.js'
import type { DropdownMenuDef } from '../types.js'

const DROPDOWN_EVENTS = {
  OPEN: 'dropdown-menu:open',
  CLOSE: 'dropdown-menu:close',
  LOADING_START: 'loading-start',
  LOADING_END: 'loading-end',
  ERROR: 'error',
  ERROR_CLEAR: 'error-clear',
  MENU_DISABLE: 'menu-disable',
  MENU_ENABLE: 'menu-enable',
  REFRESH: 'refresh',
  REFRESH_SUBMENU: 'refresh-submenu',
  ITEM_SELECT: 'item-select',
} as const

export interface DropdownMenuRootProps<T = unknown>
  extends Partial<InteractionGuardOptions> {
  /** Menu definition */
  menu: DropdownMenuDef<T>
  /** Children (typically Trigger and Content) */
  children: React.ReactNode
  /** Callback when menu opens/closes */
  onOpenChange?: (open: boolean) => void
  /** Whether the menu is open (controlled) */
  open?: boolean
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean
  /** Whether clicking outside closes the menu */
  modal?: boolean
  /** Base defaults (factory + instance) shared across the entire menu */
  defaults?: Partial<MenuNodeDefaults<T>>
  /** Control ref for programmatic access */
  controlRef?: React.Ref<DropdownMenuControl<T>>
}

/**
 * DropdownMenuRoot - Root component that manages state and provides context
 */
export function DropdownMenuRoot<T = unknown>({
  menu,
  children,
  onOpenChange,
  open: controlledOpen,
  defaultOpen = false,
  modal = true,
  defaults,
  controlRef,
  // InteractionGuard options
  scopeAttr,
  disableOutsidePointerEvents,
  onEscapeKeyDown,
  onPointerDownOutside,
  onFocusOutside,
  onInteractOutside,
  onDismiss,
  surfaceSelector,
  branchAttr,
}: DropdownMenuRootProps<T>) {
  const [open, setOpen] = useControllableState({
    prop: controlledOpen,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  })

  const triggerRef = React.useRef<HTMLElement>(null)
  const scopeId = React.useId()

  // Event bus for control
  const eventBus = React.useRef(new EventBus())

  // Control state
  const [controlState, setControlState] = React.useState({
    loading: false,
    error: null as string | null,
    disabled: false,
  })

  // Submenu tracking
  const openSubmenus = React.useRef<Map<string, number>>(new Map())

  const closeAllSurfaces = React.useCallback(() => {
    setOpen(false)
  }, [setOpen])

  // Create control implementation
  const control = React.useMemo<DropdownMenuControl<T>>(() => {
    return {
      // ===== Core MenuControl =====
      getMenu: () => menu as MenuDef<T>,
      getState: () => ({
        menu: menu as MenuDef<T>,
        loading: controlState.loading,
        error: controlState.error,
        disabled: controlState.disabled,
        open,
        openSubmenus: new Map(openSubmenus.current),
      }),
      isLoading: () => controlState.loading,
      getError: () => controlState.error,
      setLoading: (loading, message) => {
        setControlState((prev) => ({ ...prev, loading }))
        eventBus.current.emit(
          loading ? DROPDOWN_EVENTS.LOADING_START : DROPDOWN_EVENTS.LOADING_END,
          { message },
        )
      },
      setError: (error) => {
        setControlState((prev) => ({ ...prev, error }))
        if (error) {
          eventBus.current.emit(DROPDOWN_EVENTS.ERROR, { error })
        } else {
          eventBus.current.emit(DROPDOWN_EVENTS.ERROR_CLEAR)
        }
      },
      clearError: () => {
        setControlState((prev) => ({ ...prev, error: null }))
        eventBus.current.emit(DROPDOWN_EVENTS.ERROR_CLEAR)
      },
      refresh: async () => {
        eventBus.current.emit(DROPDOWN_EVENTS.REFRESH)
      },
      refreshSubmenu: async (submenuId) => {
        eventBus.current.emit(DROPDOWN_EVENTS.REFRESH_SUBMENU, { submenuId })
      },
      selectItem: (itemId) => {
        eventBus.current.emit(DROPDOWN_EVENTS.ITEM_SELECT, { itemId })
      },
      disable: () => {
        setControlState((prev) => ({ ...prev, disabled: true }))
        eventBus.current.emit(DROPDOWN_EVENTS.MENU_DISABLE)
        return () => {
          setControlState((prev) => ({ ...prev, disabled: false }))
          eventBus.current.emit(DROPDOWN_EVENTS.MENU_ENABLE)
        }
      },
      enable: () => {
        setControlState((prev) => ({ ...prev, disabled: false }))
        eventBus.current.emit(DROPDOWN_EVENTS.MENU_ENABLE)
      },
      setDisabled: (disabled: boolean) => {
        setControlState((prev) => ({ ...prev, disabled }))
        eventBus.current.emit(
          disabled ? DROPDOWN_EVENTS.MENU_DISABLE : DROPDOWN_EVENTS.MENU_ENABLE,
        )
      },
      on: (event, handler) => eventBus.current.on(event, handler),
      emit: (event, data) => eventBus.current.emit(event, data),

      // ===== PopupMenuControl =====
      isOpen: () => open,
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((prev) => !prev),
      closeAllSurfaces: () => {
        closeAllSurfaces()
        openSubmenus.current.clear()
      },
      openSubmenu: (submenuId: string) => {
        // TODO: Implement submenu opening
        console.warn('openSubmenu not yet implemented:', submenuId)
      },
      closeSubmenu: (submenuId: string) => {
        openSubmenus.current.delete(submenuId)
      },
      getOpenSubmenus: () => Array.from(openSubmenus.current.keys()),
      getPosition: () => null,
    }
  }, [menu, controlState, open, setOpen, closeAllSurfaces])

  // Expose via controlRef
  React.useEffect(() => {
    if (!controlRef) return

    if (typeof controlRef === 'function') {
      controlRef(control)
    } else {
      ;(controlRef as React.MutableRefObject<DropdownMenuControl<T>>).current =
        control
    }
  }, [control, controlRef])

  // Cleanup event bus on unmount
  React.useEffect(() => {
    return () => eventBus.current.clear()
  }, [])

  const rootValue = React.useMemo(
    () => ({
      scopeId,
      open,
      onOpenChange: setOpen,
      closeAllSurfaces,
      triggerRef,
      control,
      // InteractionGuard options
      interactionGuardOptions: {
        scopeAttr,
        disableOutsidePointerEvents,
        onEscapeKeyDown,
        onPointerDownOutside,
        onFocusOutside,
        onInteractOutside,
        onDismiss,
        surfaceSelector,
        branchAttr,
      },
    }),
    [
      scopeId,
      open,
      setOpen,
      closeAllSurfaces,
      control,
      scopeAttr,
      disableOutsidePointerEvents,
      onEscapeKeyDown,
      onPointerDownOutside,
      onFocusOutside,
      onInteractOutside,
      onDismiss,
      surfaceSelector,
      branchAttr,
    ],
  )

  return (
    <RootContextProvider value={rootValue}>
      <Popover.Root open={open} onOpenChange={setOpen} modal={modal}>
        <RootProvider
          scopeId={scopeId}
          onClose={closeAllSurfaces}
          interactionGuardOptions={rootValue.interactionGuardOptions}
          defaults={defaults as any}
        >
          {children}
        </RootProvider>
      </Popover.Root>
    </RootContextProvider>
  )
}
