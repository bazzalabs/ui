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

  // Register that an Input is present
  // Note: Auto-focus is handled by Surface when it becomes the focus owner
  React.useEffect(() => {
    store.setHasInput(true)
    return () => store.setHasInput(false)
  }, [store])

  // Determine the actual value (controlled input prop > controlled surface > uncontrolled)
  const isInputControlled = controlledValue !== undefined
  const displayValue = isInputControlled ? controlledValue : search

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

  return useRender({
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
})

export namespace DropdownMenuInput {
  export type State = DropdownMenuInputState
  export interface Props extends DropdownMenuInputProps {}
}
