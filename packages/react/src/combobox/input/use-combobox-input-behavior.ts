'use client'

import * as React from 'react'
import type { ListboxStore } from '../../internal/listbox/index.js'
import { usePopupMenuKeyboard } from '../../internal/popup-menu/hooks/use-popup-menu-keyboard.js'
import type { FocusOwnerStore } from '../../internal/popup-menu/store/FocusOwnerStore.js'
import { REASONS } from '../../utils/events/index.js'
import { resolveLabel } from '../../utils/resolve-value-label.js'
import type { ComboboxContextValue } from '../contexts/combobox-context.js'
import type { ComboboxInputCursorBehavior } from './input.js'

export interface UseComboboxInputBehaviorParams {
  comboboxContext: ComboboxContextValue
  store: ListboxStore
  focusOwnerStore: FocusOwnerStore
  open: boolean
  disabled: boolean
  cursorBehavior: ComboboxInputCursorBehavior
  hasValue: boolean
  /** Get display text for a value - receives the raw value (possibly an object) */
  getValueText: (value: unknown) => string | undefined
  // User event handlers to chain
  onFocus?: React.FocusEventHandler<HTMLInputElement>
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  onClick?: React.MouseEventHandler<HTMLInputElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
}

export interface UseComboboxInputBehaviorReturn {
  handleChange: React.ChangeEventHandler<HTMLInputElement>
  handleFocus: React.FocusEventHandler<HTMLInputElement>
  handleBlur: React.FocusEventHandler<HTMLInputElement>
  handleClick: React.MouseEventHandler<HTMLInputElement>
  handleKeyDown: React.KeyboardEventHandler<HTMLInputElement>
  /** Ref to track selection for controlled input restoration */
  selectionRef: React.MutableRefObject<{ start: number; end: number } | null>
}

/**
 * Hook to manage combobox input behavior including:
 * - Cursor positioning on open (cursorBehavior prop)
 * - Selection preservation for controlled inputs
 * - Focus/blur handling with popup awareness
 * - Click handling to open popup
 * - Keyboard navigation integration
 */
