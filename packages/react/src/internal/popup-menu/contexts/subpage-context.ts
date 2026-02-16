'use client'

import * as React from 'react'

export interface SubpageContextValue {
  /** Current page ID. */
  pageId: string
  /** Surface ID for this page. */
  surfaceId: string
  /** Surface ID for the previous page, if available. */
  parentSurfaceId: string | null
  /** Whether this page is currently active. */
  isActive: boolean
  /** Whether Escape should close the entire menu tree from this page. */
  closeRootOnEsc: boolean
  /** Navigate back one page. Returns true when navigation happened. */
  goBack: () => boolean
}

const SubpageContext = React.createContext<SubpageContextValue | null>(null)

export function useSubpageContext(): SubpageContextValue {
  const context = React.useContext(SubpageContext)
  if (!context) {
    throw new Error(
      'Subpage components must be used within a PopupMenu.Subpage',
    )
  }
  return context
}

export function useMaybeSubpageContext(): SubpageContextValue | null {
  return React.useContext(SubpageContext)
}

export { SubpageContext }
