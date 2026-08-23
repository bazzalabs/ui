'use client'

import { Popover, type PopoverRootProps } from '@base-ui/react/popover'
import * as React from 'react'
import type { VirtualItem } from '../../internal/listbox/index.js'
import type { PopupMenuOpenChangeReason } from '../../internal/popup-menu/events.js'
import {
  type PopupMenuDebugOptions,
  type PopupMenuHighlightChangeHandler,
  PopupMenuProviders,
  type PopupMenuRootActions,
  type UsePopupMenuRootParams,
  usePopupMenuRoot,
} from '../../internal/popup-menu/index.js'
import { REASONS } from '../../utils/events/index.js'
import {
  defaultItemEquality,
  type ItemEqualityComparer,
} from '../../utils/item-equality.js'
import type { Items } from '../../utils/items.js'
import { stringifyAsValue } from '../../utils/resolve-value-label.js'
import {
  ComboboxContext,
  type ComboboxContextValue,
  type ComboboxFilterMode,
  type ItemTextRegistry,
} from '../contexts/combobox-context.js'
import type { ComboboxLayout } from '../contexts/combobox-positioner-context.js'
import type {
  ComboboxHighlightChangeEventDetails,
  ComboboxOpenChangeEventDetails,
} from '../events.js'

/**
 * Helper type to determine the value type based on the multiple flag.
 */
type ComboboxValueType<
  Value,
  Multiple extends boolean | undefined,
> = Multiple extends true ? Value[] : Value | null

export interface ComboboxRootProps<
  Value = unknown,
  Multiple extends boolean | undefined = false,
