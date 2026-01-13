'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { useFocusOwner } from '../../internal/popup-menu/contexts/focus-owner-context.js'
import { usePopupMenuContext } from '../../internal/popup-menu/contexts/popup-menu-context.js'
import { usePopupMenuKeyboard } from '../../internal/popup-menu/hooks/use-popup-menu-keyboard.js'
import type { ComponentProps } from '../../utils/types.js'
import { useComboboxContext } from '../contexts/combobox-context.js'
import { ComboboxInputDataAttributes } from './input.data-attrs.js'

export { ComboboxInputDataAttributes }

export interface ComboboxInputState extends Record<string, unknown> {
  /**
   * Whether the combobox popup is open.
   */
  open: boolean
  /**
   * Whether the input is disabled.
   */
  disabled: boolean
  /**
   * Whether the input currently shows placeholder (no value selected).
   */
  placeholder: boolean
}

export interface ComboboxInputProps
  extends Omit<
    ComponentProps<'input', ComboboxInputState>,
    'value' | 'onChange' | 'type'
  > {
  /**
   * Placeholder text shown when no value is selected and input is empty.
   * Overrides the placeholder set on Combobox.Root.
   */
  placeholder?: string
}

/**
 * Helper to resolve label from items prop
 */
function resolveLabelFromItems(
  items:
    | Record<string, React.ReactNode>
    | Array<{ value: string; label: React.ReactNode }>
    | undefined,
  value: string,
): string | undefined {
  if (!items) return undefined

  if (Array.isArray(items)) {
    const item = items.find((i) => i.value === value)
    const label = item?.label
    return typeof label === 'string' ? label : undefined
  }

  const label = items[value]
  return typeof label === 'string' ? label : undefined
}

/**
 * An input that acts as both the trigger and search field for the combobox.
 * Renders an `<input>` element with combobox ARIA semantics.
 */
export const ComboboxInput = React.forwardRef<
  HTMLInputElement,
  ComboboxInputProps
