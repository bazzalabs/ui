'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useFocusOwner } from '../contexts/focus-owner-context.js'
import { useRootContext } from '../contexts/root-context.js'
import { useMaybeSubmenuContext } from '../contexts/submenu-context.js'
import { useSurfaceContext } from '../contexts/surface-context.js'

// Input doesn't expose data attributes - using empty state
export interface DropdownMenuInputState extends Record<string, unknown> {}

export interface DropdownMenuInputProps
  extends Omit<
    ComponentProps<'input', DropdownMenuInputState>,
    'value' | 'onChange' | 'type'
  > {
  /**
   * Controlled value for the search input.
   * If provided, this takes precedence over the Surface's search state.
   */
  value?: string

  /**
   * Callback when the input value changes.
   */
  onValueChange?: (value: string) => void

  /**
   * When true, the input is not rendered until the user starts typing.
   * The List receives focus initially, and typing a character activates the input.
   * Once activated, the input stays visible until the menu closes.
   * @default false
   */
  hideUntilActive?: boolean
}

/**
 * Search input for filtering dropdown menu items.
 * Handles keyboard navigation (Arrow keys, Ctrl+N/P, Enter).
 * Renders an `<input>` element.
 */
export const DropdownMenuInput = React.forwardRef<
  HTMLInputElement,
  DropdownMenuInputProps
>(function DropdownMenuInput(props, forwardedRef) {
  const {
    value: controlledValue,
    onValueChange,
    hideUntilActive = false,
    render,
    className,
    style,
    onKeyDown,
    ...rest
  } = props

  const { store, surfaceId } = useSurfaceContext()
  const { depth } = useRootContext()
  const submenuContext = useMaybeSubmenuContext()
  const focusOwnerStore = useFocusOwner()
  const internalRef = React.useRef<HTMLInputElement>(null)

  // Subscribe to focus ownership
  const isOwner = focusOwnerStore.useState('isOwner', surfaceId)

  // Get values from store
  const search = store.useState('search')
  const highlightedId = store.useState('highlightedId')
  const listId = store.context.listId
  const inputId = store.context.inputId

  // Register hideUntilActive mode
  React.useEffect(() => {
    store.setHideUntilActive(hideUntilActive)
    return () => store.setHideUntilActive(false)
  }, [store, hideUntilActive])

  // Subscribe to inputActive and pendingSearch state
  const inputActive = store.useState('inputActive')
  const pendingSearch = store.useState('pendingSearch')

  // Determine if we should render
  const shouldRender = !hideUntilActive || inputActive

  // Register that an Input is present - ONLY when actually rendering
  // This ensures List handles keyboard when Input is hidden
  React.useEffect(() => {
    if (!shouldRender) {
      return // Don't register when hidden
    }
    store.setHasInput(true)
    return () => store.setHasInput(false)
  }, [store, shouldRender])

  // Determine the actual value (controlled input prop > controlled surface > uncontrolled)
  const isInputControlled = controlledValue !== undefined
  const displayValue = isInputControlled ? controlledValue : search

  // Consume pending search on activation
  React.useEffect(() => {
    if (pendingSearch && internalRef.current) {
      // Set the search value from pending
      if (isInputControlled) {
        onValueChange?.(pendingSearch)
      } else {
        store.setSearch(pendingSearch)
        onValueChange?.(pendingSearch)
      }
      // Clear pending search
      store.setPendingSearch('')
      // Focus the input
      internalRef.current.focus()
    }
  }, [pendingSearch, store, isInputControlled, onValueChange])

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value

      if (isInputControlled) {
        onValueChange?.(newValue)
      } else {
        store.setSearch(newValue)
        onValueChange?.(newValue)
      }
    },
    [isInputControlled, onValueChange, store],
  )

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event)

      if (event.defaultPrevented) return

      // Only handle keyboard if this surface owns focus
      if (!isOwner) return

      // Check for IME composition
      if (event.nativeEvent.isComposing || event.keyCode === 229) return

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault()
          store.highlightNext()
          break
        }
        case 'ArrowUp': {
          event.preventDefault()
          store.highlightPrev()
          break
        }
        case 'n': {
          // Ctrl+N - next item (vim binding)
          if (event.ctrlKey) {
            event.preventDefault()
            store.highlightNext()
          }
          break
        }
        case 'p': {
          // Ctrl+P - previous item (vim binding)
          if (event.ctrlKey) {
            event.preventDefault()
            store.highlightPrev()
          }
          break
        }
        case 'ArrowRight': {
          // Open submenu if highlighted item is a submenu trigger
          // Note: Focus transfer is handled by SubmenuTrigger's registerSubmenuOpen callback
          if (store.isHighlightedSubmenuTrigger()) {
            event.preventDefault()
            store.openSubmenuForHighlighted()
          }
          break
        }
        case 'l': {
          // Ctrl+L - open submenu (vim binding)
          // Note: Focus transfer is handled by SubmenuTrigger's registerSubmenuOpen callback
          if (event.ctrlKey && store.isHighlightedSubmenuTrigger()) {
            event.preventDefault()
            store.openSubmenuForHighlighted()
          }
          break
        }
        case 'ArrowLeft': {
          // Close submenu and return to parent (only if in a submenu)
          if (depth > 0 && submenuContext) {
            event.preventDefault()
            submenuContext.setOpen(false)
            // Transfer focus back to parent surface
            focusOwnerStore.setOwnerId(submenuContext.parentSurfaceId)
          }
          break
        }
        case 'Enter': {
          event.preventDefault()
          store.selectHighlighted()
          break
        }
        case 'Home': {
          // Move to first item
          event.preventDefault()
          // We'd need to expose a highlightFirst action, for now use highlightNext from start
          // This is a simplification - could be improved
          break
        }
        case 'End': {
          // Move to last item
          event.preventDefault()
          // Similar to Home - could expose highlightLast
          break
        }
      }
    },
    [onKeyDown, store, depth, submenuContext, isOwner, focusOwnerStore],
  )

  const element = useRender({
    render,
    ref: [internalRef, forwardedRef],
    props: {
      ...rest,
      id: inputId,
      type: 'text',
      role: 'combobox',
      'aria-autocomplete': 'list',
      'aria-expanded': true,
      'aria-controls': listId,
      'aria-activedescendant': highlightedId ?? undefined,
      autoComplete: 'off',
      autoCorrect: 'off',
      spellCheck: false,
      className,
      style,
      value: displayValue,
      onChange: handleChange,
      onKeyDown: handleKeyDown,
    },
    defaultTagName: 'input',
  })

  // Don't render if hideUntilActive is enabled and not yet active
  if (!shouldRender) {
    return null
  }

  return element
})

export namespace DropdownMenuInput {
  export type State = DropdownMenuInputState
  export interface Props extends DropdownMenuInputProps {}
}
