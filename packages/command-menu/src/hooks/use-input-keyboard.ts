import { SELECT_ITEM_EVENT } from '@bazza-ui/menu'
import * as React from 'react'
import type { StoreApi } from 'zustand'
import type { CommandMenuStore } from '../store/index.js'

export interface UseInputKeyboardOptions {
  /** Surface ID for navigation */
  surfaceId: string
  /** Global store API */
  globalStore: StoreApi<CommandMenuStore<any>>
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
  const {
    surfaceId,
    globalStore,
    vimBindings,
    dir,
    isInSubmenu,
    popSubmenu,
    onOpenChange,
  } = options

  return React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const k = e.key
      const state = globalStore.getState()

      // Vim bindings
      if (vimBindings) {
        if (e.ctrlKey && (e.key === 'n' || e.key === 'j')) {
          e.preventDefault()
          state.next(surfaceId, 'keyboard')
          return
        }
        if (e.ctrlKey && (e.key === 'p' || e.key === 'k')) {
          e.preventDefault()
          state.prev(surfaceId, 'keyboard')
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
        state.next(surfaceId, 'keyboard')
        return
      }
      if (k === 'ArrowUp') {
        e.preventDefault()
        state.prev(surfaceId, 'keyboard')
        return
      }

      // Page navigation
      if (k === 'Home' || k === 'PageUp') {
        e.preventDefault()
        state.first(surfaceId, 'keyboard')
        return
      }
      if (k === 'End' || k === 'PageDown') {
        e.preventDefault()
        state.last(surfaceId, 'keyboard')
        return
      }

      // Enter - trigger select on active item
      if (k === 'Enter') {
        e.preventDefault()
        const surface = state.surfaces.get(surfaceId)
        const activeId = surface?.activeId ?? null
        const activeRow = activeId ? surface?.rows.get(activeId) : null
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
    [
      surfaceId,
      globalStore,
      vimBindings,
      dir,
      isInSubmenu,
      popSubmenu,
      onOpenChange,
    ],
  )
}
