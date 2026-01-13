'use client'

// ============================================================================
// usePopupMenuKeyboard Hook - Wrapper around internal/listbox useListboxKeyboard
// ============================================================================
// This wrapper integrates the focus owner and submenu contexts from popup-menu

import * as React from 'react'
import { type ListboxStore, useListboxKeyboard } from '../../listbox/index.js'
import type { SubmenuContextValue } from '../contexts/submenu-context.js'
import type { FocusOwnerStore } from '../store/FocusOwnerStore.js'

export interface UsePopupMenuKeyboardParams {
  /** The Listbox store instance */
  store: ListboxStore
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

export interface UsePopupMenuKeyboardReturn {
  /** Keyboard event handler to attach to the element */
  handleKeyDown: React.KeyboardEventHandler
}

/**
 * Centralized keyboard navigation hook for popup menus.
 * Handles arrow navigation, vim bindings, submenu open/close, and selection.
 */
export function usePopupMenuKeyboard(
  params: UsePopupMenuKeyboardParams,
): UsePopupMenuKeyboardReturn {
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

  // Convert submenu context to the interface expected by the listbox hook
  const submenuInterface = React.useMemo(() => {
    if (!submenuContext) return null
    return {
      setOpen: submenuContext.setOpen,
      parentSurfaceId: submenuContext.parentSurfaceId,
      closeRootOnEsc: submenuContext.closeRootOnEsc,
    }
  }, [submenuContext])

  // Handle selection via keyboard (Enter or shortcut) - close the menu
  const handleSelect = React.useCallback(
    (itemId: string | null) => {
      if (itemId) {
        closeAll()
      }
    },
    [closeAll],
  )

  return useListboxKeyboard({
    store,
    surfaceId,
    enabled,
    onKeyDown,
    onSelect: handleSelect,
    closeAll,
    focusOwner: focusOwnerStore,
    depth,
    submenuContext: submenuInterface,
    enableTypeToSearch,
  })
}
