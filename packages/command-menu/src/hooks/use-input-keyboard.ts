import { SELECT_ITEM_EVENT, type SurfaceStore } from '@bazza-ui/menu'
import * as React from 'react'

export interface UseInputKeyboardOptions {
  /** Surface store for navigation */
  store: SurfaceStore<any>
  /** Whether vim bindings are enabled */
  vimBindings: boolean
  /** Text direction */
  dir: 'ltr' | 'rtl'
  /** Whether currently in a submenu */
  isInSubmenu: boolean
  /** Callback to pop submenu */
  popSubmenu: () => void
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void
}

/**
 * Hook for handling keyboard navigation from the input field.
 * Extracts all keyboard logic from CommandMenuInput component.
 */
export function useInputKeyboard(options: UseInputKeyboardOptions) {
  const { store, vimBindings, dir, isInSubmenu, popSubmenu, onOpenChange } =
    options

  return React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const k = e.key

      // Vim bindings
      if (vimBindings) {
        if (e.ctrlKey && (e.key === 'n' || e.key === 'j')) {
          e.preventDefault()
          store.next('keyboard')
          return
        }
        if (e.ctrlKey && (e.key === 'p' || e.key === 'k')) {
          e.preventDefault()
          store.prev('keyboard')
          return
        }
        if (e.ctrlKey && e.key === 'h') {
          e.preventDefault()
          if (isInSubmenu) {
            popSubmenu()
          }
          return
        }
      }

      // Arrow navigation
      if (k === 'ArrowDown') {
        e.preventDefault()
        store.next('keyboard')
        return
      }
      if (k === 'ArrowUp') {
        e.preventDefault()
        store.prev('keyboard')
        return
      }

      // Page navigation
      if (k === 'Home' || k === 'PageUp') {
        e.preventDefault()
        store.first('keyboard')
        return
      }
      if (k === 'End' || k === 'PageDown') {
        e.preventDefault()
        store.last('keyboard')
        return
      }

      // Enter - trigger select on active item
      if (k === 'Enter') {
        e.preventDefault()
        const activeId = store.snapshot().activeId
        const activeRow = activeId ? store.rows.get(activeId) : null
        if (activeRow?.ref.current) {
          activeRow.ref.current.dispatchEvent(
            new CustomEvent(SELECT_ITEM_EVENT, { bubbles: false }),
          )
        }
        return
      }

      // Escape - close dialog
      if (k === 'Escape') {
        e.preventDefault()
        onOpenChange(false)
        return
      }

      // Left arrow - go back from submenu
      if (k === 'ArrowLeft' && dir === 'ltr') {
        if (isInSubmenu) {
          e.preventDefault()
          popSubmenu()
        }
        return
      }
      if (k === 'ArrowRight' && dir === 'rtl') {
        if (isInSubmenu) {
          e.preventDefault()
          popSubmenu()
        }
        return
      }
    },
    [store, vimBindings, dir, isInSubmenu, popSubmenu, onOpenChange],
  )
}
