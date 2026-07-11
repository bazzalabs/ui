'use client'

import * as React from 'react'

/**
 * Component name used for generating bazzaui-* slot attributes.
 * E.g., 'dropdown-menu', 'context-menu', 'select', 'combobox', 'command-menu'
 */
export type ComponentName =
  | 'dropdown-menu'
  | 'context-menu'
  | 'select'
  | 'combobox'
  | 'command-menu'

export const ComponentNameContext = React.createContext<ComponentName | null>(
  null,
)

/**
 * Returns the component name from context.
 * Throws if used outside of a component that provides the context.
 */
export function useComponentName(): ComponentName {
  const context = React.useContext(ComponentNameContext)
  if (context === null) {
    throw new Error(
      'useComponentName must be used within a ComponentNameContext.Provider',
    )
  }
  return context
}

/**
 * Returns the component name from context, or null if not available.
 * Useful for internal components that may be used outside the popup-menu context.
 */
export function useMaybeComponentName(): ComponentName | null {
  return React.useContext(ComponentNameContext)
}

/**
 * Helper to generate a bazzaui slot attribute value.
 * @param componentName The component name (e.g., 'dropdown-menu')
 * @param partName The part name (e.g., 'trigger', 'item')
 * @returns The slot attribute value (e.g., 'bazzaui-dropdown-menu-trigger')
 */
export function getSlotAttribute(
  componentName: ComponentName | null,
  partName: string,
): string | undefined {
  if (!componentName) return undefined
  return `bazzaui-${componentName}-${partName}`
}
