'use client'

import { Popover, type PopoverRootProps } from '@base-ui/react/popover'
import * as React from 'react'
import type { VirtualItem } from '../../internal/listbox/index.js'
import {
  type PopupMenuDebugOptions,
  PopupMenuProviders,
  type PopupMenuRootActions,
  type UsePopupMenuRootParams,
  usePopupMenuRoot,
} from '../../internal/popup-menu/index.js'
import {
  defaultItemEquality,
  type ItemEqualityComparer,
} from '../../utils/item-equality.js'
import type { Items } from '../../utils/items.js'
import { stringifyAsValue } from '../../utils/resolve-value-label.js'
import {
  type ItemTextRegistry,
  SelectContext,
  type SelectContextValue,
} from '../contexts/select-context.js'
import type {
  SelectHighlightChangeEventDetails,
  SelectOpenChangeEventDetails,
} from '../events.js'

/**
 * Helper type to determine the value type based on the multiple flag.
 */
type SelectValue<
  Value,
  Multiple extends boolean | undefined,
> = Multiple extends true ? Value[] : Value | null

export interface SelectRootProps<
  Value = unknown,
  Multiple extends boolean | undefined = false,
> extends Omit<
    PopoverRootProps,
    'open' | 'onOpenChange' | 'defaultOpen' | 'actionsRef'
  > {
  // ===== Open State =====
  /**
   * Whether the select is open.
   * Use for controlled mode.
   */
  open?: boolean

  /**
   * Callback when the open state changes.
   * The second parameter contains event details including the reason for the change.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: SelectOpenChangeEventDetails,
  ) => void

  /**
   * Callback called after any animations complete when the select opens or closes.
   * Useful for resetting state after exit animations finish.
   */
  onOpenChangeComplete?: (open: boolean) => void

  /**
   * A ref to imperative actions.
   * - `close`: closes the menu imperatively.
   * - `unmount`: unmounts the popup imperatively (when keep-mounted mode is enabled).
   * - `setDisabled`: enables/disables the menu imperatively.
   */
  actionsRef?: React.RefObject<SelectRoot.Actions | null>

  /**
   * Whether the select is initially open.
   * Use for uncontrolled mode.
   * @default false
   */
  defaultOpen?: boolean

  // ===== Single Selection =====
  /**
   * Current selected value (single-select mode).
   * Use for controlled mode.
   * Can be a primitive or an object.
   */
  value?: SelectValue<Value, Multiple>

  /**
   * Default selected value (single-select mode).
   * Use for uncontrolled mode.
   */
  defaultValue?: SelectValue<Value, Multiple>

  /**
   * Callback when the selected value changes (single-select mode).
   *
   * Note: when a clearable (`null`) item is selected, this is called with
   * `null` at runtime. If you use `null` items, handle that case.
   */
  onValueChange?: (value: Value) => void

  // ===== Multi Selection =====
  /**
   * Whether multi-select mode is enabled.
   * @default false
   */
  multiple?: Multiple

  /**
   * Current selected values (multi-select mode).
   * Use for controlled mode.
   */
  values?: Value[]

  /**
   * Default selected values (multi-select mode).
   * Use for uncontrolled mode.
   */
  defaultValues?: Value[]

  /**
   * Callback when the selected values change (multi-select mode).
   */
  onValuesChange?: (values: Value[]) => void

  // ===== Object Value Support =====
  /**
   * Custom comparison logic used to determine if a select item value
   * matches the current selected value.
   * Useful when item values are objects without matching referentially.
   * Defaults to Object.is comparison.
   */
  isItemEqualToValue?: ItemEqualityComparer<Value>

  /**
   * When the item values are objects (`<Select.Item value={object}>`),
   * this function converts the object value to a string representation
   * for display in the trigger.
   * If the shape of the object is `{ value, label }`, the label will be
   * used automatically without needing to specify this prop.
   */
  itemToStringLabel?: (itemValue: Value) => string

  /**
   * When the item values are objects (`<Select.Item value={object}>`),
   * this function converts the object value to a string representation
   * for form submission.
   * If the shape of the object is `{ value, label }`, the value will be
   * used automatically without needing to specify this prop.
   */
  itemToStringValue?: (itemValue: Value) => string

  // ===== Form Integration =====
  /**
   * Form field name for submission.
   * When set, hidden input(s) will be rendered for form submission.
   */
  name?: string

  /**
   * Associate with a form by ID.
   */
  form?: string

  /**
   * Whether this field is required.
   */
  required?: boolean

  /**
   * Whether the select is disabled.
   * @default false
   */
  disabled?: boolean

  /**
   * Placeholder text when no value is selected.
   * @default "Select..."
   */
  placeholder?: string

  /**
   * Data structure of the items rendered in the select popup.
   * When specified, `<Select.Value>` renders the label of the selected item
   * instead of the raw value.
   *
   * Can be a record mapping values to labels, or an array of
   * `{ value, label, keywords? }` objects. Only the array form can express
   * `keywords` (extra filter terms) or a `null` (clearable) value.
   * @example
   * ```tsx
   * // Record format
   * <Select.Root items={{ us: 'United States', uk: 'United Kingdom' }}>
   *
   * // Array format (supports keywords and a null clearable item)
   * <Select.Root items={[
   *   { value: null, label: 'Select a country' },
   *   { value: 'us', label: 'United States', keywords: ['america', 'usa'] },
   *   { value: 'uk', label: 'United Kingdom' },
   * ]}>
   * ```
   */
  items?: Items

  // ===== Behavior =====
  /**
   * Determines if the select enters a modal state when open.
   *
   * - `true`: user interaction is limited to the select: document page scroll
   *   is locked, and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * - `'trap-focus'`: focus is trapped inside the select, but document page
   *   scroll is not locked and pointer interactions outside of it remain enabled.
   *
   * @default true
   */
  modal?: boolean | 'trap-focus'

  /**
   * When to close the select on outside interactions.
   * - 'pointerdown': Close immediately when pointer is pressed outside (default)
   * - 'click': Close when a full click (pointerdown + pointerup) occurs outside
   * @default 'pointerdown'
   */
  closeOnOutsidePress?: 'click' | 'pointerdown'

  // ===== Virtualization =====
  /**
   * Whether virtualization mode is enabled.
   * When true, items should provide an explicit `index` prop and
   * the `virtualItems` prop should be provided for navigation to work correctly.
   * @default false
   */
  virtualized?: boolean

  /**
   * Pre-registered items for virtualization.
   * When provided with `virtualized={true}`, this allows navigation to work
   * for items that aren't currently mounted in the DOM.
   */
  virtualItems?: VirtualItem[]

  /**
   * Callback when the highlighted item changes.
   * Useful for synchronizing with a virtualizer (e.g., scrollToIndex) or other UI state.
   * The third parameter contains event details including the reason for the change.
   */
  onHighlightChange?: (
    id: string | null,
    index: number,
    eventDetails: SelectHighlightChangeEventDetails,
  ) => void

  /**
   * Debug visualization options for submenu interaction heuristics.
   */
  debug?: PopupMenuDebugOptions

  children: React.ReactNode
}

