'use client'

import * as React from 'react'

export interface PopupMenuTreeContextValue {
  depth: number
}

export const TreeContext =
  React.createContext<PopupMenuTreeContextValue | null>(null)

export function useMaybeTreeContext(): PopupMenuTreeContextValue | null {
  return React.useContext(TreeContext)
}
