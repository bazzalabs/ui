'use client'

import { useMaybeMenuTreeTier } from './menu-tree-context.js'

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
  | 'suggestion-menu'

/**
 * Returns the component name of the menu tree around the caller (set by
 * `PopupMenuProviders` on its tree tier).
 * Throws if used outside of a menu tree.
 */
export function useComponentName(): ComponentName {
  const componentName = useMaybeComponentName()
  if (componentName === null) {
    throw new Error('useComponentName must be used within a menu tree')
  }
  return componentName
}

/**
 * Returns the component name of the menu tree around the caller, or null
 * outside one. Useful for internal components that may be used outside the
 * popup-menu context.
 */
export function useMaybeComponentName(): ComponentName | null {
  return useMaybeMenuTreeTier()?.componentName ?? null
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
