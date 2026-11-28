'use client'

import { decideOpenChange } from '@bazza-ui/menu-core'
import * as React from 'react'
import { REASONS } from '../../../utils/events/index.js'
import { useComposedHandler } from '../../../utils/use-part.js'
import type { PopupMenuOpenChangeReason } from '../events.js'
import {
  getRegistration,
  getShortcutItemId,
  type ListboxStore,
} from '../store/ListboxStore.js'

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
  /**
   * Open or close this submenu, for `reason` (`'none'` when left out). Once
   * it closes, it hands focus back to `parentSurfaceId` itself.
   */
  setOpen: (
    open: boolean,
    reason?: PopupMenuOpenChangeReason,
    event?: Event,
  ) => void
  /** Parent surface ID for focus transfer */
  parentSurfaceId: string
  /** Whether Escape closes the root menu or just this submenu */
  closeRootOnEsc?: boolean
}

/**
 * Subpage context interface for keyboard handling.
 * Optional - only needed for popup menus with in-popup subpage navigation.
 */
export interface SubpageInterface {
  /** Pop one page from the current stack. */
  goBack: () => boolean
  /** Parent surface ID for focus transfer after back navigation. */
  parentSurfaceId: string | null
  /** Whether Escape closes the root menu instead of navigating back. */
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
   * Called with selection details. The consumer handles any
   * post-selection behavior like closing menus.
   */
  onSelect?: (details: { itemId: string | null; closeOnClick: boolean }) => void
  /**
   * Callback to close the entire menu tree from the root, for `reason`.
   * Used when Escape is pressed and closeRootOnEsc is true (default).
   */
  closeAll: (reason?: PopupMenuOpenChangeReason, event?: Event) => void

  // Optional popup-menu features

