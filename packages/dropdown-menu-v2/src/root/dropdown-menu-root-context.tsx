'use client'

import * as React from 'react'
import type { MenuStore } from '@bazza-ui/menu-v2'

/**
 * Context for the dropdown menu root
 */
export interface DropdownMenuRootContextValue {
  /** The menu store instance */
  menuStore: MenuStore
}

const DropdownMenuRootContext =
  React.createContext<DropdownMenuRootContextValue | null>(null)

if (process.env.NODE_ENV !== 'production') {
  DropdownMenuRootContext.displayName = 'DropdownMenuRootContext'
}

/**
 * Hook to access the dropdown menu root context.
 * Must be used within a DropdownMenuRoot component.
 */
export function useDropdownMenuRootContext(): DropdownMenuRootContextValue {
  const context = React.useContext(DropdownMenuRootContext)
  if (!context) {
    throw new Error(
      'useDropdownMenuRootContext must be used within a DropdownMenuRoot component',
    )
  }
  return context
}

/**
 * Hook to optionally access the dropdown menu root context.
 * Returns null if not within a DropdownMenuRoot component.
 */
export function useOptionalDropdownMenuRootContext(): DropdownMenuRootContextValue | null {
  return React.useContext(DropdownMenuRootContext)
}

export { DropdownMenuRootContext }