> extends Omit<
    PopoverRootProps,
    'open' | 'onOpenChange' | 'defaultOpen' | 'actionsRef'
  > {
  // ===== Open State =====
  /**
   * Whether the combobox is open.
   * Use for controlled mode.
   */
  open?: boolean

  /**
   * Callback when the open state changes.
   * The second parameter contains event details including the reason for the change.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: ComboboxOpenChangeEventDetails,
  ) => void

  /**
   * Whether the combobox is initially open.
   * Use for uncontrolled mode.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * A ref to imperative actions.
   * - `close`: closes the menu imperatively.
   * - `unmount`: unmounts the popup imperatively (when keep-mounted mode is enabled).
   * - `setDisabled`: enables/disables the menu imperatively.
   */
  actionsRef?: React.RefObject<ComboboxRoot.Actions | null>

  // ===== Single Selection =====
  /**
   * Current selected value (single-select mode).
   * Use for controlled mode.
   * Can be a primitive or an object.
   */
  value?: ComboboxValueType<Value, Multiple>

  /**
   * Default selected value (single-select mode).
   * Use for uncontrolled mode.
   */
  defaultValue?: ComboboxValueType<Value, Multiple>

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
   * Custom comparison logic used to determine if a combobox item value
   * matches the current selected value.
   * Useful when item values are objects without matching referentially.
   * Defaults to Object.is comparison.
   */
  isItemEqualToValue?: ItemEqualityComparer<Value>

  /**
   * When the item values are objects (`<Combobox.Item value={object}>`),
   * this function converts the object value to a string representation
   * for display in the input.
   * If the shape of the object is `{ value, label }`, the label will be
   * used automatically without needing to specify this prop.
   */
  itemToStringLabel?: (itemValue: Value) => string

  /**
   * When the item values are objects (`<Combobox.Item value={object}>`),
   * this function converts the object value to a string representation
   * for form submission.
   * If the shape of the object is `{ value, label }`, the value will be
   * used automatically without needing to specify this prop.
   */
  itemToStringValue?: (itemValue: Value) => string

  // ===== Input State =====
  /**
   * Current input value.
   * Use for controlled mode.
   */
  inputValue?: string

  /**
   * Default input value.
   * Use for uncontrolled mode.
   */
  defaultInputValue?: string

  /**
   * Callback when the input value changes.
   */
  onInputValueChange?: (value: string) => void

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
   * Whether the combobox is disabled.
   * @default false
   */
  disabled?: boolean

  /**
   * Placeholder text for the input.
   * @default "Search..."
   */
  placeholder?: string

  /**
   * Data structure of the items rendered in the combobox popup.
   * When specified, the input shows the label of the selected item
   * instead of the raw value.
   *
   * Can be a record mapping values to labels, or an array of
   * `{ value, label, keywords? }` objects. Only the array form can express
   * `keywords` (extra filter terms) or a `null` (clearable) value.
   * @example
   * ```tsx
   * // Record format
   * <Combobox.Root items={{ us: 'United States', uk: 'United Kingdom' }}>
   *
   * // Array format (supports keywords and a null clearable item)
   * <Combobox.Root items={[
   *   { value: null, label: 'Select a country' },
   *   { value: 'us', label: 'United States', keywords: ['america', 'usa'] },
   *   { value: 'uk', label: 'United Kingdom' },
   * ]}>
   * ```
   */
  items?: Items

  // ===== Behavior =====
  /**
   * Determines if the combobox enters a modal state when open.
   *
   * - `true`: user interaction is limited to the combobox: document page scroll
   *   is locked, and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * - `'trap-focus'`: focus is trapped inside the combobox, but document page
   *   scroll is not locked and pointer interactions outside of it remain enabled.
   *
   * @default false
   */
  modal?: boolean | 'trap-focus'

  /**
   * Whether to close the popup after selecting an item.
   * @default true for single-select, false for multi-select
   */
  closeOnSelect?: boolean

  /**
   * Whether to open the popup when the input is focused.
   * @default true
   */
  openOnFocus?: boolean

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
    eventDetails: ComboboxHighlightChangeEventDetails,
  ) => void

  // ===== Layout =====
  /**
   * The layout mode for the combobox popup.
   *
   * - `'floating'` (default) - Standard dropdown positioning below/above the input
   * - `'input-embedded'` - Popup wraps around the input (macOS Spotlight-style).
   *   The input appears to be inside the popup at the top.
   *
   * When `'input-embedded'`:
   * - `data-input-embedded` attribute is added to Input, Positioner, Popup, and List
   * - Use CSS selectors like `[data-input-embedded]` to style components
   *
   * @default 'floating'
   */
  layout?: ComboboxLayout

  /**
   * Event handler called after any open/close animations have completed.
   * When `clearSearchOnClose="after-exit"` is set on Surface, the search
   * will be cleared before this callback is invoked.
   */
  onOpenChangeComplete?: (open: boolean) => void

  /**
   * Debug visualization options for submenu interaction heuristics.
   */
  debug?: PopupMenuDebugOptions

  children: React.ReactNode
}

/**
 * Groups all parts of the combobox.
 * Manages open state, selection state, input state, and provides context to children.
 * Doesn't render its own HTML element.
 *
 * @template Value - The type of the combobox value (can be a primitive or object)
 * @template Multiple - Whether multiple selection is enabled
 */
export function ComboboxRoot<
  Value = unknown,
  Multiple extends boolean | undefined = false,
