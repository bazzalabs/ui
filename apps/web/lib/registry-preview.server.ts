import 'server-only'

import type { ComponentType } from 'react'

type RegistryPreviewModule = {
  default: ComponentType<unknown>
}

export interface RegistryPreviewEntry {
  files: string[]
  load: () => Promise<RegistryPreviewModule>
}

const registryPreviewEntries: Record<string, RegistryPreviewEntry> = {
  'dropdown-menu-basic': {
    files: ['registry/examples/dropdown-menu/basic/index.tsx'],
    load: () => import('@/registry/examples/dropdown-menu/basic'),
  },
  'dropdown-menu-close-on-click': {
    files: ['registry/examples/dropdown-menu/close-on-click/index.tsx'],
    load: () => import('@/registry/examples/dropdown-menu/close-on-click'),
  },
  'dropdown-menu-hidden-input': {
    files: ['registry/examples/dropdown-menu/hidden-input/index.tsx'],
    load: () => import('@/registry/examples/dropdown-menu/hidden-input'),
  },
  'dropdown-menu-checkbox': {
    files: ['registry/examples/dropdown-menu/checkbox/index.tsx'],
    load: () => import('@/registry/examples/dropdown-menu/checkbox'),
  },
  'dropdown-menu-radio': {
    files: ['registry/examples/dropdown-menu/radio/index.tsx'],
    load: () => import('@/registry/examples/dropdown-menu/radio'),
  },
  'dropdown-menu-submenu': {
    files: ['registry/examples/dropdown-menu/submenu/index.tsx'],
    load: () => import('@/registry/examples/dropdown-menu/submenu'),
  },
  'dropdown-menu-search': {
    files: [
      'registry/examples/dropdown-menu/search/index.tsx',
      'registry/examples/dropdown-menu/search/data.ts',
    ],
    load: () => import('@/registry/examples/dropdown-menu/search'),
  },
  'dropdown-menu-deep-search': {
    files: ['registry/examples/dropdown-menu/deep-search/index.tsx'],
    load: () => import('@/registry/examples/dropdown-menu/deep-search'),
  },
  'dropdown-menu-deep-search-linear': {
    files: [
      'registry/examples/dropdown-menu/deep-search-linear/index.tsx',
      'registry/examples/dropdown-menu/deep-search-linear/components.tsx',
      'registry/examples/dropdown-menu/deep-search-linear/icons.tsx',
    ],
    load: () => import('@/registry/examples/dropdown-menu/deep-search-linear'),
  },
  'dropdown-menu-deep-search-linear-async': {
    files: [
      'registry/examples/dropdown-menu/deep-search-linear-async/index.tsx',
      'registry/examples/dropdown-menu/deep-search-linear-async/components.tsx',
      'registry/examples/dropdown-menu/deep-search-linear-async/icons.tsx',
    ],
    load: () =>
      import('@/registry/examples/dropdown-menu/deep-search-linear-async'),
  },
  'dropdown-menu-async-deep-search': {
    files: ['registry/examples/dropdown-menu/async-deep-search/index.tsx'],
    load: () => import('@/registry/examples/dropdown-menu/async-deep-search'),
  },
  'dropdown-menu-virtualized': {
    files: ['registry/examples/dropdown-menu/virtualized/index.tsx'],
    load: () => import('@/registry/examples/dropdown-menu/virtualized'),
  },
  'dropdown-menu-virtualized-advanced': {
    files: ['registry/examples/dropdown-menu/virtualized-advanced/index.tsx'],
    load: () =>
      import('@/registry/examples/dropdown-menu/virtualized-advanced'),
  },
  'guides/dropdown-menu/your-first-menu/surface-hidden-input': {
    files: [
      'registry/examples/dropdown-menu/guides/your-first-menu/surface-hidden-input.tsx',
    ],
    load: () =>
      import(
        '@/registry/examples/dropdown-menu/guides/your-first-menu/surface-hidden-input'
      ),
  },
  'guides/dropdown-menu/your-first-menu/01-initial': {
    files: [
      'registry/examples/dropdown-menu/guides/your-first-menu/items-01.tsx',
    ],
    load: () =>
      import(
        '@/registry/examples/dropdown-menu/guides/your-first-menu/items-01'
      ),
  },
  'guides/dropdown-menu/your-first-menu/items-02': {
    files: [
      'registry/examples/dropdown-menu/guides/your-first-menu/items-02.tsx',
    ],
    load: () =>
      import(
        '@/registry/examples/dropdown-menu/guides/your-first-menu/items-02'
      ),
  },
  'select-basic': {
    files: ['registry/examples/select/basic/index.tsx'],
    load: () => import('@/registry/examples/select/basic'),
  },
  'select-groups': {
    files: ['registry/examples/select/groups/index.tsx'],
    load: () => import('@/registry/examples/select/groups'),
  },
  'select-search': {
    files: ['registry/examples/select/search/index.tsx'],
    load: () => import('@/registry/examples/select/search'),
  },
  'select-form': {
    files: ['registry/examples/select/form/index.tsx'],
    load: () => import('@/registry/examples/select/form'),
  },
  'select-object-values': {
    files: ['registry/examples/select/object-values/index.tsx'],
    load: () => import('@/registry/examples/select/object-values'),
  },
}

export function getRegistryPreviewEntry(
  name: string,
): RegistryPreviewEntry | null {
  return registryPreviewEntries[name] ?? null
}

export async function loadRegistryPreviewComponent(name: string) {
  const entry = getRegistryPreviewEntry(name)
  if (!entry) {
    return null
  }

  const mod = await entry.load()
  return mod.default
}
