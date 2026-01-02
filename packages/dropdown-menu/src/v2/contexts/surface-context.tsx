import * as React from 'react'
import type { ActivationCause, SearchResult } from '../types.js'

// ============================================================================
// Surface Search State
// ============================================================================

/**
 * Search state local to a single Menu.Surface.
 * Each surface (root menu or submenu) has its own independent search state.
 */
export interface SurfaceSearchState {
  /** Current search query */
  searchQuery: string
  /** Whether search is active (keyboard input started) */
  searchActive: boolean
  /** Current search results (for deep search) */
  searchResults: SearchResult[]
  /** Whether we're in search mode (showing flat results) */
  searchMode: boolean
}

/**
 * Actions to update the surface search state.
 */
export interface SurfaceSearchActions {
  /** Set search query */
  setSearchQuery: (query: string) => void
  /** Clear search and exit search mode */
  clearSearch: () => void
  /** Set search results */
  setSearchResults: (results: SearchResult[]) => void
}

// ============================================================================
// Surface Highlight State
// ============================================================================

/**
 * Highlight state local to a single Menu.Surface.
 * Each surface has its own independent highlighted item.
 */
export interface SurfaceHighlightState {
  /** Currently highlighted item ID */
  highlightedId: string | null
  /** What caused the current highlight */
  activationCause: ActivationCause | null
}

/**
 * Actions to update the surface highlight state.
 */
export interface SurfaceHighlightActions {
  /** Set the highlighted item */
  setHighlightedId: (id: string | null, cause?: ActivationCause) => void
  /** Clear the highlight */
  clearHighlight: () => void
}

// ============================================================================
// Surface Focus State
// ============================================================================

/**
 * Focus-related refs and state for a surface.
 */
