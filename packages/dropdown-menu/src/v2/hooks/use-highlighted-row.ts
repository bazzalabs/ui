import * as React from 'react'
import { useMenu } from '../contexts/menu-context.js'
import { useCollection } from '../contexts/collection-context.js'
import type {
  SurfaceSearchState,
  SurfaceHighlightState,
  SurfaceHighlightActions,
} from '../contexts/surface-context.js'
import type { ActivationCause } from '../types.js'

// ============================================================================
// Types
// ============================================================================

export interface UseHighlightedRowOptions {
  /** Whether to loop navigation at ends (default: true) */
  loop?: boolean
  /** Whether to auto-highlight first item when menu opens (default: true) */
  autoHighlightFirst?: boolean
  /** Whether to reset highlight to first item when search changes (default: true) */
  resetOnSearchChange?: boolean
  /** Surface-local search state (required for proper search filtering per surface) */
  searchState?: SurfaceSearchState
  /** Surface-local highlight state (required for independent highlighting per surface) */
  highlightState?: SurfaceHighlightState
  /** Surface-local highlight actions */
  highlightActions?: SurfaceHighlightActions
  /** Whether this surface is open (for submenus, this is the submenu's open state) */
  isOpen?: boolean
  /** Surface ID for filtering navigable items to this surface only */
  surfaceId?: string
}

