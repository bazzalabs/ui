'use client'

import * as React from 'react'
import type {
  AsyncLoaderConfig,
  DataListChildrenState,
  DeepSearchConfig,
  DisplayNode,
  IncludeInDeepSearch,
  NodeDef,
  ResolvedMenuNode,
} from './types.js'

// ============================================================================
// Data Surface Context
// ============================================================================

export interface DataSurfaceContextValue {
  /** The original node definitions */
  content: NodeDef[]

  /** Async content configuration for root-level async loading */
  asyncContent?: AsyncLoaderConfig

  /** Deep search configuration */
  deepSearchConfig: DeepSearchConfig

  /** Default submenu inclusion mode for deep search */
  includeInDeepSearch: IncludeInDeepSearch

  /** List element ID for aria-activedescendant */
  listId: string
}

export const DataSurfaceContext =
  React.createContext<DataSurfaceContextValue | null>(null)

// ============================================================================
// Popup-level Data Context (shared across sibling DataSurface/DataSubpages)
// ============================================================================

export interface DataPopupContextValue {
  /** Latest DataSurface context registered within this popup. */
  dataSurfaceContext: DataSurfaceContextValue | null
  /** Registers/clears DataSurface context for sibling consumers. */
  setDataSurfaceContext: React.Dispatch<
    React.SetStateAction<DataSurfaceContextValue | null>
  >
  /** The latest callback-time snapshot of the local surface's resolver-owned roots. */
  resolvedNodes: readonly ResolvedMenuNode[] | null
  publishResolvedNodes: (
    sourceId: string,
    nodes: readonly ResolvedMenuNode[],
  ) => () => void
  invalidateResolvedNodes: () => void
}

export const DataPopupContext =
  React.createContext<DataPopupContextValue | null>(null)

export function useDataSurfaceContext(): DataSurfaceContextValue {
  const context = React.useContext(DataSurfaceContext)
  if (!context) {
    throw new Error(
      'useDataSurfaceContext must be used within a DataSurface component',
    )
  }
  return context
}

export function useMaybeDataSurfaceContext(): DataSurfaceContextValue | null {
  return React.useContext(DataSurfaceContext)
}

export function useDataPopupContext(): DataPopupContextValue {
  const context = React.useContext(DataPopupContext)
  if (!context) {
    throw new Error('Data components must be used within PopupMenu.Popup')
  }
  return context
}

export function useMaybeDataPopupContext(): DataPopupContextValue | null {
  return React.useContext(DataPopupContext)
}

export function useResolvedNodesPublication(
  dataSurfaceContext: DataSurfaceContextValue | null,
  hasOpenSubpage: boolean,
): Pick<
  DataPopupContextValue,
  'resolvedNodes' | 'publishResolvedNodes' | 'invalidateResolvedNodes'
> {
  const [publication, setPublication] = React.useState<{
    token: symbol
    sourceId: string
    nodes: readonly ResolvedMenuNode[]
    pending: boolean
  } | null>(null)
  const publicationRef = React.useRef(publication)
  const registeredSourceRef = React.useRef<string | null>(null)
  const hasOpenSubpageRef = React.useRef(hasOpenSubpage)
  hasOpenSubpageRef.current = hasOpenSubpage
  publicationRef.current = publication

  const setCurrent = React.useCallback((next: typeof publication) => {
    publicationRef.current = next
    setPublication(next)
  }, [])
  const clearToken = React.useCallback(
    (token: symbol) => {
      if (publicationRef.current?.token !== token) return
      setCurrent(null)
    },
    [setCurrent],
  )
  const publishResolvedNodes = React.useCallback(
    (sourceId: string, nodes: readonly ResolvedMenuNode[]) => {
      const token = Symbol('resolved-nodes-publication')
      setCurrent({ token, sourceId, nodes: [...nodes], pending: false })
      return () => {
        const current = publicationRef.current
        if (!current || current.token !== token) return
        if (hasOpenSubpageRef.current) {
          setCurrent({ ...current, pending: true })
          return
        }
        queueMicrotask(() => clearToken(token))
      }
    },
    [clearToken, setCurrent],
  )
  const invalidateResolvedNodes = React.useCallback(() => {
    const current = publicationRef.current
    if (current) setCurrent({ ...current, nodes: [...current.nodes] })
  }, [setCurrent])

  React.useEffect(() => {
    const previous = registeredSourceRef.current
    const next = dataSurfaceContext?.listId ?? null
    registeredSourceRef.current = next
    if (previous && previous !== next) {
      const current = publicationRef.current
      if (current?.sourceId === previous) setCurrent(null)
    }
  }, [dataSurfaceContext?.listId, setCurrent])

  React.useEffect(() => {
    if (hasOpenSubpage) return
    const pending = publicationRef.current
    if (!pending?.pending) return
    queueMicrotask(() => clearToken(pending.token))
  }, [clearToken, hasOpenSubpage])

  return React.useMemo(
    () => ({
      resolvedNodes: publication?.nodes ?? null,
      publishResolvedNodes,
      invalidateResolvedNodes,
    }),
    [publication?.nodes, publishResolvedNodes, invalidateResolvedNodes],
  )
}

// ============================================================================
// Data List Context
// ============================================================================

export const DataListContext =
  React.createContext<DataListChildrenState | null>(null)

export function useDataList(): DataListChildrenState {
  const context = React.useContext(DataListContext)
  if (!context) {
    throw new Error('useDataList must be used within a List component')
  }
  return context
}

export function useMaybeDataList(): DataListChildrenState | null {
  return React.useContext(DataListContext)
}

// ============================================================================
// Render Node Function Type
// ============================================================================

export type RenderNodeFn = (displayNode: DisplayNode) => React.ReactNode
