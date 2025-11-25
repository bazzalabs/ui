import { Popover } from '@base-ui-components/react/popover'
import { EventBus, type MenuDef, type MenuNodeDefaults } from '@bazza-ui/menu'
import {
  type InteractionGuardOptions,
  RootProvider,
} from '@bazza-ui/popup-menu'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import { RootContextProvider } from '../contexts/root-context.js'
import type { DropdownMenuControl } from '../control.js'
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
      // ===== Core MenuControl (enable/disable only) =====
      getState: () => ({
        disabled: controlState.disabled,
      }),
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
    }
  }, [controlState])

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

  // Memoize interactionGuardOptions separately to prevent unnecessary re-renders
  // This is critical because changes to this object will cause RootProvider to
  // re-register surfaces, which resets activeId to null
  const interactionGuardOptions = React.useMemo(
    () => ({
      scopeAttr,
      disableOutsidePointerEvents,
      onEscapeKeyDown,
      onPointerDownOutside,
      onFocusOutside,
      onInteractOutside,
      onDismiss,
      surfaceSelector,
      branchAttr,
    }),
    [
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

  const rootValue = React.useMemo(
    () => ({
      scopeId,
      open,
      onOpenChange: setOpen,
      closeAllSurfaces,
      triggerRef,
      control,
      interactionGuardOptions,
    }),
    [
      scopeId,
      open,
      setOpen,
      closeAllSurfaces,
      control,
      interactionGuardOptions,
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
