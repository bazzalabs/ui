'use client'

import * as React from 'react'
import type { ListboxStore } from '../store/ListboxStore.js'

/**
 * Focus owner interface for keyboard handling.
 * Optional - only needed for popup menus with multiple surfaces.
 */
export interface FocusOwnerInterface {
  /** Check if a surface is the current owner */
  useState: (selector: 'isOwner', surfaceId: string) => boolean
  /** Set the owner surface ID */
  setOwnerId: (id: string | null) => void
}

/**
 * Submenu context interface for keyboard handling.
 * Optional - only needed for popup menus with submenus.
 */
export interface SubmenuInterface {
  /** Close this submenu */
  setOpen: (open: boolean) => void
  /** Parent surface ID for focus transfer */
  parentSurfaceId: string
  /** Whether Escape closes the root menu or just this submenu */
  closeRootOnEsc?: boolean
}

export interface UseListboxKeyboardParams {
  /** The Listbox store instance */
  store: ListboxStore
  /** Unique identifier for this surface */
  surfaceId: string
  /** Whether keyboard handling is enabled */
  enabled: boolean
  /** User's onKeyDown handler to compose with */
  onKeyDown?: React.KeyboardEventHandler
  /**
   * Callback when an item is selected via keyboard (Enter or shortcut).
   * Called with the selected item's ID. The consumer handles any
   * post-selection behavior like closing menus.
   */
  onSelect?: (itemId: string | null) => void
  /**
   * Callback to close the entire menu tree from the root.
   * Used when Escape is pressed and closeRootOnEsc is true (default).
   */
  closeAll: () => void

  // Optional popup-menu features

  /** The FocusOwner store for managing focus ownership (optional) */
  focusOwner?: FocusOwnerInterface
  /** Menu depth (0 for root, >0 for submenus) - defaults to 0 */
  depth?: number
  /** Submenu context for ArrowLeft navigation back to parent (optional) */
  submenuContext?: SubmenuInterface | null
  /**
   * Whether to enable type-to-search behavior.
   * When true, printable characters will activate the input and set pending search.
   * Used by List when hideUntilActive is enabled and input is not yet active.
   * @default false
   */
  enableTypeToSearch?: boolean
}

export interface UseListboxKeyboardReturn {
  /** Keyboard event handler to attach to the element */
  handleKeyDown: React.KeyboardEventHandler
}

/**
 * Centralized keyboard navigation hook for listbox-like components.
 * Handles arrow navigation, vim bindings, submenu open/close, and selection.
 *
 * This hook can be used standalone (for simple listboxes like Select/Command)
 * or with focus owner and submenu support (for popup menus with nested menus).
 */
export function useListboxKeyboard(
  params: UseListboxKeyboardParams,
): UseListboxKeyboardReturn {
  const {
    store,
    surfaceId,
    enabled,
    onKeyDown,
    onSelect,
    closeAll,
    focusOwner,
    depth = 0,
    submenuContext,
    enableTypeToSearch = false,
  } = params

  // Subscribe to focus ownership if available
  const isOwner = focusOwner?.useState('isOwner', surfaceId) ?? true

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
          if (depth > 0 && submenuContext && focusOwner) {
            event.preventDefault()
            submenuContext.setOpen(false)
            // Transfer focus back to parent surface
            focusOwner.setOwnerId(submenuContext.parentSurfaceId)
          }
          break
        }
        case 'h': {
          // Ctrl+H - close submenu (vim binding)
          if (event.ctrlKey && depth > 0 && submenuContext && focusOwner) {
            event.preventDefault()
            submenuContext.setOpen(false)
            // Transfer focus back to parent surface
            focusOwner.setOwnerId(submenuContext.parentSurfaceId)
          }
          break
        }
        case 'Enter': {
          event.preventDefault()
          const selectedId = store.state.highlightedId
          store.selectHighlighted()
          onSelect?.(selectedId)
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
            // Root menu: let parent component handle it normally
            // (closes the menu and returns focus to trigger)
            break
          }

          // In a submenu: always prevent default to avoid parent's focus restoration
          event.preventDefault()
          event.stopPropagation()

          if (submenuContext?.closeRootOnEsc !== false) {
            // closeRootOnEsc is true (default): close entire menu tree
            closeAll()
          } else {
            // closeRootOnEsc is false: close only this submenu
            submenuContext.setOpen(false)
            // Transfer focus back to parent surface
            if (focusOwner) {
              focusOwner.setOwnerId(submenuContext.parentSurfaceId)
            }
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
            const itemId = store.context.shortcuts.get(event.key.toLowerCase())
            if (itemId && store.selectByShortcut(event.key)) {
              event.preventDefault()
              onSelect?.(itemId)
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
      focusOwner,
      onSelect,
      closeAll,
    ],
  )

  return { handleKeyDown }
}
