'use client'

import * as React from 'react'
import { useMaybeSubpageStack } from './subpage-stack-context.js'

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

/**
 * The subpage context only when its page belongs to the current popup's
 * stack. A submenu rendered inside a subpage inherits the outer page's
 * context, but its popup has its own stack, so back navigation from the
 * submenu must not pop the outer page. The page's surface must be the one
 * this popup registered, so a page in the submenu popup that reuses the
 * outer page's ID doesn't count either.
 */
export function useMaybeSubpageContextInPopup(): SubpageContextValue | null {
  const subpageContext = useMaybeSubpageContext()
  const subpageStack = useMaybeSubpageStack()
  if (
    !subpageContext ||
    subpageStack?.getSurfaceId(subpageContext.pageId) !==
      subpageContext.surfaceId
  ) {
    return null
  }
  return subpageContext
}

export { SubpageContext }
