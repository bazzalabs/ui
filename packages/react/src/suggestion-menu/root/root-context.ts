'use client'

import * as React from 'react'
import type { SuggestionMenuHandle } from '../handle.js'

export interface SuggestionMenuRootContextValue {
  handle: SuggestionMenuHandle
  /** The current query, from the Root's `query` prop or the handle. */
  query: string
  /** The payload from the last `update()`. */
  payload: unknown
}

export const SuggestionMenuRootContext =
  React.createContext<SuggestionMenuRootContextValue | null>(null)

export function useSuggestionMenuRootContext(): SuggestionMenuRootContextValue {
  const context = React.useContext(SuggestionMenuRootContext)
  if (!context) {
    throw new Error(
      'SuggestionMenu parts must be used within a SuggestionMenu.Root.',
    )
  }
  return context
}
