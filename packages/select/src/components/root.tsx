import { Popover } from '@base-ui-components/react/popover'
import { EventBus, type MenuNodeDefaults } from '@bazza-ui/menu'
import {
  type InteractionGuardOptions,
  RootProvider,
} from '@bazza-ui/popup-menu'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import type { StoreApi } from 'zustand'
import { RootContextProvider } from '../contexts/root-context.js'
import type { SelectControl } from '../control.js'
import {
  createMultiSelectStore,
  createSelectStore,
  type SelectMenuStore,
  SelectMenuStoreProvider,
} from '../store/index.js'
import type { SelectMenuDef } from '../types.js'

const SELECT_EVENTS = {
  OPEN: 'select:open',
  CLOSE: 'select:close',
  VALUE_CHANGE: 'select:value-change',
  LOADING_START: 'loading-start',
  LOADING_END: 'loading-end',
  ERROR: 'error',
  ERROR_CLEAR: 'error-clear',
  MENU_DISABLE: 'menu-disable',
  MENU_ENABLE: 'menu-enable',
  REFRESH: 'refresh',
  ITEM_SELECT: 'item-select',
} as const

export interface SelectRootProps<T = unknown>
  extends Partial<InteractionGuardOptions> {
  /** Menu definition */
  menu: SelectMenuDef<T>
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
  controlRef?: React.Ref<SelectControl<T>>
  /** Current selected value (controlled) */
  value?: string
  /** Default value (uncontrolled) */
  defaultValue?: string
  /** Called when selection changes */
  onValueChange?: (value: string) => void
  /** Whether the select is disabled */
  disabled?: boolean
  /** Whether this is a multi-select */
  multiple?: boolean
  /** Current selected values (multi select, controlled) */
  values?: string[]
  /** Default values (multi select, uncontrolled) */
  defaultValues?: string[]
  /** Called when multi-selection changes */
  onValuesChange?: (values: string[]) => void
}

/**
 * SelectRoot - Root component that manages state and provides context.
 * Similar to DropdownMenuRoot but with value state management for form controls.
 */
export function SelectRoot<T = unknown>({
  menu,
  children,
  onOpenChange,
  open: controlledOpen,
  defaultOpen = false,
  modal = true,
  defaults,
  controlRef,
  value: controlledValue,
  defaultValue,
  onValueChange,
  disabled = false,
  multiple = false,
  values: controlledValues,
  defaultValues,
  onValuesChange,
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
}: SelectRootProps<T>) {
  const [open, setOpen] = useControllableState({
    prop: controlledOpen,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  })

  // Single select value state
  const [selectedValue, setSelectedValue] = useControllableState({
    prop: controlledValue,
    defaultProp: defaultValue ?? '',
    onChange: onValueChange,
  })

  // Multi select values state
  const [selectedValues, setSelectedValues] = useControllableState({
    prop: controlledValues,
    defaultProp: defaultValues ?? [],
    onChange: onValuesChange,
  })

  const triggerRef = React.useRef<HTMLElement>(null)
  const scopeId = React.useId()

  // Create the global store for this select instance
  const storeRef = React.useRef<StoreApi<SelectMenuStore<T>> | null>(null)
  if (!storeRef.current) {
    storeRef.current = multiple
      ? createMultiSelectStore<T>({
          scopeId,
          defaultValues: defaultValues ?? [],
        })
      : createSelectStore<T>({
          scopeId,
          defaultValue: defaultValue ?? '',
        })
  }
  const store = storeRef.current

  // Event bus for control
  const eventBus = React.useRef(new EventBus())

  // Control state
  const [controlState, setControlState] = React.useState({
    loading: false,
    error: null as string | null,
    disabled: false,
  })

  const closeAllSurfaces = React.useCallback(() => {
    setOpen(false)
  }, [setOpen])

  // Create control implementation
  const control = React.useMemo<SelectControl<T>>(() => {
    return {
      // ===== Core Control =====
      getState: () => ({
        disabled: controlState.disabled || disabled,
        value: selectedValue,
        values: selectedValues,
      }),
      disable: () => {
        setControlState((prev) => ({ ...prev, disabled: true }))
        eventBus.current.emit(SELECT_EVENTS.MENU_DISABLE)
        return () => {
          setControlState((prev) => ({ ...prev, disabled: false }))
          eventBus.current.emit(SELECT_EVENTS.MENU_ENABLE)
        }
      },
      enable: () => {
        setControlState((prev) => ({ ...prev, disabled: false }))
        eventBus.current.emit(SELECT_EVENTS.MENU_ENABLE)
      },
      setDisabled: (newDisabled: boolean) => {
        setControlState((prev) => ({ ...prev, disabled: newDisabled }))
        eventBus.current.emit(
          newDisabled ? SELECT_EVENTS.MENU_DISABLE : SELECT_EVENTS.MENU_ENABLE,
        )
      },
      // ===== Value Control =====
      setValue: multiple
        ? undefined
        : (value: string) => {
            setSelectedValue(value)
            eventBus.current.emit(SELECT_EVENTS.VALUE_CHANGE, { value })
          },
      setValues: !multiple
        ? undefined
        : (values: string[]) => {
            setSelectedValues(values)
            eventBus.current.emit(SELECT_EVENTS.VALUE_CHANGE, { values })
          },
      // ===== Open/Close Control =====
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((prev) => !prev),
    }
  }, [
    controlState,
    disabled,
    selectedValue,
    selectedValues,
    multiple,
    setOpen,
    setSelectedValue,
    setSelectedValues,
  ])

  // Expose via controlRef
  React.useEffect(() => {
    if (!controlRef) return

    if (typeof controlRef === 'function') {
      controlRef(control)
    } else {
      ;(controlRef as React.RefObject<SelectControl<T>>).current = control
    }
  }, [control, controlRef])

  // Cleanup event bus on unmount
  React.useEffect(() => {
    return () => eventBus.current.clear()
  }, [])

  // Sync state to store
  React.useEffect(() => {
    store.getState().setOpen(open ?? false)
  }, [open, store])

  React.useEffect(() => {
    if (multiple) {
      store.getState().setValues(selectedValues ?? [])
    } else {
      store.getState().setValue(selectedValue)
    }
  }, [store, multiple, selectedValue, selectedValues])

  React.useEffect(() => {
    store.getState().setDisabled(controlState.disabled || disabled)
  }, [store, controlState.disabled, disabled])

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
      selectedValue,
      selectedValues,
      onValueChange: setSelectedValue,
      onValuesChange: setSelectedValues,
      multiple,
      disabled: controlState.disabled || disabled,
      menu,
      interactionGuardOptions,
    }),
    [
      scopeId,
      open,
      menu,
      setOpen,
      closeAllSurfaces,
      control,
      selectedValue,
      selectedValues,
      setSelectedValue,
      setSelectedValues,
      multiple,
      controlState.disabled,
      disabled,
      interactionGuardOptions,
    ],
  )

  return (
    <SelectMenuStoreProvider store={store}>
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
    </SelectMenuStoreProvider>
  )
}
