'use client'

import * as React from 'react'
import type {
  AsyncLoaderConfig,
  DeepSearchConfig,
  DisplayNode,
  GetItemIdFn,
  NodeDef,
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

  /** List element ID for aria-activedescendant */
  listId: string

  /** Function to generate unique IDs for items */
  getItemId: GetItemIdFn
}

export const DataSurfaceContext =
  React.createContext<DataSurfaceContextValue | null>(null)

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

// ============================================================================
// Render Node Function Type
// ============================================================================

export type RenderNodeFn = (displayNode: DisplayNode) => React.ReactNode
