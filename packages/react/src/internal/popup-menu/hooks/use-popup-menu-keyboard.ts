'use client'

// ============================================================================
// usePopupMenuKeyboard Hook - Wrapper around internal/listbox useListboxKeyboard
// ============================================================================
// This wrapper integrates the focus owner and submenu contexts from popup-menu

import * as React from 'react'
import { type ListboxStore, useListboxKeyboard } from '../../listbox/index.js'
import type { SubmenuContextValue } from '../contexts/submenu-context.js'
import type { SubpageContextValue } from '../contexts/subpage-context.js'
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
  /** Subpage context for back-stack navigation */
  subpageContext?: SubpageContextValue | null
  /** Whether keyboard handling is enabled */
  enabled: boolean
  /** Whether the menu currently ignores user interaction. */
  disabled?: boolean
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
  /**
   * Whether to skip the focus owner check.
   * When true, keyboard handling will work based on `enabled` prop alone,
   * ignoring focus ownership. Useful for Combobox where the input is outside
   * the Surface but should still handle keyboard navigation.
   * @default false
   */
  skipFocusOwnerCheck?: boolean
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
    subpageContext = null,
    enabled,
    disabled = false,
    enableTypeToSearch = false,
    onKeyDown,
    closeAll,
    skipFocusOwnerCheck = false,
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

  const subpageInterface = React.useMemo(() => {
    if (!subpageContext) return null
    return {
      goBack: subpageContext.goBack,
      parentSurfaceId: subpageContext.parentSurfaceId,
      closeRootOnEsc: subpageContext.closeRootOnEsc,
    }
  }, [subpageContext])

  // Handle selection via keyboard (Enter or shortcut)
  const handleSelect = React.useCallback(
    (details: { itemId: string | null; closeOnClick: boolean }) => {
      if (details.itemId && details.closeOnClick) {
        closeAll()
      }
    },
    [closeAll],
  )

  return useListboxKeyboard({
    store,
    surfaceId,
    enabled: enabled && !disabled,
    onKeyDown,
    onSelect: handleSelect,
    closeAll,
    focusOwner: focusOwnerStore,
    depth,
    submenuContext: submenuInterface,
    subpageContext: subpageInterface,
    enableTypeToSearch,
    skipFocusOwnerCheck,
  })
}