export function useComboboxInputBehavior(
  params: UseComboboxInputBehaviorParams,
): UseComboboxInputBehaviorReturn {
  const {
    comboboxContext,
    store,
    focusOwnerStore,
    open,
    disabled,
    cursorBehavior,
    hasValue,
    getValueText,
    onFocus,
    onBlur,
    onClick,
    onKeyDown,
  } = params

  // Track if open was triggered by typing (to avoid overwriting typed character)
  const openedByTypingRef = React.useRef(false)

  // Track if open was triggered by click (to restore cursor position)
  const openedByClickRef = React.useRef(false)

  // Track if input was already focused when opening (skip cursor behavior if so)
  const wasAlreadyFocusedRef = React.useRef(false)

  // Track the click cursor position to restore after value changes
  const clickCursorPositionRef = React.useRef<number | null>(null)

  // Track the last selection to restore after controlled value updates
  const selectionRef = React.useRef<{ start: number; end: number } | null>(null)

  // Track if blur was caused by a pointer event (to distinguish outside-press from focus-out)
  // Also store the event itself so we can pass it to the close handler
  const outsidePointerEventRef = React.useRef<PointerEvent | null>(null)

  // Listen for pointerdown on document to detect outside clicks
  React.useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      const input = comboboxContext.inputRef.current
      const inputWrapper = comboboxContext.inputWrapperRef.current
      const listbox = document.getElementById(comboboxContext.listId)

      const target = event.target as Node

      // Check if click is inside the input, wrapper, or listbox
      const isInsideInput = input?.contains(target)
      const isInsideWrapper = inputWrapper?.contains(target)
      const isInsideListbox = listbox?.contains(target)

      if (!isInsideInput && !isInsideWrapper && !isInsideListbox) {
        // Pointer down outside - store the event for blur handler
        outsidePointerEventRef.current = event
      }
    }

    // Use capture phase so we see the event before stopPropagation can block it
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      outsidePointerEventRef.current = null
    }
  }, [
    open,
    comboboxContext.inputRef,
    comboboxContext.inputWrapperRef,
    comboboxContext.listId,
  ])

  // Restore selection after React re-renders the controlled input
  React.useLayoutEffect(() => {
    const inputElement = comboboxContext.inputRef.current
    if (inputElement && open && selectionRef.current) {
      const { start, end } = selectionRef.current
      // Only restore if the current selection is at the end (React's default reset position)
      // This avoids interfering with intentional cursor movements
      const currentPos = inputElement.selectionStart
      const valueLen = inputElement.value.length
      if (currentPos === valueLen && start !== valueLen) {
        inputElement.setSelectionRange(start, end)
      }
      selectionRef.current = null
    }
  })

  // When opening, apply cursor behavior based on how the combobox was opened
  const prevOpenRef = React.useRef(open)
  React.useLayoutEffect(() => {
    if (open && !prevOpenRef.current) {
      // If opened by typing, don't overwrite the typed character
      if (openedByTypingRef.current) {
        openedByTypingRef.current = false
        prevOpenRef.current = open
        return
      }

      // If input was already focused, skip cursor behavior entirely
      // Let the browser handle cursor positioning naturally
      if (wasAlreadyFocusedRef.current) {
        wasAlreadyFocusedRef.current = false
        openedByClickRef.current = false
        clickCursorPositionRef.current = null
        prevOpenRef.current = open
        return
      }

      // If opened by click with cursorBehavior='none', restore cursor to click position
      if (openedByClickRef.current && cursorBehavior === 'none') {
        const inputElement = comboboxContext.inputRef.current
        const clickPos = clickCursorPositionRef.current

        if (inputElement && clickPos !== null) {
          // Use requestAnimationFrame to ensure DOM has updated
          requestAnimationFrame(() => {
            // Clamp position to the current value length (in case text changed)
            const maxPos = inputElement.value.length
            const safePos = Math.min(clickPos, maxPos)
            inputElement.setSelectionRange(safePos, safePos)
          })
        }

        openedByClickRef.current = false
        clickCursorPositionRef.current = null
        prevOpenRef.current = open
        return
      }

      // For multi-select, clear input for fresh search
      if (hasValue && comboboxContext.multiple) {
        comboboxContext.onInputValueChange('')
      }

      // Apply cursor behavior based on prop (only when initially opening from unfocused state)
      // Note: The input value is already set by the click/focus/keyboard handlers
      const inputElement = comboboxContext.inputRef.current
      if (inputElement) {
        const valueLength = inputElement.value.length

        if (cursorBehavior === 'select-all' && valueLength > 0) {
          // Use requestAnimationFrame to ensure the value has been applied
          requestAnimationFrame(() => {
            inputElement.setSelectionRange(0, inputElement.value.length)
          })
        } else if (cursorBehavior === 'end' && valueLength > 0) {
          requestAnimationFrame(() => {
            inputElement.setSelectionRange(
              inputElement.value.length,
              inputElement.value.length,
            )
          })
        }
        // For cursorBehavior='none' without click tracking (e.g., focus/keyboard open),
        // cursor naturally goes to end which is acceptable
      }
    }
    prevOpenRef.current = open
  }, [open, comboboxContext, hasValue, cursorBehavior])

  // Handle input change
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputElement = event.target
      const newValue = inputElement.value

      // Save selection position to restore after React re-render
      const start = inputElement.selectionStart
      const end = inputElement.selectionEnd
      if (start !== null && end !== null) {
        selectionRef.current = { start, end }
      }

      comboboxContext.onInputValueChange(newValue)

      // Set filter mode to active (normal filtering using inputValue)
      comboboxContext.setFilterActive()

      // Also update the store's search state for filtering
      store.setSearch(newValue)

      // Open the combobox if not already open
      if (!store.state.open) {
        // Mark that we're opening by typing so the effect doesn't overwrite the value
        openedByTypingRef.current = true
        comboboxContext.openCombobox()
      }
    },
    [comboboxContext, store],
  )

  // Handle focus
  const handleFocus = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(event)
      if (event.defaultPrevented) return

      const isOpen = store.state.open

      // If popup is already open, input is getting focus while open
      // Mark as already focused so click handler knows not to apply cursorBehavior
      if (isOpen) {
        wasAlreadyFocusedRef.current = true
      }

      if (comboboxContext.openOnFocus && !disabled && !isOpen) {
        // Pre-set the input value BEFORE opening to avoid the empty intermediate state
        if (hasValue && !comboboxContext.multiple) {
          const labelValue =
            getValueText(comboboxContext.value) ??
            resolveLabel(
              comboboxContext.value,
              comboboxContext.itemToStringLabel,
            )
          comboboxContext.onInputValueChange(labelValue)
        }
        comboboxContext.openCombobox()
      }
    },
    [onFocus, comboboxContext, disabled, store, hasValue, getValueText],
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
          // Reset the "already focused" flag when closing
          wasAlreadyFocusedRef.current = false
          // Use outside-press if blur was caused by a pointer event, otherwise focus-out
          const pointerEvent = outsidePointerEventRef.current
          const reason = pointerEvent ? REASONS.outsidePress : REASONS.focusOut
          outsidePointerEventRef.current = null
          comboboxContext.closeCombobox(reason, pointerEvent ?? undefined)
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

      const isOpen = store.state.open

      if (!disabled && !isOpen) {
        const inputElement = event.target as HTMLInputElement

        // Capture cursor position before opening (for cursorBehavior='none')
        if (cursorBehavior === 'none') {
          // The browser has already calculated the click position based on current text
          const clickPosition = inputElement.selectionStart
          clickCursorPositionRef.current = clickPosition
          openedByClickRef.current = true
        }

        // Pre-set the input value BEFORE opening to avoid the empty intermediate state
        // This prevents the flash where displayValue goes from "Banana" -> "" -> "Banana"
        if (hasValue && !comboboxContext.multiple) {
          const labelValue =
            getValueText(comboboxContext.value) ??
            resolveLabel(
              comboboxContext.value,
              comboboxContext.itemToStringLabel,
            )
          comboboxContext.onInputValueChange(labelValue)
        }

        comboboxContext.openCombobox()
      } else if (isOpen) {
        // Clicking while already open - mark as already focused
        // This will prevent cursorBehavior from being applied if popup re-opens
        wasAlreadyFocusedRef.current = true
      }
    },
    [
      onClick,
      comboboxContext,
      disabled,
      store,
      cursorBehavior,
      hasValue,
      getValueText,
    ],
  )

  // Handle keyboard when popup is closed (opening it) or Escape to close
  const handleKeyDownWhenClosed = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      // Let user handler run first
      onKeyDown?.(event)
      if (event.defaultPrevented) return

      // Handle Escape to close popup (input stays focused)
      if (open && event.key === 'Escape') {
        event.preventDefault()
        comboboxContext.closeCombobox(REASONS.escapeKey)
        return
      }

      // If popup is closed, open it on arrow keys or Enter
      if (!open) {
        if (
          event.key === 'ArrowDown' ||
          event.key === 'ArrowUp' ||
          event.key === 'Enter'
        ) {
          event.preventDefault()
          // Pre-set the input value BEFORE opening to avoid the empty intermediate state
          if (hasValue && !comboboxContext.multiple) {
            const labelValue =
              getValueText(comboboxContext.value) ??
              resolveLabel(
                comboboxContext.value,
                comboboxContext.itemToStringLabel,
              )
            comboboxContext.onInputValueChange(labelValue)
          }
          comboboxContext.openCombobox()
          return
        }
      }
    },
    [open, comboboxContext, onKeyDown, hasValue, getValueText],
  )

  // Use centralized keyboard navigation hook for when popup is open
  // This handles Enter to select, arrow keys for navigation, Escape to close, etc.
  const { handleKeyDown: handleKeyDownFromHook } = usePopupMenuKeyboard({
    store,
    surfaceId: 'combobox-input', // Input acts as a virtual surface for keyboard handling
    focusOwnerStore,
    depth: 0,
    submenuContext: null,
    subpageContext: null,
    enabled: open, // Only enabled when popup is open
    enableTypeToSearch: false,
    onKeyDown: handleKeyDownWhenClosed, // Chain with our closed-state handler
    closeAll: comboboxContext.closeCombobox,
    // Skip focus owner check because the input is outside the Surface
    // but should still handle keyboard navigation when the popup is open
    skipFocusOwnerCheck: true,
  })

  return {
    handleChange,
    handleFocus,
    handleBlur,
    handleClick,
    handleKeyDown: handleKeyDownFromHook,
    selectionRef,
  }
}