export interface UseHighlightedRowReturn {
  /** Currently highlighted item ID */
  highlightedId: string | null
  /** What caused the current highlight */
  activationCause: ActivationCause | null
  /** Set the highlighted item */
  setHighlightedId: (id: string | null, cause?: ActivationCause) => void
  /** Move highlight in a direction */
  moveHighlight: (direction: 'next' | 'prev' | 'first' | 'last') => void
  /** Highlight the first navigable item */
  highlightFirst: () => void
  /** Highlight the last navigable item */
  highlightLast: () => void
  /** Clear the highlight */
  clearHighlight: () => void
  /** Check if an item is highlighted */
  isHighlighted: (id: string) => boolean
  /** Get the list of navigable IDs */
  getNavigableIds: () => string[]
  /** Get IDs filtered by current search (if in search mode) */
  getVisibleNavigableIds: () => string[]
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Centralized hook for managing menu item highlighting.
 *
 * Features:
 * - Auto-highlights first item when menu opens
 * - Resets to first item when search query changes
 * - Provides navigation helpers (next/prev/first/last)
 * - Always ensures a valid item is highlighted (if possible)
 *
 * @example
 * ```tsx
 * function Surface({ children }) {
 *   const {
 *     highlightedId,
 *     moveHighlight,
 *     isHighlighted,
 *   } = useHighlightedRow()
 *
 *   const handleKeyDown = (e) => {
 *     if (e.key === 'ArrowDown') moveHighlight('next')
 *     if (e.key === 'ArrowUp') moveHighlight('prev')
 *   }
 *
 *   return <div onKeyDown={handleKeyDown}>{children}</div>
 * }
 * ```
 */
export function useHighlightedRow(
  options: UseHighlightedRowOptions = {},
): UseHighlightedRowReturn {
  const {
    loop = true,
    autoHighlightFirst = true,
    resetOnSearchChange = true,
    searchState,
    highlightState,
    highlightActions,
    isOpen: isOpenProp,
    surfaceId,
  } = options

  const { state } = useMenu()

  // Use provided isOpen prop if available, otherwise fall back to root menu state
  const isOpen = isOpenProp ?? state.open
  const { actions: collectionActions } = useCollection()

  // Use surface-local search state if provided, otherwise fall back to menu state
  // (for backward compatibility and cases where surface context isn't available)
  const effectiveSearchQuery = searchState?.searchQuery ?? state.searchQuery
  const effectiveSearchMode = searchState?.searchMode ?? state.searchMode
  const effectiveSearchResults =
    searchState?.searchResults ?? state.searchResults

  // Use surface-local highlight state if provided, otherwise fall back to menu state
  const effectiveHighlightedId =
    highlightState?.highlightedId ?? state.highlightedId
  const effectiveActivationCause =
    highlightState?.activationCause ?? state.activationCause

  // Effective setHighlightedId function (surface-local if available)
  const setHighlightedId = React.useCallback(
    (id: string | null, cause: ActivationCause = 'keyboard') => {
      if (highlightActions) {
        highlightActions.setHighlightedId(id, cause)
      }
      // Note: We don't fall back to menu actions anymore since
      // highlighting should be surface-local
    },
    [highlightActions],
  )

  // Track previous search query to detect changes
  const prevSearchQueryRef = React.useRef(effectiveSearchQuery)

  // Track if we've already highlighted the first item for this menu open
  const hasAutoHighlightedRef = React.useRef(false)

  // Reset the flag when surface closes
  React.useEffect(() => {
    if (!isOpen) {
      hasAutoHighlightedRef.current = false
    }
  }, [isOpen])

  /**
   * Get all navigable item IDs (respects disabled state)
   */
  const getNavigableIds = React.useCallback((): string[] => {
    return collectionActions.getNavigableIds()
  }, [collectionActions])

  /**
   * Get navigable IDs filtered to only items belonging to this surface.
   * Root menu items have parentPath = [], submenu items have parentPath ending with their submenuId.
   */
  const getSurfaceNavigableIds = React.useCallback((): string[] => {
    if (!surfaceId) {
      return getNavigableIds()
    }

    const allIds = getNavigableIds()
    return allIds.filter((id) => {
      const node = collectionActions.getNode(id)
      if (!node) return false

      const { parentPath } = node
      // Root menu: parentPath is empty, surfaceId starts with 'menu-'
      if (parentPath.length === 0) {
        return surfaceId.startsWith('menu-')
      }
      // Submenu: last element of parentPath should match surfaceId
      return parentPath[parentPath.length - 1] === surfaceId
    })
  }, [getNavigableIds, collectionActions, surfaceId])

  /**
   * Get navigable IDs that are currently visible (filtered by search and surface)
   */
  const getVisibleNavigableIds = React.useCallback((): string[] => {
    const surfaceIds = getSurfaceNavigableIds()

    if (!effectiveSearchMode) {
      return surfaceIds
    }

    // In search mode, only return IDs that are in the search results
    const searchResultIds = new Set(
      effectiveSearchResults.map((r) => r.node.id),
    )
    return surfaceIds.filter((id) => searchResultIds.has(id))
  }, [getSurfaceNavigableIds, effectiveSearchMode, effectiveSearchResults])

  /**
   * Highlight the first navigable item
   */
  const highlightFirst = React.useCallback(() => {
    const ids = getVisibleNavigableIds()
    if (ids.length > 0 && ids[0]) {
      setHighlightedId(ids[0], 'keyboard')
    }
  }, [getVisibleNavigableIds, setHighlightedId])

  /**
   * Highlight the last navigable item
   */
  const highlightLast = React.useCallback(() => {
    const ids = getVisibleNavigableIds()
    if (ids.length > 0) {
      setHighlightedId(ids[ids.length - 1] ?? null, 'keyboard')
    }
  }, [getVisibleNavigableIds, setHighlightedId])

  /**
   * Clear the highlight
   */
  const clearHighlight = React.useCallback(() => {
    setHighlightedId(null)
  }, [setHighlightedId])

  /**
   * Move highlight in a direction
   */
  const moveHighlight = React.useCallback(
    (direction: 'next' | 'prev' | 'first' | 'last') => {
      const ids = getVisibleNavigableIds()
      if (ids.length === 0) return

      const currentIndex = effectiveHighlightedId
        ? ids.indexOf(effectiveHighlightedId)
        : -1

      let newIndex: number

      switch (direction) {
        case 'first':
          newIndex = 0
          break
        case 'last':
          newIndex = ids.length - 1
          break
        case 'next':
          if (currentIndex === -1) {
            newIndex = 0
          } else if (currentIndex === ids.length - 1) {
            newIndex = loop ? 0 : currentIndex
          } else {
            newIndex = currentIndex + 1
          }
          break
        case 'prev':
          if (currentIndex === -1) {
            newIndex = ids.length - 1
          } else if (currentIndex === 0) {
            newIndex = loop ? ids.length - 1 : 0
          } else {
            newIndex = currentIndex - 1
          }
          break
      }

      setHighlightedId(ids[newIndex] ?? null, 'keyboard')
    },
    [getVisibleNavigableIds, effectiveHighlightedId, loop, setHighlightedId],
  )

  /**
   * Check if an item is highlighted
   */
  const isHighlighted = React.useCallback(
    (id: string): boolean => {
      return effectiveHighlightedId === id
    },
    [effectiveHighlightedId],
  )

  /**
   * Ensure highlight is valid (points to a visible item)
   */
  const ensureValidHighlight = React.useCallback(() => {
    const ids = getVisibleNavigableIds()

    // If no items, clear highlight
    if (ids.length === 0) {
      if (effectiveHighlightedId !== null) {
        setHighlightedId(null)
      }
      return
    }

    // If current highlight is valid, keep it
    if (effectiveHighlightedId && ids.includes(effectiveHighlightedId)) {
      return
    }

    // Otherwise, highlight the first item
    setHighlightedId(ids[0] ?? null, 'keyboard')
  }, [getVisibleNavigableIds, effectiveHighlightedId, setHighlightedId])

  // Auto-highlight first item when surface opens
  React.useEffect(() => {
    if (!autoHighlightFirst) return
    if (!isOpen) return
    if (hasAutoHighlightedRef.current) return

    const ids = getVisibleNavigableIds()
    if (ids.length > 0) {
      setHighlightedId(ids[0] ?? null, 'keyboard')
      hasAutoHighlightedRef.current = true
    }
  }, [
    autoHighlightFirst,
    isOpen,
    getVisibleNavigableIds,
    setHighlightedId,
    effectiveHighlightedId,
  ])

  // Reset highlight when search query changes
  React.useEffect(() => {
    const queryChanged = effectiveSearchQuery !== prevSearchQueryRef.current

    if (resetOnSearchChange && queryChanged) {
      prevSearchQueryRef.current = effectiveSearchQuery

      // When search changes, highlight first visible item (in DOM order)
      if (effectiveSearchMode && effectiveSearchResults.length > 0) {
        const visibleIds = getVisibleNavigableIds()
        const firstVisibleId = visibleIds[0]
        if (firstVisibleId) {
          setHighlightedId(firstVisibleId, 'keyboard')
        }
      } else if (!effectiveSearchQuery) {
        // Search cleared - highlight first item
        queueMicrotask(() => {
          const ids = getNavigableIds()
          if (ids.length > 0 && ids[0]) {
            setHighlightedId(ids[0], 'keyboard')
          }
        })
      }
    }
  }, [
    resetOnSearchChange,
    effectiveSearchQuery,
    effectiveSearchMode,
    effectiveSearchResults,
    getNavigableIds,
    getVisibleNavigableIds,
    setHighlightedId,
    effectiveHighlightedId,
  ])

  // Note: We intentionally do NOT run ensureValidHighlight on every collection change.
  // The collection is shared across all surfaces, so it changes when submenus open/close.
  // This would cause unwanted highlight changes in parent surfaces.
  // Instead, we only ensure valid highlight:
  // 1. When auto-highlighting first item on open (handled above)
  // 2. When search query changes (handled above)
  // The highlight can temporarily point to an invalid ID, but this is fine since
  // the item just won't render as highlighted.

  return {
    highlightedId: effectiveHighlightedId,
    activationCause: effectiveActivationCause,
    setHighlightedId,
    moveHighlight,
    highlightFirst,
    highlightLast,
    clearHighlight,
    isHighlighted,
    getNavigableIds,
    getVisibleNavigableIds,
  }
}
