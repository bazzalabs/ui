/**
 * Registry Index
 *
 * Auto-generated file that exports all registry components with React.lazy()
 * for code-splitting. This enables preview components to dynamically load
 * examples without bundling them all upfront.
 *
 * Registry item types:
 * - registry:example - Example components demonstrating usage
 * - registry:block - Full-page block demos
 * - registry:ui - UI component wrappers (not rendered directly)
 */

import * as React from 'react'

// =============================================================================
// Types
// =============================================================================

export interface RegistryEntry {
  name: string
  type: 'registry:example' | 'registry:block' | 'registry:ui'
  component: React.LazyExoticComponent<React.ComponentType<unknown>>
  files: string[]
}

export type RegistryIndex = Record<string, RegistryEntry>

// =============================================================================
// Examples
// =============================================================================

export const examples: RegistryIndex = {
  'filter-variants': {
    name: 'filter-variants',
    type: 'registry:example',
    component: React.lazy(() => import('@/registry/examples/filter-variants')),
    files: ['registry/examples/filter-variants.tsx'],
  },
}

// =============================================================================
// Blocks
// =============================================================================

export const blocks: RegistryIndex = {
  'filters-01': {
    name: 'filters-01',
    type: 'registry:block',
    component: React.lazy(() => import('@/registry/blocks/filters-01/page')),
    files: [
      'registry/blocks/filters-01/page.tsx',
      'registry/blocks/filters-01/_/components/issues-table.tsx',
      'registry/blocks/filters-01/_/components/data-table.tsx',
      'registry/blocks/filters-01/_/lib/columns.tsx',
      'registry/blocks/filters-01/_/lib/data.ts',
      'registry/blocks/filters-01/_/lib/filters.tsx',
    ],
  },
}

// =============================================================================
// UI Components (for reference, not directly rendered)
// =============================================================================

// Helper to create a null component for UI entries (they're not rendered directly)
const createNullComponent = () =>
  React.lazy(() => Promise.resolve({ default: () => null }))

export const ui: RegistryIndex = {
  'action-menu': {
    name: 'action-menu',
    type: 'registry:ui',
    component: createNullComponent(),
    files: ['registry/ui/action-menu/index.tsx'],
  },
  'command-menu': {
    name: 'command-menu',
    type: 'registry:ui',
    component: createNullComponent(),
    files: ['registry/ui/command-menu/index.tsx'],
  },
  'context-menu': {
    name: 'context-menu',
    type: 'registry:ui',
    component: createNullComponent(),
    files: ['registry/ui/context-menu/index.tsx'],
  },
  'dropdown-menu': {
    name: 'dropdown-menu',
    type: 'registry:ui',
    component: createNullComponent(),
    files: ['registry/ui/dropdown-menu/index.tsx'],
  },
  select: {
    name: 'select',
    type: 'registry:ui',
    component: createNullComponent(),
    files: ['registry/ui/select/index.tsx'],
  },
  'multi-select': {
    name: 'multi-select',
    type: 'registry:ui',
    component: createNullComponent(),
    files: ['registry/ui/multi-select/index.tsx'],
  },
  filter: {
    name: 'filter',
    type: 'registry:ui',
    component: createNullComponent(),
    files: [
      'registry/ui/filter/index.ts',
      'registry/ui/filter/index.parts.ts',
      'registry/ui/filter/components/root/filter-root.tsx',
      'registry/ui/filter/components/provider/filter-provider.tsx',
      'registry/ui/filter/components/root/filter-context.tsx',
      'registry/ui/filter/components/menu/filter-menu.tsx',
      'registry/ui/filter/components/trigger/filter-trigger.tsx',
      'registry/ui/filter/components/list/filter-list.tsx',
      'registry/ui/filter/components/list/filter-list-mobile-container.tsx',
      'registry/ui/filter/components/item/filter-item.tsx',
      'registry/ui/filter/components/item/filter-subject.tsx',
      'registry/ui/filter/components/item/filter-operator.tsx',
      'registry/ui/filter/components/item/filter-value.tsx',
      'registry/ui/filter/components/item/filter-remove.tsx',
      'registry/ui/filter/components/actions/filter-actions.tsx',
      'registry/ui/filter/components/value/index.ts',
      'registry/ui/filter/components/value/types.ts',
      'registry/ui/filter/components/value/option-item.tsx',
      'registry/ui/filter/components/value/text-item.tsx',
      'registry/ui/filter/components/value/option-menu.ts',
      'registry/ui/filter/components/value/multi-option-menu.ts',
      'registry/ui/filter/components/value/text-menu.ts',
      'registry/ui/filter/components/value/filter-value-date-controller.tsx',
      'registry/ui/filter/components/value/filter-value-number-controller.tsx',
      'registry/ui/filter/hooks/use-debounce-callback.tsx',
      'registry/ui/filter/hooks/use-unmount.tsx',
      'registry/ui/filter/lib/debounce.ts',
      'registry/ui/filter/ui/debounced-input.tsx',
    ],
  },
}

// =============================================================================
// Combined Registry
// =============================================================================

export const registry: RegistryIndex = {
  ...examples,
  ...blocks,
  ...ui,
}

/**
 * Get a registry entry by name
 */
export function getRegistryEntry(name: string): RegistryEntry | undefined {
  return registry[name]
}

/**
 * Get all registry entries of a specific type
 */
export function getRegistryEntriesByType(
  type: RegistryEntry['type'],
): RegistryEntry[] {
  return Object.values(registry).filter((entry) => entry.type === type)
}

/**
 * Check if a registry entry exists
 */
export function hasRegistryEntry(name: string): boolean {
  return name in registry
}
