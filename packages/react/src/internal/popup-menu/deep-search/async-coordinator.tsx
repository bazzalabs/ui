'use client'

import * as React from 'react'
import type {
  AsyncLoaderConfig,
  AsyncLoaderResult,
  AsyncState,
  NodeDef,
} from './types.js'

// ============================================================================
// Types
// ============================================================================

/**
 * State for a registered async loader.
 */
export interface AsyncMenuState {
  /** Unique identifier for this async menu */
  id: string
  /** Breadcrumbs path to this menu (for merging into tree) */
  breadcrumbs: string[]
  /** The loader configuration */
  config: AsyncLoaderConfig
  /** Current loader result */
  result: AsyncLoaderResult<NodeDef[]>
}

/**
 * Context value for the async menu coordinator.
 */
export interface AsyncMenuCoordinatorValue {
  // ---- Registration ----
  /** Register a new async loader */
  registerLoader: (state: AsyncMenuState) => void
  /** Unregister an async loader */
  unregisterLoader: (id: string) => void
  /** Update loader result */
  updateLoaderResult: (id: string, result: AsyncLoaderResult<NodeDef[]>) => void

  // ---- Search Query ----
  /** Current search query from the store */
  searchQuery: string

  // ---- Loader State ----
  /** All registered loaders */
  loaders: Map<string, AsyncMenuState>

  // ---- Computed State ----
  /** Any loader is currently loading */
  isAnyLoading: boolean
  /** Static loaders are loading */
  isStaticLoading: boolean
  /** Query loaders are loading */
  isQueryLoading: boolean
  /** All loaders have resolved (not loading, no pending) */
  allResolved: boolean

  // ---- Async Nodes ----
  /** Get all resolved async nodes with their breadcrumbs */
  getAsyncNodes: () => Array<{
    id: string
    breadcrumbs: string[]
    nodes: NodeDef[]
  }>

  // ---- Error Tracking ----
  /** Loaders that errored */
  erroredLoaders: Map<string, Error>

  // ---- Aggregated State ----
  /** Get the aggregate async state for DataList */
  getAsyncState: () => AsyncState
}

// ============================================================================
// Context
// ============================================================================

export const AsyncMenuCoordinatorContext =
  React.createContext<AsyncMenuCoordinatorValue | null>(null)

export function useAsyncMenuCoordinator(): AsyncMenuCoordinatorValue | null {
  return React.useContext(AsyncMenuCoordinatorContext)
}

export function useMaybeAsyncMenuCoordinator(): AsyncMenuCoordinatorValue | null {
  return React.useContext(AsyncMenuCoordinatorContext)
}

// ============================================================================
// Provider Props
// ============================================================================

export interface AsyncMenuCoordinatorProviderProps {
  /** Children to render */
  children: React.ReactNode
  /** Current search query from the store */
  searchQuery: string
}

// ============================================================================
// Provider Component
// ============================================================================

export function AsyncMenuCoordinatorProvider(
  props: AsyncMenuCoordinatorProviderProps,
) {
  const { children, searchQuery } = props

  // Registered loaders
  const [loaders, setLoaders] = React.useState<Map<string, AsyncMenuState>>(
    () => new Map(),
  )

  // Track errored loaders
  const [erroredLoaders, setErroredLoaders] = React.useState<
    Map<string, Error>
  >(() => new Map())

  // Register a loader
  const registerLoader = React.useCallback((state: AsyncMenuState) => {
    setLoaders((prev) => {
      const next = new Map(prev)
      next.set(state.id, state)
      return next
    })
  }, [])

  // Unregister a loader
  const unregisterLoader = React.useCallback((id: string) => {
    setLoaders((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })

    // Clear error state
    setErroredLoaders((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  // Update loader result
  const updateLoaderResult = React.useCallback(
    (id: string, result: AsyncLoaderResult<NodeDef[]>) => {
      setLoaders((prev) => {
        const existing = prev.get(id)
        if (!existing) return prev

        const next = new Map(prev)
        next.set(id, { ...existing, result })
        return next
      })

      // Track errors
      if (result.isError && result.error) {
        setErroredLoaders((prev) => {
          const next = new Map(prev)
          next.set(id, result.error!)
          return next
        })
      } else if (!result.isError) {
        setErroredLoaders((prev) => {
          if (!prev.has(id)) return prev
          const next = new Map(prev)
          next.delete(id)
          return next
        })
      }
    },
    [],
  )

  // Computed loading states
  const isStaticLoading = React.useMemo(() => {
    for (const [, state] of loaders) {
      if (state.config.type === 'static' && state.result.isLoading) {
        return true
      }
    }
    return false
  }, [loaders])

  const isQueryLoading = React.useMemo(() => {
    for (const [, state] of loaders) {
      if (state.config.type === 'query' && state.result.isLoading) {
        return true
      }
    }
    return false
  }, [loaders])

  const isAnyLoading = isStaticLoading || isQueryLoading

  const allResolved = React.useMemo(() => {
    for (const [, state] of loaders) {
      if (state.result.isLoading) {
        return false
      }
    }
    return true
  }, [loaders])

  // Get all resolved async nodes
  const getAsyncNodes = React.useCallback(() => {
    const result: Array<{
      id: string
      breadcrumbs: string[]
      nodes: NodeDef[]
    }> = []

    for (const [id, state] of loaders) {
      // Skip errored loaders
      if (erroredLoaders.has(id)) {
        continue
      }

      // Add resolved data
      if (state.result.data) {
        result.push({
          id,
          breadcrumbs: state.breadcrumbs,
          nodes: state.result.data,
        })
      }
    }

    return result
  }, [loaders, erroredLoaders])

  // Get aggregate async state
  const getAsyncState = React.useCallback((): AsyncState => {
    const skippedMenus: Array<{ id: string; reason: 'error' }> = []

    for (const [id] of erroredLoaders) {
      skippedMenus.push({ id, reason: 'error' })
    }

    return {
      isLoading: isAnyLoading,
      isStaticLoading,
      isQueryLoading,
      skippedMenus,
    }
  }, [isAnyLoading, isStaticLoading, isQueryLoading, erroredLoaders])

  // Context value
  const contextValue: AsyncMenuCoordinatorValue = React.useMemo(
    () => ({
      registerLoader,
      unregisterLoader,
      updateLoaderResult,
      searchQuery,
      loaders,
      isAnyLoading,
      isStaticLoading,
      isQueryLoading,
      allResolved,
      getAsyncNodes,
      erroredLoaders,
      getAsyncState,
    }),
    [
      registerLoader,
      unregisterLoader,
      updateLoaderResult,
      searchQuery,
      loaders,
      isAnyLoading,
      isStaticLoading,
      isQueryLoading,
      allResolved,
      getAsyncNodes,
      erroredLoaders,
      getAsyncState,
    ],
  )

  return (
    <AsyncMenuCoordinatorContext.Provider value={contextValue}>
      {children}
    </AsyncMenuCoordinatorContext.Provider>
  )
}