/**
 * Groups all parts of the select.
 * Manages open state, selection state, and provides context to children.
 * Doesn't render its own HTML element.
 *
 * @template Value - The type of the select value (can be a primitive or object)
 * @template Multiple - Whether multiple selection is enabled
 */
export function SelectRoot<
  Value = unknown,
  Multiple extends boolean | undefined = false,
>(props: SelectRootProps<Value, Multiple>): React.JSX.Element {
  const {
    // Open state
    open: openProp,
    onOpenChange,
    onOpenChangeComplete,
    actionsRef,
    defaultOpen = false,
    // Single selection
    value: valueProp,
    defaultValue,
    onValueChange,
    // Multi selection
    multiple = false as Multiple,
    values: valuesProp,
    defaultValues,
    onValuesChange,
    // Object value support
    isItemEqualToValue = defaultItemEquality as ItemEqualityComparer<Value>,
    itemToStringLabel,
    itemToStringValue,
    // Form integration
    name,
    form,
    required,
    disabled: disabledProp = false,
    placeholder = 'Select...',
    items,
    // Behavior
    modal = true,
    closeOnOutsidePress = 'pointerdown',
    // Virtualization
    virtualized = false,
    virtualItems,
    onHighlightChange,
    debug,
    children,
    ...rest
  } = props

  // Generate a unique ID for the listbox
  const listId = React.useId()

  // ===== Element Refs for Positioning =====
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const valueRef = React.useRef<HTMLElement | null>(null)
  const selectedItemTextRef = React.useRef<HTMLElement | null>(null)
  const firstItemTextRef = React.useRef<HTMLElement | null>(null)

  const setTriggerElement = React.useCallback((element: HTMLElement | null) => {
    triggerRef.current = element
  }, [])

  const setValueElement = React.useCallback((element: HTMLElement | null) => {
    valueRef.current = element
  }, [])

  // ===== Positioner Reset Callback =====
  // Store callback to reset positioning state after close animation
  const resetPositioningCallbackRef = React.useRef<(() => void) | null>(null)

  const registerResetPositioningCallback = React.useCallback(
    (callback: (() => void) | null) => {
      resetPositioningCallbackRef.current = callback
      // Return cleanup function
      return () => {
        resetPositioningCallbackRef.current = null
      }
    },
    [],
  )

  // ===== Open State =====
  // Use shared hook to create stores and utilities
  const {
    store,
    focusOwnerStore,
    openChainStore,
    registerSurface,
    closeAll,
    virtualization,
    handleOpenChange,
    disabled: menuDisabled,
    setDisabled,
    menuTreeResolver,
  } = usePopupMenuRoot({
    // Cast to generic type - component handles type safety via narrowed types
    onOpenChange:
      onOpenChange as unknown as UsePopupMenuRootParams['onOpenChange'],
    defaultOpen,
    virtualized,
    items: virtualItems,
    onHighlightChange:
      onHighlightChange as unknown as UsePopupMenuRootParams['onHighlightChange'],
    closeOnOutsidePress,
    disabled: disabledProp,
  })

  const popoverActionsRef = React.useRef<Popover.Root.Actions | null>(null)

  React.useImperativeHandle(
    actionsRef,
    () => ({
      close: () => {
        popoverActionsRef.current?.close()
      },
      unmount: () => {
        popoverActionsRef.current?.unmount()
      },
      setDisabled,
    }),
    [setDisabled],
  )

  // Sync controlled open prop to store
  store.useControlledProp('openProp', openProp)

  // Get open state from store for Popover
  const open = store.useState('open')

  // ===== Single Selection State =====
  const [internalValue, setInternalValue] = React.useState<Value | null>(
    defaultValue !== undefined ? (defaultValue as Value | null) : null,
  )
  const value: Value | null =
    valueProp !== undefined ? (valueProp as Value | null) : internalValue

  const handleValueChange = React.useCallback(
    (newValue: Value | null) => {
      if (valueProp === undefined) {
        setInternalValue(newValue)
      }
      // `null` is only produced by a clearable item; the public onValueChange
      // type stays `(value: Value) => void` to keep `onValueChange={setState}`
      // ergonomic, so the null is forwarded through a cast at this boundary.
      onValueChange?.(newValue as Value)
    },
    [valueProp, onValueChange],
  )

  // ===== Multi Selection State =====
  const [internalValues, setInternalValues] = React.useState<Value[]>(
    defaultValues ?? [],
  )
  const values: Value[] = valuesProp !== undefined ? valuesProp : internalValues

  const handleValuesChange = React.useCallback(
    (newValues: Value[]) => {
      if (valuesProp === undefined) {
        setInternalValues(newValues)
      }
      onValuesChange?.(newValues)
    },
    [valuesProp, onValuesChange],
  )

  // ===== Item Text Registry =====
  // The registry persists item text even after items unmount (popup closes).
  // This ensures SelectValue can display the correct label for selected values.
  // Text is only overwritten when items re-mount with new text, never deleted.
  const itemTextRegistryRef = React.useRef<ItemTextRegistry>(new Map())

  const registerItemText = React.useCallback(
    (itemValue: string, text: string) => {
      itemTextRegistryRef.current.set(itemValue, text)
      // No cleanup - text should persist even when items unmount
      return () => {}
    },
    [],
  )

  // ===== Select Context =====
  const selectContextValue: SelectContextValue<Value> = React.useMemo(
    () => ({
      multiple: multiple as boolean,
      value,
      values,
      onValueChange: handleValueChange,
      onValuesChange: handleValuesChange,
      isItemEqualToValue,
      itemToStringLabel,
      itemToStringValue,
      name,
      form,
      required,
      disabled: menuDisabled,
      placeholder,
      items,
      itemTextRegistry: itemTextRegistryRef.current,
      registerItemText,
      listId,
      triggerRef,
      valueRef,
      selectedItemTextRef,
      firstItemTextRef,
      setTriggerElement,
      setValueElement,
      registerResetPositioningCallback,
    }),
    [
      multiple,
      value,
      values,
      handleValueChange,
      handleValuesChange,
      isItemEqualToValue,
      itemToStringLabel,
      itemToStringValue,
      name,
      form,
      required,
      menuDisabled,
      placeholder,
      items,
      registerItemText,
      listId,
      setTriggerElement,
      setValueElement,
      registerResetPositioningCallback,
    ],
  )

  // ===== Hidden Inputs for Form Submission =====
  const hiddenInputs = React.useMemo(() => {
    if (!name) return null

    if (multiple) {
      // Multiple hidden inputs for array submission
      if (values.length > 0) {
        return values.map((v, index) => {
          const serializedValue = stringifyAsValue(v, itemToStringValue)
          return (
            <input
              key={serializedValue}
              type="hidden"
              name={name}
              value={serializedValue}
              form={form}
              required={required && index === 0}
            />
          )
        })
      }
      // Empty hidden input to ensure field is submitted even when empty
      return (
        <input
          type="hidden"
          name={name}
          value=""
          form={form}
          required={required}
        />
      )
    }

    // Single hidden input
    return (
      <input
        type="hidden"
        name={name}
        value={value != null ? stringifyAsValue(value, itemToStringValue) : ''}
        form={form}
        required={required}
      />
    )
  }, [name, form, required, multiple, value, values, itemToStringValue])

  // Wrapper to adapt Popover's event details to our handleOpenChange
  const handlePopoverOpenChange = React.useCallback(
    (nextOpen: boolean, popoverDetails: Popover.Root.ChangeEventDetails) => {
      // Forward to our internal handler with the reason and event
      handleOpenChange(
        nextOpen,
        popoverDetails.reason as SelectOpenChangeEventDetails['reason'],
        popoverDetails.event,
      )
    },
    [handleOpenChange],
  )

  // Handle animation complete - reset positioning state after close animation
  const handleOpenChangeComplete = React.useCallback(
    (nextOpen: boolean) => {
      // Clear search and deactivate the input after the exit animation
      // completes, matching the other menu roots. `clearSearchOnClose="after-exit"`
      // defers this cleanup from the store's close handler to here; without it a
      // `hideUntilActive` input stays activated (visible) on reopen.
      if (!nextOpen && store.context.clearSearchOnClose === 'after-exit') {
        store.clearSearch()
        store.setInputActive(false)
      }
      // Reset positioning state after close animation completes
      // This preserves the aligned position during the exit animation
      if (!nextOpen) {
        store.clearHighlight()
        resetPositioningCallbackRef.current?.()
        // Clear first item text ref so it can be set fresh on next open
        firstItemTextRef.current = null
      }
      // Call user's callback
      onOpenChangeComplete?.(nextOpen)
    },
    [store, onOpenChangeComplete],
  )

  return (
    <SelectContext.Provider
      value={selectContextValue as SelectContextValue<unknown>}
    >
      <PopupMenuProviders
        menuTreeResolver={menuTreeResolver}
        store={store}
        focusOwnerStore={focusOwnerStore}
        openChainStore={openChainStore}
        disabled={menuDisabled}
        depth={0}
        closeAll={closeAll}
        registerSurface={registerSurface}
        virtualization={virtualization}
        menuType="dropdown"
        closeOnOutsidePress={closeOnOutsidePress}
        componentName="select"
        debug={debug}
      >
        {hiddenInputs}
        <Popover.Root
          {...rest}
          open={open}
          onOpenChange={handlePopoverOpenChange}
          onOpenChangeComplete={handleOpenChangeComplete}
          modal={modal}
          actionsRef={actionsRef ? popoverActionsRef : undefined}
        >
          {children}
        </Popover.Root>
      </PopupMenuProviders>
    </SelectContext.Provider>
  )
}

export namespace SelectRoot {
  export interface Props<
    Value = unknown,
    Multiple extends boolean | undefined = false,
  > extends SelectRootProps<Value, Multiple> {}
  export type OpenChangeEventDetails = SelectOpenChangeEventDetails
  export type HighlightChangeEventDetails = SelectHighlightChangeEventDetails
  export type Actions = PopupMenuRootActions
}
