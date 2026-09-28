'use client'

// ============================================================================
// usePopupMenuKeyboard Hook - Wrapper around internal/listbox useListboxKeyboard
// ============================================================================
// This wrapper integrates the focus owner and submenu contexts from popup-menu

import * as React from 'react'
import { REASONS } from '../../../utils/events/index.js'
import { type ListboxStore, useListboxKeyboard } from '../../listbox/index.js'
import { useMaybeCheckboxSelection } from '../contexts/checkbox-selection-context.js'
import { usePopupMenuContext } from '../contexts/popup-menu-context.js'
import type { SubmenuContextValue } from '../contexts/submenu-context.js'
import type { SubpageContextValue } from '../contexts/subpage-context.js'
import type { FocusOwnerStore } from '../store/FocusOwnerStore.js'

const SPAN_NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End'])

/** Whether a Shift+Arrow would wrap around the list end (blocked while a span is active). */
function wouldWrap(store: ListboxStore, key: string): boolean {
  const ids = store.getVisibleItemIds()
  const index = store.state.highlightedId
    ? ids.indexOf(store.state.highlightedId)
    : -1
  if (index === -1) return false
  if (key === 'ArrowDown') return index === ids.length - 1
  if (key === 'ArrowUp') return index === 0
  return false
}

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
  const selection = useMaybeCheckboxSelection()
  const { rangeSelection } = usePopupMenuContext()
  const focusOwnerIsOwner = focusOwnerStore.useState('isOwner', surfaceId)
  const isOwner = skipFocusOwnerCheck ? true : focusOwnerIsOwner
  // `selection` is either always null or always a store for a hook instance.
  const gestureKind = selection
    ? selection.useState('gesture')?.kind
    : undefined
  const spanActiveAtRender = gestureKind === 'keyboard'

  // While a keyboard span is active, listen at the document so releasing
  // Shift (or pressing Escape) after DOM focus moved elsewhere, e.g. into a
  // focus zone, still commits (or cancels) instead of reaching the menu's
  // own dismiss handling.
  React.useEffect(() => {
    if (!selection || !spanActiveAtRender) return
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        selection.commitGesture(REASONS.dragSelection, event)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (selection.state.gesture?.kind !== 'keyboard') return
      event.preventDefault()
      event.stopPropagation()
      selection.cancelGesture()
    }
    const cancel = () => selection.cancelGesture()
    document.addEventListener('keyup', onKeyUp)
    document.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('blur', cancel)
    return () => {
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('blur', cancel)
    }
  }, [selection, spanActiveAtRender])

  // Convert submenu context to the interface expected by the listbox hook
  const submenuInterface = React.useMemo(() => {
    if (!submenuContext) return null
    return {
      setOpen: (open: boolean) => {
        if (!open) {
          // Explicit keyboard close (ArrowLeft/Ctrl+H/Escape): suppress
          // auto-reopen while the trigger stays highlighted.
          submenuContext.suppressAutoOpenRef.current = true
        }
        submenuContext.setOpen(open)
      },
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

  const { handleKeyDown: handleListboxKeyDown } = useListboxKeyboard({
    store,
    surfaceId,
    enabled: enabled && !disabled,
    onKeyDown: undefined,
    onSelect: handleSelect,
    closeAll,
    focusOwner: focusOwnerStore,
    depth,
    submenuContext: submenuInterface,
    subpageContext: subpageInterface,
    enableTypeToSearch,
    skipFocusOwnerCheck,
  })

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      // Consumer handler first; it may prevent everything below.
      onKeyDown?.(event)
      if (event.defaultPrevented) return
      const isComposing = event.nativeEvent.isComposing || event.keyCode === 229
      const activeGesture = selection?.state.gesture
      const keyboardSpanActive = activeGesture?.kind === 'keyboard'
      if (
        !isComposing &&
        rangeSelection &&
        selection &&
        isOwner &&
        enabled &&
        !disabled
      ) {
        if (event.shiftKey && SPAN_NAVIGATION_KEYS.has(event.key)) {
          if (!activeGesture) {
            const startId = store.state.highlightedId
            if (startId && selection.isSelectableRow(startId)) {
              selection.beginGesture('keyboard', startId, 'rubber-band')
            }
          }
          if (
            selection.state.gesture?.kind === 'keyboard' &&
            wouldWrap(store, event.key)
          ) {
            event.preventDefault()
            return
          }
          handleListboxKeyDown(event)
          if (selection.state.gesture?.kind === 'keyboard') {
            const currentId = store.state.highlightedId
            if (currentId) selection.extendGesture(currentId)
          }
          return
        }
        if (keyboardSpanActive && event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          selection.cancelGesture()
          return
        }
        if (keyboardSpanActive && event.key === 'Enter') {
          event.preventDefault()
          selection.commitGesture(REASONS.dragSelection, event.nativeEvent)
          return
        }
      }
      if (
        !isComposing &&
        rangeSelection &&
        selection &&
        event.key === 'Enter' &&
        event.shiftKey &&
        isOwner &&
        enabled &&
        !disabled
      ) {
        const targetId = store.state.highlightedId
        const anchor = selection.getUsableAnchor()
        if (
          targetId &&
          anchor !== null &&
          selection.isSelectableRow(targetId)
        ) {
          event.preventDefault()
          selection.applyRange(
            anchor,
            targetId,
            REASONS.rangeSelection,
            event.nativeEvent,
          )
          return
        }
      }
      handleListboxKeyDown(event)
    },
    [
      onKeyDown,
      rangeSelection,
      selection,
      isOwner,
      enabled,
      disabled,
      store,
      handleListboxKeyDown,
    ],
  )

  return React.useMemo(() => ({ handleKeyDown }), [handleKeyDown])
}