>(props: ComboboxRootProps<Value, Multiple>): React.JSX.Element {
  const {
    // Open state
    open: openProp,
    onOpenChange,
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
    // Input state
    inputValue: inputValueProp,
    defaultInputValue = '',
    onInputValueChange,
    // Form integration
    name,
    form,
    required,
    disabled: disabledProp = false,
    placeholder = 'Search...',
    items,
    // Behavior
    modal = false,
    closeOnSelect: closeOnSelectProp,
    openOnFocus = true,
    // Virtualization
    virtualized = false,
    virtualItems,
    onHighlightChange,
    // Layout
    layout = 'floating',
    // Animation callback
    onOpenChangeComplete: onOpenChangeCompleteProp,
    debug,
    children,
    ...rest
  } = props

  const handleHighlightChange =
    React.useCallback<PopupMenuHighlightChangeHandler>(
      (id, _node, index, details) =>
        onHighlightChange?.(
          id,
          index,
          details as ComboboxHighlightChangeEventDetails,
        ),
      [onHighlightChange],
    )

  // Generate a unique ID for the listbox
  const listId = React.useId()

  // ===== Element Refs for Positioning =====
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const inputWrapperRef = React.useRef<HTMLElement | null>(null)
  const [inputHeight, setInputHeight] = React.useState(0)
  const [inputWidth, setInputWidth] = React.useState(0)

  const setInputElement = React.useCallback(
    (element: HTMLInputElement | null) => {
      inputRef.current = element
      // Only use input dimensions if there's no wrapper
      if (element && !inputWrapperRef.current) {
        const rect = element.getBoundingClientRect()
        setInputHeight(rect.height)
        setInputWidth(rect.width)
      }
    },
    [],
  )

  const setInputWrapperElement = React.useCallback(
    (element: HTMLElement | null) => {
      inputWrapperRef.current = element
      // When wrapper is present, use its dimensions instead of input
      if (element) {
        const rect = element.getBoundingClientRect()
        setInputHeight(rect.height)
        setInputWidth(rect.width)
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
    handleOpenChange: baseHandleOpenChange,
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
    onHighlightChange: handleHighlightChange,
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

  // Custom handleOpenChange that ignores close events when input has focus
  // This prevents base-ui's Popover from closing when clicking on the input
  const handleOpenChange = React.useCallback(
    (
      newOpen: boolean,
      reason?: ComboboxOpenChangeEventDetails['reason'],
      event?: Event,
    ) => {
      if (menuDisabled && reason !== REASONS.imperativeAction) {
        return
      }

      // When trying to close, check if input has focus
      if (!newOpen && inputRef.current) {
        const activeElement = document.activeElement
        // If the input has focus or will have focus, don't close
        if (activeElement === inputRef.current) {
          return
        }
      }
      // Cast reason - combobox has additional reasons beyond PopupMenu's reasons
      baseHandleOpenChange(
        newOpen,
        reason as Parameters<typeof baseHandleOpenChange>[1],
        event,
      )
    },
    [baseHandleOpenChange, menuDisabled],
  )

  // Handle animation complete - clear search and hide input if clearSearchOnClose is 'after-exit'
  const handleOpenChangeComplete = React.useCallback(
    (nextOpen: boolean) => {
      // Clear search and hide input after exit animation completes
      if (!nextOpen && store.context.clearSearchOnClose === 'after-exit') {
        store.clearSearch()
        store.setInputActive(false)
      }
      if (!nextOpen) {
        store.clearHighlight()
      }
      // Call user's callback
      onOpenChangeCompleteProp?.(nextOpen)
    },
    [store, onOpenChangeCompleteProp],
  )

  // Wrapper to adapt Popover's event details to our handleOpenChange
  const handlePopoverOpenChange = React.useCallback(
    (nextOpen: boolean, popoverDetails: Popover.Root.ChangeEventDetails) => {
      // Forward to our internal handler with the reason and event
      handleOpenChange(
        nextOpen,
        popoverDetails.reason as ComboboxOpenChangeEventDetails['reason'],
        popoverDetails.event,
      )
    },
    [handleOpenChange],
  )

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

  // ===== Input Value State =====
  const [internalInputValue, setInternalInputValue] =
    React.useState(defaultInputValue)
  const inputValue =
    inputValueProp !== undefined ? inputValueProp : internalInputValue

  const handleInputValueChange = React.useCallback(
    (newValue: string) => {
      if (inputValueProp === undefined) {
        setInternalInputValue(newValue)
      }
      onInputValueChange?.(newValue)
    },
    [inputValueProp, onInputValueChange],
  )

  // ===== Item Text Registry =====
  // The registry persists item text even after items unmount (popup closes).
  // This ensures the input can display the correct label for selected values.
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

  // ===== Close on Select =====
  const closeOnSelect = closeOnSelectProp ?? !multiple

  // ===== Filter Mode State Machine =====
  // Controls how the search/filter value is determined.
  //
  // State transitions:
  // - Closed → open (no value) → { type: 'active' }
  // - Closed → open (with value) → { type: 'showAll' }
  // - Open + user types → { type: 'active' }
  // - Open → close → { type: 'frozen', search: <current> }
  //
  // We use a ref for synchronous access during close (to prevent flash of items).
  const filterModeRef = React.useRef<ComboboxFilterMode>({ type: 'active' })
  const [, setFilterModeState] = React.useState<ComboboxFilterMode>({
    type: 'active',
  })

  const setFilterMode = React.useCallback((mode: ComboboxFilterMode) => {
    filterModeRef.current = mode
    setFilterModeState(mode)
  }, [])

  // Read from ref for synchronous access
  const filterMode = filterModeRef.current

  const setFilterActive = React.useCallback(() => {
    // User is typing, switch to active filtering
    setFilterMode({ type: 'active' })
  }, [setFilterMode])

  // ===== Open/Close Helpers =====
  const openCombobox = React.useCallback(() => {
    if (!menuDisabled) {
      // If opening with a selected value (single-select), show all items initially.
      // Otherwise, use active filtering.
      if (!multiple && value != null) {
        setFilterMode({ type: 'showAll' })
      } else {
        setFilterMode({ type: 'active' })
      }
      store.setOpen(true)
    }
  }, [menuDisabled, store, multiple, value, setFilterMode])

  const closeCombobox = React.useCallback(
    (reason?: ComboboxOpenChangeEventDetails['reason'], event?: Event) => {
      // Freeze the current search state BEFORE closing to prevent filter changes
      // during exit animations.
      //
      // Get the effective search value based on current filter mode:
      // - 'active': freeze to current inputValue
      // - 'showAll': freeze to '' (keep showing all items)
      // - 'frozen': keep the existing frozen value (shouldn't happen, but handle it)
      const currentMode = filterModeRef.current
      const searchToFreeze =
        currentMode.type === 'active'
          ? internalInputValue
          : currentMode.type === 'showAll'
            ? ''
            : currentMode.search

      setFilterMode({ type: 'frozen', search: searchToFreeze })
      // Cast is safe: closeCombobox only receives close-related reasons
      // which are a subset of PopupMenuOpenChangeReason
      store.setOpen(
        false,
        reason as PopupMenuOpenChangeReason | undefined,
        event,
      )
    },
    [store, setFilterMode, internalInputValue],
  )

  // ===== Combobox Context =====
  const comboboxContextValue: ComboboxContextValue<Value> = React.useMemo(
    () => ({
      multiple: multiple as boolean,
      value,
      values,
      onValueChange: handleValueChange,
      onValuesChange: handleValuesChange,
      isItemEqualToValue,
      itemToStringLabel,
      itemToStringValue,
      inputValue,
      onInputValueChange: handleInputValueChange,
      name,
      form,
      required,
      disabled: menuDisabled,
      placeholder,
      items,
      itemTextRegistry: itemTextRegistryRef.current,
      registerItemText,
      listId,
      inputRef,
      setInputElement,
      inputWrapperRef,
      setInputWrapperElement,
      closeOnSelect,
      openOnFocus,
      openCombobox,
      closeCombobox,
      filterMode,
      setFilterActive,
      inputHeight,
      inputWidth,
      layout,
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
      inputValue,
      handleInputValueChange,
      name,
      form,
      required,
      menuDisabled,
      placeholder,
      items,
      registerItemText,
      listId,
      setInputElement,
      setInputWrapperElement,
      closeOnSelect,
      openOnFocus,
      openCombobox,
      closeCombobox,
      filterMode,
      setFilterActive,
      inputHeight,
      inputWidth,
      layout,
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

  return (
    <ComboboxContext.Provider
      value={comboboxContextValue as ComboboxContextValue<unknown>}
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
        componentName="combobox"
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
    </ComboboxContext.Provider>
  )
}

export namespace ComboboxRoot {
  export interface Props<
    Value = unknown,
    Multiple extends boolean | undefined = false,
  > extends ComboboxRootProps<Value, Multiple> {}
  export type OpenChangeEventDetails = ComboboxOpenChangeEventDetails
  export type HighlightChangeEventDetails = ComboboxHighlightChangeEventDetails
  export type Actions = PopupMenuRootActions
}
