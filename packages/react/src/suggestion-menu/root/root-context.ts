'use client'

import * as React from 'react'
import type { SuggestionMenuHandle } from '../handle.js'

export interface SuggestionMenuRootContextValue {
  handle: SuggestionMenuHandle
  /** The current query, from the Root's `query` prop or the handle. */
  query: string
  /** The payload from the last `update()`. */
  payload: unknown
  /**
   * Called by the Surface when its results have settled, with the number of
   * results and the text of the row Enter would choose.
   */
  reportResults: (count: number, label: string | null) => void
  /** Writes the host's ARIA attributes again, e.g. once the list mounts. */
  syncHostAria: (listId?: string) => void
  /** Whether the anchor has measured a rect during this opening. */
  anchorReady: boolean
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