export interface SurfaceFocusRefs {
  /** Ref to the input element (if present) */
  inputRef: React.RefObject<HTMLInputElement | null>
  /** Ref to the list element */
  listRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Actions to manage surface focus.
 */
export interface SurfaceFocusActions {
  /** Register the input ref */
  registerInput: (ref: React.RefObject<HTMLInputElement | null>) => void
  /** Register the list ref */
  registerList: (ref: React.RefObject<HTMLDivElement | null>) => void
  /** Focus the appropriate element (input if present, otherwise list) */
  focusSurface: () => void
}

// ============================================================================
// Combined Surface Context
// ============================================================================

/**
 * Combined surface context value.
 */
export interface SurfaceContextValue {
  searchState: SurfaceSearchState
  searchActions: SurfaceSearchActions
  highlightState: SurfaceHighlightState
  highlightActions: SurfaceHighlightActions
  focusRefs: SurfaceFocusRefs
  focusActions: SurfaceFocusActions
  /** Unique ID for this surface */
  surfaceId: string
}

// ============================================================================
// Context
// ============================================================================

const SurfaceContext = React.createContext<SurfaceContextValue | null>(null)

SurfaceContext.displayName = 'SurfaceContext'

// ============================================================================
// Provider
// ============================================================================

export interface SurfaceProviderProps {
  /** Unique ID for this surface */
  surfaceId: string
  /** Whether the surface is open (to reset state on close) */
  open: boolean
  /** Children */
  children: React.ReactNode
}

/**
 * Creates initial surface search state.
 */
function createInitialSearchState(): SurfaceSearchState {
  return {
    searchQuery: '',
    searchActive: false,
    searchResults: [],
    searchMode: false,
  }
}

/**
 * Creates initial surface highlight state.
 */
function createInitialHighlightState(): SurfaceHighlightState {
  return {
    highlightedId: null,
    activationCause: null,
  }
}

/**
 * Provider component for surface-local state.
 * Each Menu.Surface should wrap its content with this provider.
 */
export function SurfaceProvider({
  surfaceId,
  open,
  children,
}: SurfaceProviderProps) {
  const [searchState, setSearchState] = React.useState<SurfaceSearchState>(
    createInitialSearchState,
  )
  const [highlightState, setHighlightState] =
    React.useState<SurfaceHighlightState>(createInitialHighlightState)

  // Focus refs - stored in refs so they can be registered by child components
  const inputRefHolder =
    React.useRef<React.RefObject<HTMLInputElement | null> | null>(null)
  const listRefHolder =
    React.useRef<React.RefObject<HTMLDivElement | null> | null>(null)

  // Create stable refs for the focusRefs object
  const inputRef = React.useMemo(
    () => ({
      get current() {
        return inputRefHolder.current?.current ?? null
      },
    }),
    [],
  ) as React.RefObject<HTMLInputElement | null>

  const listRef = React.useMemo(
    () => ({
      get current() {
        return listRefHolder.current?.current ?? null
      },
    }),
    [],
  ) as React.RefObject<HTMLDivElement | null>

  // Reset state when surface closes
  React.useEffect(() => {
    if (!open) {
      setSearchState(createInitialSearchState())
      setHighlightState(createInitialHighlightState())
    }
  }, [open])

  // Search actions
  const searchActions = React.useMemo<SurfaceSearchActions>(
    () => ({
      setSearchQuery: (query: string) => {
        setSearchState((prev) => ({
          ...prev,
          searchQuery: query,
          searchActive: query.length > 0,
          searchMode: query.length > 0,
        }))
      },

      clearSearch: () => {
        setSearchState((prev) => ({
          ...prev,
          searchQuery: '',
          searchActive: false,
          searchResults: [],
          searchMode: false,
        }))
      },

      setSearchResults: (results: SearchResult[]) => {
        setSearchState((prev) => ({
          ...prev,
          searchResults: results,
        }))
      },
    }),
    [],
  )

  // Highlight actions
  const highlightActions = React.useMemo<SurfaceHighlightActions>(
    () => ({
      setHighlightedId: (
        id: string | null,
        cause: ActivationCause = 'keyboard',
      ) => {
        setHighlightState({
          highlightedId: id,
          activationCause: id !== null ? cause : null,
        })
      },

      clearHighlight: () => {
        setHighlightState(createInitialHighlightState())
      },
    }),
    [],
  )

  // Focus refs object
  const focusRefs = React.useMemo<SurfaceFocusRefs>(
    () => ({
      inputRef,
      listRef,
    }),
    [inputRef, listRef],
  )

  // Focus actions
  const focusActions = React.useMemo<SurfaceFocusActions>(
    () => ({
      registerInput: (ref: React.RefObject<HTMLInputElement | null>) => {
        inputRefHolder.current = ref
      },

      registerList: (ref: React.RefObject<HTMLDivElement | null>) => {
        listRefHolder.current = ref
      },

      focusSurface: () => {
        // Focus input if present, otherwise focus list
        const input = inputRefHolder.current?.current
        const list = listRefHolder.current?.current

        if (input) {
          input.focus()
        } else if (list) {
          list.focus()
        }
      },
    }),
    [],
  )

  // Context value
  const value = React.useMemo<SurfaceContextValue>(
    () => ({
      searchState,
      searchActions,
      highlightState,
      highlightActions,
      focusRefs,
      focusActions,
      surfaceId,
    }),
    [
      searchState,
      searchActions,
      highlightState,
      highlightActions,
      focusRefs,
      focusActions,
      surfaceId,
    ],
  )

  return (
    <SurfaceContext.Provider value={value}>{children}</SurfaceContext.Provider>
  )
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the surface context.
 * Throws if used outside of SurfaceProvider.
 */
export function useSurface(): SurfaceContextValue {
  const context = React.useContext(SurfaceContext)
  if (!context) {
    throw new Error(
      'useSurface must be used within a SurfaceProvider (Menu.Surface)',
    )
  }
  return context
}

/**
 * Hook to access the surface context, or null if not in a provider.
 */
export function useSurfaceOptional(): SurfaceContextValue | null {
  return React.useContext(SurfaceContext)
}