  /** The FocusOwner store for managing focus ownership (optional) */
  focusOwner?: FocusOwnerInterface
  /** Menu depth (0 for root, >0 for submenus) - defaults to 0 */
  depth?: number
  /** Submenu context for ArrowLeft navigation back to parent (optional) */
  submenuContext?: SubmenuInterface | null
  /** Subpage context for ArrowLeft/Ctrl+H navigation back (optional) */
  subpageContext?: SubpageInterface | null
  /**
   * Whether to enable type-to-search behavior.
   * When true, printable characters will activate the input and set pending search.
   * Used by List when hideUntilActive is enabled and input is not yet active.
   * @default false
   */
  enableTypeToSearch?: boolean
  /**
   * Whether to skip the focus owner check.
   * When true, keyboard handling will work based on `enabled` prop alone,
   * ignoring focus ownership. Useful for Combobox where the input is outside
   * the Surface but should still handle keyboard navigation.
   * @default false
   */
  skipFocusOwnerCheck?: boolean
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
    subpageContext,
    enableTypeToSearch = false,
    skipFocusOwnerCheck = false,
  } = params

  // Subscribe to focus ownership if available
  const focusOwnerIsOwner = focusOwner?.useState('isOwner', surfaceId) ?? true
  // Skip this check for Combobox where input is outside Surface
  const isOwner = skipFocusOwnerCheck ? true : focusOwnerIsOwner

  // The consumer's handler runs first (`useComposedHandler`, below); its
  // `preventDefault()` or `preventBaseUIHandler()` skips everything here.
  const handleOwnKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.defaultPrevented) return

      // Only handle keyboard if enabled and this surface owns focus
      if (!enabled) return
      if (!isOwner) return

      // Check for IME composition
      if (event.nativeEvent.isComposing || event.keyCode === 229) return

      // Type-to-search: detect printable characters when enabled
      // Note: Shortcuts take priority over type-to-search, so we check for shortcuts first
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
            // Check if this key is a registered shortcut first
            const shortcutItemId = getShortcutItemId(store, event.key)
            if (shortcutItemId && store.selectByShortcut(event.key)) {
              event.preventDefault()
              const item = getRegistration(store, shortcutItemId)
              onSelect?.({
                itemId: shortcutItemId,
                closeOnClick: item?.closeOnClick ?? true,
              })
              return
            }

            // No shortcut match, trigger type-to-search
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
          // Back one subpage when in subpage navigation context.
          if (subpageContext?.goBack()) {
            event.preventDefault()
            if (focusOwner && subpageContext.parentSurfaceId) {
              focusOwner.setOwnerId(subpageContext.parentSurfaceId)
            }
            break
          }

          // Close submenu and return to parent (only if in a submenu)
          if (depth > 0 && submenuContext) {
            event.preventDefault()
            // Focus goes back to the parent surface once the submenu closes
            // (its consumer may cancel it, or apply it later)
            submenuContext.setOpen(
              false,
              REASONS.listNavigation,
              event.nativeEvent,
            )
          }
          break
        }
        case 'h': {
          // Ctrl+H - back one subpage (vim binding)
          if (event.ctrlKey && subpageContext?.goBack()) {
            event.preventDefault()
            if (focusOwner && subpageContext.parentSurfaceId) {
              focusOwner.setOwnerId(subpageContext.parentSurfaceId)
            }
            break
          }

          // Ctrl+H - close submenu (vim binding fallback)
          if (event.ctrlKey && depth > 0 && submenuContext) {
            event.preventDefault()
            // Focus goes back to the parent surface once the submenu closes
            // (its consumer may cancel it, or apply it later)
            submenuContext.setOpen(
              false,
              REASONS.listNavigation,
              event.nativeEvent,
            )
          }
          break
        }
        case 'Enter': {
          event.preventDefault()
          const selectedId = store.state.highlightedId
          const item = store.getHighlightedItem()
          if (item?.activatable === false) break

          store.selectHighlighted()
          onSelect?.({
            itemId: selectedId,
            closeOnClick: item?.closeOnClick ?? true,
          })
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
          // The close policy decides: the root closes through Base UI; a
          // submenu closes the whole tree, or only itself; a subpage goes
          // back a page, or closes the whole tree.
          const level = subpageContext
            ? 'subpage'
            : depth > 0
              ? 'submenu'
              : 'root'
          if (level === 'root') break
          const decision = decideOpenChange({
            open: false,
            reason: REASONS.escapeKey,
            event: event.nativeEvent,
            level,
            closeRootOnEsc: (subpageContext ?? submenuContext)?.closeRootOnEsc,
          })

          // Stop the parent's handling (its focus restoration, or closing)
          event.preventDefault()
          event.stopPropagation()

          if (decision.type === 'redirect') {
            closeAll(decision.reason, decision.event)
            break
          }
          if (
            decision.type === 'back' &&
            subpageContext?.goBack() &&
            focusOwner &&
            subpageContext.parentSurfaceId
          ) {
            focusOwner.setOwnerId(subpageContext.parentSurfaceId)
            break
          }
          // Only this submenu closes (or a subpage with no page to go back
          // to closes its submenu)
          if (depth > 0 && submenuContext) {
            // Focus goes back to the parent surface once it closes
            submenuContext.setOpen(false, REASONS.escapeKey, event.nativeEvent)
          }
          break
        }
        default: {
          // Handle single-character shortcuts (only when not typing in search input)
          // Shortcuts are disabled when there's an active search to avoid conflicts
          const hasActiveSearch = store.state.normalizedSearch.length > 0
          const isPrintable =
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey

          if (isPrintable && !hasActiveSearch) {
            const itemId = getShortcutItemId(store, event.key)
            if (itemId && store.selectByShortcut(event.key)) {
              event.preventDefault()
              const item = getRegistration(store, itemId)
              onSelect?.({
                itemId,
                closeOnClick: item?.closeOnClick ?? true,
              })
            }
          }
          break
        }
      }
    },
    [
      enabled,
      isOwner,
      enableTypeToSearch,
      store,
      depth,
      submenuContext,
      subpageContext,
      focusOwner,
      onSelect,
      closeAll,
    ],
  )

  const handleKeyDown = useComposedHandler(onKeyDown, handleOwnKeyDown)
  return { handleKeyDown }
}
