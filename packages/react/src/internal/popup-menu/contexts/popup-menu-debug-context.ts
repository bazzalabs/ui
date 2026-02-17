'use client'

import * as React from 'react'

/**
 * Debug configuration available on popup-menu roots.
 */
export interface PopupMenuDebugOptions {
  /**
   * Shows the safe triangle area used by submenu aim guard.
   * @default false
   */
  showSubmenuSafeTriangleArea?: boolean
}

export interface PopupMenuDebugContextValue {
  showSubmenuSafeTriangleArea: boolean
}

const defaultPopupMenuDebugContextValue: PopupMenuDebugContextValue = {
  showSubmenuSafeTriangleArea: false,
}

export const PopupMenuDebugContext =
  React.createContext<PopupMenuDebugContextValue>(
    defaultPopupMenuDebugContextValue,
  )

export function usePopupMenuDebug(): PopupMenuDebugContextValue {
  return React.useContext(PopupMenuDebugContext)
}
