import * as React from 'react'
import { useMenu } from '../contexts/menu-context.js'
import { useSurfaceOptional } from '../contexts/surface-context.js'
import { useCollection } from '../contexts/collection-context.js'
import { searchNodes } from '../utils/scoring.js'
import type { SearchResult } from '../types.js'

// ============================================================================
// Types
// ============================================================================

export interface UseDeepSearchOptions {
  /** Debounce delay in milliseconds (default: 150) */
  debounceMs?: number
  /** Minimum query length to trigger search (default: 1) */
  minQueryLength?: number
  /** Maximum results to return (default: 50) */
  maxResults?: number
  /** Callback when search results change */
  onResultsChange?: (results: SearchResult[]) => void
}

export interface UseDeepSearchReturn {
  /** Current search query */
  query: string
  /** Set the search query */
  setQuery: (query: string) => void
  /** Clear the search */
  clear: () => void
  /** Current search results */
  results: SearchResult[]
  /** Whether a search is in progress */
  isSearching: boolean
  /** Whether there are any results */
  hasResults: boolean
  /** Whether we're in search mode (query is not empty) */
  isSearchMode: boolean
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for deep search across all menu items including submenus.
 * Automatically syncs with the menu context's search state.
 *
 * @example
 * ```tsx
 * function SearchableMenu() {
 *   const { query, setQuery, results, isSearchMode } = useDeepSearch()
 *
 *   return (
 *     <Menu.Root>
 *       <Menu.Trigger>Open</Menu.Trigger>
 *       <Menu.Portal>
 *         <Menu.Positioner>
 *           <Menu.Surface>
 *             <input
 *               value={query}
 *               onChange={(e) => setQuery(e.target.value)}
 *               placeholder="Search..."
 *             />
 *             {isSearchMode ? (
 *               // Show flat search results
 *               results.map((result) => (
 *                 <Menu.Item key={result.node.id}>
 *                   {result.breadcrumbs.join(' > ')} > {result.node.textValue}
 *                 </Menu.Item>
 *               ))
 *             ) : (
 *               // Show normal menu structure
 *               <>
 *                 <Menu.Item>Item 1</Menu.Item>
 *                 <Menu.Item>Item 2</Menu.Item>
 *               </>
 *             )}
 *           </Menu.Surface>
 *         </Menu.Positioner>
 *       </Menu.Portal>
 *     </Menu.Root>
 *   )
 * }
 * ```
 */
export function useDeepSearch(
  options: UseDeepSearchOptions = {},
): UseDeepSearchReturn {
  const {
    debounceMs = 150,
    minQueryLength = 1,
    maxResults = 50,
    onResultsChange,
  } = options

  const { state } = useMenu()
  const surface = useSurfaceOptional()
  const { actions: collectionActions } = useCollection()

  // Use surface-local state if available, otherwise fall back to menu state (legacy)
  const searchState = surface?.searchState ?? state
  const searchActions = surface?.searchActions

  const [isSearching, setIsSearching] = React.useState(false)
  const debounceTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  // Perform search with debounce
  const performSearch = React.useCallback(
    (query: string) => {
      // Clear any existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      // If query is too short, clear results
      if (query.length < minQueryLength) {
        searchActions?.setSearchResults([])
        setIsSearching(false)
        onResultsChange?.([])
        return
      }

      setIsSearching(true)

      // Debounce the actual search
      debounceTimeoutRef.current = setTimeout(() => {
        const searchableNodes = collectionActions.getSearchableNodes()
        let results = searchNodes(
          searchableNodes,
          query,
          collectionActions.getSubmenuLabel,
        )

        // Limit results
        if (results.length > maxResults) {
          results = results.slice(0, maxResults)
        }

        searchActions?.setSearchResults(results)
        setIsSearching(false)
        onResultsChange?.(results)

        // Highlight first result (using menu actions since highlighting is menu-level)
        // Note: This may need adjustment if highlighting should also be surface-local
      }, debounceMs)
    },
    [
      minQueryLength,
      debounceMs,
      maxResults,
      searchActions,
      collectionActions,
      onResultsChange,
    ],
  )

  // Set query and trigger search
  const setQuery = React.useCallback(
    (query: string) => {
      searchActions?.setSearchQuery(query)
      performSearch(query)
    },
    [searchActions, performSearch],
  )

  // Clear search
  const clear = React.useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    searchActions?.clearSearch()
    setIsSearching(false)
  }, [searchActions])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return {
    query: searchState.searchQuery,
    setQuery,
    clear,
    results: searchState.searchResults,
    isSearching,
    hasResults: searchState.searchResults.length > 0,
    isSearchMode: searchState.searchMode,
  }
}
