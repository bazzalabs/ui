'use client'

import * as React from 'react'
import type { SubmenuContextValue } from '../contexts/submenu-context.js'
import type { DropdownMenuStore } from '../store/DropdownMenuStore.js'
import type { FocusOwnerStore } from '../store/FocusOwnerStore.js'

export interface UseKeyboardParams {
  /** The DropdownMenu store instance */
  store: DropdownMenuStore
  /** Unique identifier for this surface */
  surfaceId: string
  /** The FocusOwner store for managing focus ownership */
  focusOwnerStore: FocusOwnerStore
  /** Menu depth (0 for root, >0 for submenus) */
  depth: number
  /** Submenu context for ArrowLeft navigation back to parent */
  submenuContext: SubmenuContextValue | null
  /** Whether keyboard handling is enabled */
  enabled: boolean
  /**
   * Whether to enable type-to-search behavior.
   * When true, printable characters will activate the input and set pending search.
   * Used by List when hideUntilActive is enabled and input is not yet active.
   * @default false
   */
  enableTypeToSearch?: boolean
  /** User's onKeyDown handler to compose with */
  onKeyDown?: React.KeyboardEventHandler
  /**
   * Callback to close the entire menu tree from the root.
   * Used when Escape is pressed and closeRootOnEsc is true (default).
   */
  closeAll: () => void
}

export interface UseKeyboardReturn {
  /** Keyboard event handler to attach to the element */
  handleKeyDown: React.KeyboardEventHandler
}

/**
 * Centralized keyboard navigation hook for DropdownMenu.
 * Handles arrow navigation, vim bindings, submenu open/close, and selection.
 */
export function useKeyboard(params: UseKeyboardParams): UseKeyboardReturn {
  const {
    store,
    surfaceId,
    focusOwnerStore,
    depth,
    submenuContext,
    enabled,
    enableTypeToSearch = false,
    onKeyDown,
    closeAll,
  } = params

  // Subscribe to focus ownership
  const isOwner = focusOwnerStore.useState('isOwner', surfaceId)

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      // Call user's handler first
      onKeyDown?.(event)

      if (event.defaultPrevented) return

      // Only handle keyboard if enabled and this surface owns focus
      if (!enabled) return
      if (!isOwner) return

      // Check for IME composition
      if (event.nativeEvent.isComposing || event.keyCode === 229) return

      // Type-to-search: detect printable characters when enabled
      if (enableTypeToSearch) {
        const hideUntilActive = store.context.hideUntilActive
        const inputActive = store.state.inputActive

        if (hideUntilActive && !inputActive) {
          const isPrintable =
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey

          if (isPrintable) {
            event.preventDefault()
            store.setPendingSearch(event.key)
            store.setInputActive(true)
            return
          }
        }
      }

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
        case 'h': {
          // Ctrl+H - close submenu (vim binding)
          if (event.ctrlKey && depth > 0 && submenuContext) {
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
          // Highlight first item
          event.preventDefault()
          store.setHighlightedId(null)
          store.highlightNext()
          break
        }
        case 'End': {
          // Highlight last item
          event.preventDefault()
          store.setHighlightedId(null)
          store.highlightPrev()
          break
        }
        case 'Escape': {
          // Handle Escape based on depth and closeRootOnEsc setting
          if (depth === 0) {
            // Root menu: let Base UI's Popover handle it normally
            // (closes the menu and returns focus to trigger)
            break
          }

          // In a submenu: always prevent default to avoid Popover's focus restoration
          event.preventDefault()
          event.stopPropagation()

          if (submenuContext?.closeRootOnEsc !== false) {
            // closeRootOnEsc is true (default): close entire menu tree
            closeAll()
          } else {
            // closeRootOnEsc is false: close only this submenu
            submenuContext.setOpen(false)
            // Transfer focus back to parent surface
            focusOwnerStore.setOwnerId(submenuContext.parentSurfaceId)
          }
          break
        }
        default: {
          // Handle single-character shortcuts (only when not typing in search input)
          // Shortcuts are disabled when there's an active search to avoid conflicts
          const hasActiveSearch = store.state.search.length > 0
          const isPrintable =
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey

          if (isPrintable && !hasActiveSearch) {
            if (store.selectByShortcut(event.key)) {
              event.preventDefault()
              closeAll()
            }
          }
          break
        }
      }
    },
    [
      onKeyDown,
      enabled,
      isOwner,
      enableTypeToSearch,
      store,
      depth,
      submenuContext,
      focusOwnerStore,
      closeAll,
    ],
  )

  return { handleKeyDown }
}
