'use client'

import * as React from 'react'

// ============================================================================
// Popup Surface ID Context
// ============================================================================

/**
 * Context for passing surfaceId from Popup to Surface.
 * This ensures Popup and Surface share the same ID for data attribute tracking.
 *
 * For root menus, Popup generates the ID and provides it via this context.
 * For submenus, the ID comes from SubmenuContext.childSurfaceId instead.
 */
const PopupSurfaceIdContext = React.createContext<string | null>(null)

export function usePopupSurfaceId(): string | null {
  return React.useContext(PopupSurfaceIdContext)
}

export { PopupSurfaceIdContext }
