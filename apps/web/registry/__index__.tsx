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
//
// Examples can be structured in two ways:
//
// 1. Single file (flat):
//    registry/examples/dropdown-menu-basic.tsx
//    files: ['registry/examples/dropdown-menu-basic.tsx']
//
// 2. Multi-file (folder):
//    registry/examples/dropdown-menu-complex/index.tsx
//    registry/examples/dropdown-menu-complex/data.ts
//    files: [
//      'registry/examples/dropdown-menu-complex/index.tsx',
//      'registry/examples/dropdown-menu-complex/data.ts',
//    ]
//
// The first file in the `files` array is used as the main component to render.
// All files are shown as tabs in the code viewer.

export const examples: RegistryIndex = {
  'filter-variants': {
    name: 'filter-variants',
    type: 'registry:example',
    component: React.lazy(() => import('@/registry/examples/filter-variants')),
    files: ['registry/examples/filter-variants.tsx'],
  },
  'dropdown-menu-basic': {
    name: 'dropdown-menu-basic',
    type: 'registry:example',
    component: React.lazy(
      () => import('@/registry/examples/dropdown-menu/basic'),
    ),
    files: ['registry/examples/dropdown-menu/basic/index.tsx'],
  },
  'dropdown-menu-close-on-click': {
    name: 'dropdown-menu-close-on-click',
    type: 'registry:example',
    component: React.lazy(
      () => import('@/registry/examples/dropdown-menu/close-on-click'),
    ),
    files: ['registry/examples/dropdown-menu/close-on-click/index.tsx'],
  },
  'dropdown-menu-hidden-input': {
    name: 'dropdown-menu-hidden-input',
    type: 'registry:example',
    component: React.lazy(
      () => import('@/registry/examples/dropdown-menu/hidden-input'),
    ),
    files: ['registry/examples/dropdown-menu/hidden-input/index.tsx'],
  },
  'dropdown-menu-checkbox': {
    name: 'dropdown-menu-checkbox',
    type: 'registry:example',
    component: React.lazy(
      () => import('@/registry/examples/dropdown-menu/checkbox'),
    ),
    files: ['registry/examples/dropdown-menu/checkbox/index.tsx'],
  },
  'dropdown-menu-radio': {
    name: 'dropdown-menu-radio',
    type: 'registry:example',
    component: React.lazy(
      () => import('@/registry/examples/dropdown-menu/radio'),
    ),
    files: ['registry/examples/dropdown-menu/radio/index.tsx'],
  },
  'dropdown-menu-submenu': {
    name: 'dropdown-menu-submenu',
    type: 'registry:example',
    component: React.lazy(
      () => import('@/registry/examples/dropdown-menu/submenu'),
    ),
    files: ['registry/examples/dropdown-menu/submenu/index.tsx'],
  },
  'dropdown-menu-search': {
    name: 'dropdown-menu-search',
    type: 'registry:example',
    component: React.lazy(
      () => import('@/registry/examples/dropdown-menu/search'),
    ),
    files: [
      'registry/examples/dropdown-menu/search/index.tsx',
      'registry/examples/dropdown-menu/search/data.ts',
    ],
  },
  'dropdown-menu-deep-search': {
    name: 'dropdown-menu-deep-search',
    type: 'registry:example',
    component: React.lazy(
      () => import('@/registry/examples/dropdown-menu/deep-search'),
    ),
    files: ['registry/examples/dropdown-menu/deep-search/index.tsx'],
  },
  'dropdown-menu-deep-search-linear': {
    name: 'dropdown-menu-deep-search-linear',
    type: 'registry:example',
    component: React.lazy(
      () => import('@/registry/examples/dropdown-menu/deep-search-linear'),
    ),
    files: [
      'registry/examples/dropdown-menu/deep-search-linear/index.tsx',
      'registry/examples/dropdown-menu/deep-search-linear/components.tsx',
      'registry/examples/dropdown-menu/deep-search-linear/icons.tsx',
    ],
  },
  'dropdown-menu-deep-search-linear-async': {
    name: 'dropdown-menu-deep-search-linear-async',
    type: 'registry:example',
    component: React.lazy(
      () =>
        import('@/registry/examples/dropdown-menu/deep-search-linear-async'),
    ),
    files: [
      'registry/examples/dropdown-menu/deep-search-linear-async/index.tsx',
      'registry/examples/dropdown-menu/deep-search-linear-async/components.tsx',
      'registry/examples/dropdown-menu/deep-search-linear-async/icons.tsx',
    ],
  },
  'dropdown-menu-async-deep-search': {
    name: 'dropdown-menu-async-deep-search',
    type: 'registry:example',
    component: React.lazy(
      () => import('@/registry/examples/dropdown-menu/async-deep-search'),
    ),
    files: ['registry/examples/dropdown-menu/async-deep-search/index.tsx'],
  },
  'dropdown-menu-virtualized': {
    name: 'dropdown-menu-virtualized',
    type: 'registry:example',
    component: React.lazy(
      () => import('@/registry/examples/dropdown-menu/virtualized'),
    ),
    files: ['registry/examples/dropdown-menu/virtualized/index.tsx'],
  },
  'dropdown-menu-virtualized-advanced': {
    name: 'dropdown-menu-virtualized-advanced',
    type: 'registry:example',
    component: React.lazy(
      () => import('@/registry/examples/dropdown-menu/virtualized-advanced'),
    ),
    files: ['registry/examples/dropdown-menu/virtualized-advanced/index.tsx'],
  },
  'dropdown-menu-async': {
    name: 'dropdown-menu-async',
    type: 'registry:example',
    component: React.lazy(
      () => import('@/registry/examples/dropdown-menu/async'),
    ),
    files: ['registry/examples/dropdown-menu/async/index.tsx'],
  },

  'guides/dropdown-menu/your-first-menu/surface-hidden-input': {
    name: 'guides/dropdown-menu/your-first-menu/surface-hidden-input',
    type: 'registry:example',
    component: React.lazy(
      () =>
        import(
          '@/registry/examples/dropdown-menu/guides/your-first-menu/surface-hidden-input'
        ),
    ),
    files: [
      'registry/examples/dropdown-menu/guides/your-first-menu/surface-hidden-input.tsx',
    ],
  },
  'guides/dropdown-menu/your-first-menu/01-initial': {
    name: 'guides/dropdown-menu/your-first-menu/01-initial',
    type: 'registry:example',
    component: React.lazy(
      () =>
        import(
          '@/registry/examples/dropdown-menu/guides/your-first-menu/items-01'
        ),
    ),
    files: [
      'registry/examples/dropdown-menu/guides/your-first-menu/items-01.tsx',
    ],
  },
  'guides/dropdown-menu/your-first-menu/items-02': {
    name: 'guides/dropdown-menu/your-first-menu/items-02',
    type: 'registry:example',
    component: React.lazy(
      () =>
        import(
          '@/registry/examples/dropdown-menu/guides/your-first-menu/items-02'
        ),
    ),
    files: [
      'registry/examples/dropdown-menu/guides/your-first-menu/items-02.tsx',
    ],
  },

  // Select examples
  'select-basic': {
    name: 'select-basic',
    type: 'registry:example',
    component: React.lazy(() => import('@/registry/examples/select/basic')),
    files: ['registry/examples/select/basic/index.tsx'],
  },
  'select-groups': {
    name: 'select-groups',
    type: 'registry:example',
    component: React.lazy(() => import('@/registry/examples/select/groups')),
    files: ['registry/examples/select/groups/index.tsx'],
  },
  'select-search': {
    name: 'select-search',
    type: 'registry:example',
    component: React.lazy(() => import('@/registry/examples/select/search')),
    files: ['registry/examples/select/search/index.tsx'],
  },
  'select-form': {
    name: 'select-form',
    type: 'registry:example',
    component: React.lazy(() => import('@/registry/examples/select/form')),
    files: ['registry/examples/select/form/index.tsx'],
  },
  'select-object-values': {
    name: 'select-object-values',
    type: 'registry:example',
    component: React.lazy(
      () => import('@/registry/examples/select/object-values'),
    ),
    files: ['registry/examples/select/object-values/index.tsx'],
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