>(function ComboboxInput(props, forwardedRef) {
  const {
    placeholder: placeholderProp,
    disabled: disabledProp,
    render,
    className,
    style,
    onFocus,
    onBlur,
    onClick,
    onKeyDown,
    ...rest
  } = props

  const comboboxContext = useComboboxContext()
  const popupMenuContext = usePopupMenuContext()
  const focusOwnerStore = useFocusOwner()

  const disabled = disabledProp ?? comboboxContext.disabled
  const placeholder = placeholderProp ?? comboboxContext.placeholder

  // Get open state
  const open = popupMenuContext.store.useState('open')

  // Determine if showing placeholder (no value selected)
  const hasValue = comboboxContext.multiple
    ? comboboxContext.values.length > 0
    : comboboxContext.value !== ''

  // Get the display text for selected value
  const getValueText = React.useCallback(
    (value: string): string | undefined => {
      // First try the registry (populated when items mount)
      const registryText = comboboxContext.itemTextRegistry.get(value)
      if (registryText !== undefined) {
        return registryText
      }

      // Fall back to the items prop (for initial render before popup opens)
      return resolveLabelFromItems(comboboxContext.items, value)
    },
    [comboboxContext.itemTextRegistry, comboboxContext.items],
  )

  // Determine the display value for the input
  // When closed: show selected value's text
  // When open: show the search/filter text
  const displayValue = React.useMemo(() => {
    if (open) {
      // When open, use the input value for filtering
      return comboboxContext.inputValue
    }
    // When closed, show the selected value's label
    if (!hasValue) {
      return ''
    }
    if (comboboxContext.multiple) {
      // For multi-select when closed, show comma-separated values or count
      const texts = comboboxContext.values
        .map((v) => getValueText(v) ?? v)
        .filter(Boolean)
      if (texts.length <= 2) {
        return texts.join(', ')
      }
      return `${texts.length} selected`
    }
    // Single-select: show the value's text
    return getValueText(comboboxContext.value) ?? comboboxContext.value
  }, [
    open,
    hasValue,
    comboboxContext.inputValue,
    comboboxContext.multiple,
    comboboxContext.value,
    comboboxContext.values,
    getValueText,
  ])

  // Track if open was triggered by typing (to avoid overwriting typed character)
  const openedByTypingRef = React.useRef(false)

  // When opening, initialize input value with the selected value's label
  // This allows users to see what's selected and modify it if needed
  const prevOpenRef = React.useRef(open)
  React.useEffect(() => {
    if (open && !prevOpenRef.current) {
      // If opened by typing, don't overwrite the typed character
      if (openedByTypingRef.current) {
        openedByTypingRef.current = false
        prevOpenRef.current = open
        return
      }

      // Just opened - set input to show the selected value's label
      if (hasValue) {
        if (comboboxContext.multiple) {
          // For multi-select, clear input for fresh search (can't edit multiple values)
          comboboxContext.onInputValueChange('')
        } else {
          // For single-select, show the selected value's label
          const selectedLabel =
            getValueText(comboboxContext.value) ?? comboboxContext.value
          comboboxContext.onInputValueChange(selectedLabel)
        }
      } else {
        // No value selected, start with empty input
        comboboxContext.onInputValueChange('')
      }
    }
    prevOpenRef.current = open
  }, [open, comboboxContext, hasValue, getValueText])

  // Handle input change
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value
      comboboxContext.onInputValueChange(newValue)

      // Mark that the user has changed the query, enabling filtering
      comboboxContext.markQueryChanged()

      // Also update the store's search state for filtering
      popupMenuContext.store.setSearch(newValue)

      // Open the combobox if not already open
      if (!popupMenuContext.store.state.open) {
        // Mark that we're opening by typing so the effect doesn't overwrite the value
        openedByTypingRef.current = true
        comboboxContext.openCombobox()
      }
    },
    [comboboxContext, popupMenuContext.store],
  )

  // Handle focus
  const handleFocus = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(event)
      if (event.defaultPrevented) return

      if (comboboxContext.openOnFocus && !disabled) {
        comboboxContext.openCombobox()
      }
    },
    [onFocus, comboboxContext, disabled],
  )

  // Handle blur - close combobox when focus moves outside
  const handleBlur = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(event)
      if (event.defaultPrevented) return

      // Use requestAnimationFrame to check where focus moved to
      // This allows the click on an item to complete before we check
      requestAnimationFrame(() => {
        const activeElement = document.activeElement

        // Check if focus moved to something inside the popup
        // The popup is rendered in a portal, so we need to check if the active element
        // is inside any element with role="listbox" that belongs to this combobox
        const listbox = document.getElementById(comboboxContext.listId)
        const isInsideListbox = listbox?.contains(activeElement)

        // Also check if focus is still on the input itself
        const isOnInput = activeElement === comboboxContext.inputRef.current

        if (!isInsideListbox && !isOnInput) {
          comboboxContext.closeCombobox()
        }
      })
    },
    [onBlur, comboboxContext],
  )

  // Handle click
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLInputElement>) => {
      onClick?.(event)
      if (event.defaultPrevented) return

      if (!disabled) {
        comboboxContext.openCombobox()
      }
    },
    [onClick, comboboxContext, disabled],
  )

  // Handle keyboard when popup is closed (opening it)
  const handleKeyDownWhenClosed = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      // Let user handler run first
      onKeyDown?.(event)
      if (event.defaultPrevented) return

      // If popup is closed, open it on arrow keys or Enter
      if (!open) {
        if (
          event.key === 'ArrowDown' ||
          event.key === 'ArrowUp' ||
          event.key === 'Enter'
        ) {
          event.preventDefault()
          comboboxContext.openCombobox()
          return
        }
      }
    },
    [open, comboboxContext, onKeyDown],
  )

  // Use centralized keyboard navigation hook for when popup is open
  // This handles Enter to select, arrow keys for navigation, Escape to close, etc.
  const { handleKeyDown: handleKeyDownFromHook } = usePopupMenuKeyboard({
    store: popupMenuContext.store,
    surfaceId: 'combobox-input', // Input acts as a virtual surface for keyboard handling
    focusOwnerStore,
    depth: 0,
    submenuContext: null,
    enabled: open, // Only enabled when popup is open
    enableTypeToSearch: false,
    onKeyDown: handleKeyDownWhenClosed, // Chain with our closed-state handler
    closeAll: comboboxContext.closeCombobox,
    // Skip focus owner check because the input is outside the Surface
    // but should still handle keyboard navigation when the popup is open
    skipFocusOwnerCheck: true,
  })

  // Combined keyboard handler
  const handleKeyDown = handleKeyDownFromHook

  // Build data attributes
  const dataAttrs: Record<string, string> = {}
  if (open) {
    dataAttrs[ComboboxInputDataAttributes.open] = ''
  } else {
    dataAttrs[ComboboxInputDataAttributes.closed] = ''
  }
  if (disabled) {
    dataAttrs[ComboboxInputDataAttributes.disabled] = ''
  }
  if (!hasValue) {
    dataAttrs[ComboboxInputDataAttributes.placeholder] = ''
  }

  // Register input element for positioning
  const mergedRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      comboboxContext.setInputElement(node)
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    [forwardedRef, comboboxContext],
  )

  const state: ComboboxInputState = React.useMemo(
    () => ({
      open,
      disabled,
      placeholder: !hasValue,
    }),
    [open, disabled, hasValue],
  )

  const element = useRender({
    render,
    ref: mergedRef,
    state,
    props: {
      ...rest,
      ...dataAttrs,
      type: 'text',
      role: 'combobox',
      'aria-autocomplete': 'list',
      'aria-expanded': open,
      'aria-controls': comboboxContext.listId,
      'aria-haspopup': 'listbox',
      autoComplete: 'off',
      autoCorrect: 'off',
      spellCheck: false,
      disabled,
      placeholder: !hasValue ? placeholder : undefined,
      className,
      style,
      value: displayValue,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
    },
    defaultTagName: 'input',
  })

  return element
})

export namespace ComboboxInput {
  export interface Props extends ComboboxInputProps {}
  export type State = ComboboxInputState
}
