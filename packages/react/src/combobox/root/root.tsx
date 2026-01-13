'use client'

import { Popover, type PopoverRootProps } from '@base-ui/react/popover'
import * as React from 'react'
import type { VirtualItem } from '../../internal/listbox/index.js'
import {
  PopupMenuProviders,
  usePopupMenuRoot,
} from '../../internal/popup-menu/index.js'
import {
  ComboboxContext,
  type ComboboxContextValue,
  type ItemTextRegistry,
} from '../contexts/combobox-context.js'

export interface ComboboxRootProps
  extends Omit<PopoverRootProps, 'open' | 'onOpenChange' | 'defaultOpen'> {
  // ===== Open State =====
  /**
   * Whether the combobox is open.
   * Use for controlled mode.
   */
  open?: boolean

  /**
   * Callback when the open state changes.
   */
  onOpenChange?: (open: boolean) => void

  /**
   * Whether the combobox is initially open.
   * Use for uncontrolled mode.
   * @default false
   */
  defaultOpen?: boolean

  // ===== Single Selection =====
  /**
   * Current selected value (single-select mode).
   * Use for controlled mode.
   */
  value?: string

  /**
   * Default selected value (single-select mode).
   * Use for uncontrolled mode.
   */
  defaultValue?: string

  /**
   * Callback when the selected value changes (single-select mode).
   */
  onValueChange?: (value: string) => void

  // ===== Multi Selection =====
  /**
   * Whether multi-select mode is enabled.
   * @default false
   */
  multiple?: boolean

  /**
   * Current selected values (multi-select mode).
   * Use for controlled mode.
   */
  values?: string[]

  /**
   * Default selected values (multi-select mode).
   * Use for uncontrolled mode.
   */
  defaultValues?: string[]

  /**
   * Callback when the selected values change (multi-select mode).
   */
  onValuesChange?: (values: string[]) => void

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
   * Can be a record mapping values to labels, or an array of { value, label } objects.
   * @example
   * ```tsx
   * // Record format
   * <Combobox.Root items={{ us: 'United States', uk: 'United Kingdom' }}>
   *
   * // Array format
   * <Combobox.Root items={[
   *   { value: 'us', label: 'United States' },
   *   { value: 'uk', label: 'United Kingdom' },
   * ]}>
   * ```
   */
  items?:
    | Record<string, React.ReactNode>
    | Array<{ value: string; label: React.ReactNode }>

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
   * Useful for synchronizing with a virtualizer (e.g., scrollToIndex).
   * Only called when `virtualized={true}`.
   */
  onHighlightChange?: (id: string | null, index: number) => void

  children: React.ReactNode
}

/**
 * Groups all parts of the combobox.
 * Manages open state, selection state, input state, and provides context to children.
 * Doesn't render its own HTML element.
 */
export function ComboboxRoot(props: ComboboxRootProps) {
  const {
    // Open state
    open: openProp,
    onOpenChange,
    defaultOpen = false,
    // Single selection
    value: valueProp,
    defaultValue = '',
    onValueChange,
    // Multi selection
    multiple = false,
    values: valuesProp,
    defaultValues = [],
    onValuesChange,
    // Input state
    inputValue: inputValueProp,
    defaultInputValue = '',
    onInputValueChange,
    // Form integration
    name,
    form,
    required,
    disabled = false,
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
    children,
    ...rest
  } = props

  // Generate a unique ID for the listbox
  const listId = React.useId()

  // ===== Element Refs for Positioning =====
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const setInputElement = React.useCallback(
    (element: HTMLInputElement | null) => {
      inputRef.current = element
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
  } = usePopupMenuRoot({
    onOpenChange,
    defaultOpen,
    virtualized,
    items: virtualItems,
    onHighlightChange,
  })

  // Sync controlled open prop to store
  store.useControlledProp('open', openProp, defaultOpen)

  // Get open state from store for Popover
  const open = store.useState('open')

  // ===== Single Selection State =====
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const value = valueProp !== undefined ? valueProp : internalValue

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (valueProp === undefined) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [valueProp, onValueChange],
  )

  // ===== Multi Selection State =====
  const [internalValues, setInternalValues] = React.useState(defaultValues)
  const values = valuesProp !== undefined ? valuesProp : internalValues

  const handleValuesChange = React.useCallback(
    (newValues: string[]) => {
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

  // ===== Skip Filtering State =====
  // When opening with a selected value, we want to show all items initially
  // even though the input displays the selected label. Once the user types,
  // filtering resumes.
  const [skipFiltering, setSkipFiltering] = React.useState(false)

  const markQueryChanged = React.useCallback(() => {
    setSkipFiltering(false)
  }, [])

  // Reset skipFiltering when popup closes
  React.useEffect(() => {
    if (!open) {
      setSkipFiltering(false)
    }
  }, [open])

  // ===== Open/Close Helpers =====
  const openCombobox = React.useCallback(() => {
    if (!disabled) {
      // If opening with a selected value (single-select), skip filtering initially
      if (!multiple && value) {
        setSkipFiltering(true)
      }
      store.setOpen(true)
    }
  }, [disabled, store, multiple, value])

  const closeCombobox = React.useCallback(() => {
    store.setOpen(false)
  }, [store])

  // ===== Combobox Context =====
  const comboboxContextValue: ComboboxContextValue = React.useMemo(
    () => ({
      multiple,
      value,
      values,
      onValueChange: handleValueChange,
      onValuesChange: handleValuesChange,
      inputValue,
      onInputValueChange: handleInputValueChange,
      name,
      form,
      required,
      disabled,
      placeholder,
      items,
      itemTextRegistry: itemTextRegistryRef.current,
      registerItemText,
      listId,
      inputRef,
      setInputElement,
      closeOnSelect,
      openOnFocus,
      openCombobox,
      closeCombobox,
      skipFiltering,
      markQueryChanged,
    }),
    [
      multiple,
      value,
      values,
      handleValueChange,
      handleValuesChange,
      inputValue,
      handleInputValueChange,
      name,
      form,
      required,
      disabled,
      placeholder,
      items,
      registerItemText,
      listId,
      setInputElement,
      closeOnSelect,
      openOnFocus,
      openCombobox,
      closeCombobox,
      skipFiltering,
      markQueryChanged,
    ],
  )

  // ===== Hidden Inputs for Form Submission =====
  const hiddenInputs = React.useMemo(() => {
    if (!name) return null

    if (multiple) {
      // Multiple hidden inputs for array submission
      if (values.length > 0) {
        return values.map((v, index) => (
          <input
            key={v}
            type="hidden"
            name={name}
            value={v}
            form={form}
            required={required && index === 0}
          />
        ))
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
        value={value}
        form={form}
        required={required}
      />
    )
  }, [name, form, required, multiple, value, values])

  return (
    <ComboboxContext.Provider value={comboboxContextValue}>
      <PopupMenuProviders
        store={store}
        focusOwnerStore={focusOwnerStore}
        openChainStore={openChainStore}
        depth={0}
        closeAll={closeAll}
        registerSurface={registerSurface}
        virtualization={virtualization}
        menuType="dropdown"
      >
        {hiddenInputs}
        <Popover.Root
          {...rest}
          open={open}
          onOpenChange={handleOpenChange}
          modal={modal}
        >
          {children}
        </Popover.Root>
      </PopupMenuProviders>
    </ComboboxContext.Provider>
  )
}

export namespace ComboboxRoot {
  export interface Props extends ComboboxRootProps {}
  export type ChangeEventDetails = Popover.Root.ChangeEventDetails
  export type Actions = Popover.Root.Actions
}
