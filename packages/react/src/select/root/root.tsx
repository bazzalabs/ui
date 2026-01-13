'use client'

import { Popover, type PopoverRootProps } from '@base-ui/react/popover'
import * as React from 'react'
import type { VirtualItem } from '../../internal/listbox/index.js'
import {
  PopupMenuProviders,
  usePopupMenuRoot,
} from '../../internal/popup-menu/index.js'
import {
  type ItemTextRegistry,
  SelectContext,
  type SelectContextValue,
} from '../contexts/select-context.js'

export interface SelectRootProps
  extends Omit<PopoverRootProps, 'open' | 'onOpenChange' | 'defaultOpen'> {
  // ===== Open State =====
  /**
   * Whether the select is open.
   * Use for controlled mode.
   */
  open?: boolean

  /**
   * Callback when the open state changes.
   */
  onOpenChange?: (open: boolean) => void

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
   * Can be a record mapping values to labels, or an array of { value, label } objects.
   * @example
   * ```tsx
   * // Record format
   * <Select.Root items={{ us: 'United States', uk: 'United Kingdom' }}>
   *
   * // Array format
   * <Select.Root items={[
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
 * Groups all parts of the select.
 * Manages open state, selection state, and provides context to children.
 * Doesn't render its own HTML element.
 */
export function SelectRoot(props: SelectRootProps) {
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
    // Form integration
    name,
    form,
    required,
    disabled = false,
    placeholder = 'Select...',
    items,
    // Behavior
    modal = true,
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
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const valueRef = React.useRef<HTMLElement | null>(null)
  const selectedItemTextRef = React.useRef<HTMLElement | null>(null)

  const setTriggerElement = React.useCallback((element: HTMLElement | null) => {
    triggerRef.current = element
  }, [])

  const setValueElement = React.useCallback((element: HTMLElement | null) => {
    valueRef.current = element
  }, [])

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
  const selectContextValue: SelectContextValue = React.useMemo(
    () => ({
      multiple,
      value,
      values,
      onValueChange: handleValueChange,
      onValuesChange: handleValuesChange,
      name,
      form,
      required,
      disabled,
      placeholder,
      items,
      itemTextRegistry: itemTextRegistryRef.current,
      registerItemText,
      listId,
      triggerRef,
      valueRef,
      selectedItemTextRef,
      setTriggerElement,
      setValueElement,
    }),
    [
      multiple,
      value,
      values,
      handleValueChange,
      handleValuesChange,
      name,
      form,
      required,
      disabled,
      placeholder,
      items,
      registerItemText,
      listId,
      setTriggerElement,
      setValueElement,
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
    <SelectContext.Provider value={selectContextValue}>
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
    </SelectContext.Provider>
  )
}

export namespace SelectRoot {
  export interface Props extends SelectRootProps {}
  export type ChangeEventDetails = Popover.Root.ChangeEventDetails
  export type Actions = Popover.Root.Actions
}
