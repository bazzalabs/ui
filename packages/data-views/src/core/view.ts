// @bazza-ui/data-views — View Operations
// Pure view state transition functions.

import type { FilterGroup, FilterNode, FiltersState } from './filter-tree.js'
import {
  countConditions,
  createEmptyFilters,
  createNodeId,
  isCondition,
  normalizeFilters,
} from './filter-tree.js'
import type { DataViewState, DataViewStateMeta, SortState } from './types.js'

function cloneNode(node: FilterNode): FilterNode {
  if (isCondition(node)) {
    return { ...node, values: [...node.values] }
  }

  return cloneGroup(node)
}

function cloneGroup(group: FilterGroup): FilterGroup {
  return {
    ...group,
    children: group.children.map((child) => cloneNode(child)),
  }
}

function cloneFilters(state: FiltersState): FiltersState {
  return cloneGroup(state)
}

export function createEmptyViewState(): DataViewState {
  return { filters: createEmptyFilters(), sort: [] }
}

export function mergeFilters(
  base: FiltersState,
  overrides: FiltersState,
): FiltersState {
  const normalizedBase = normalizeFilters(cloneFilters(base))
  const normalizedOverrides = normalizeFilters(cloneFilters(overrides))

  if (countConditions(normalizedBase) === 0) return normalizedOverrides
  if (countConditions(normalizedOverrides) === 0) return normalizedBase

  return normalizeFilters({
    kind: 'group',
    id: createNodeId(),
    op: 'and',
    children: [cloneFilters(base), cloneFilters(overrides)],
  })
}

export function mergeSort(base: SortState, overrides: SortState): SortState {
  return overrides.length > 0 ? overrides : base
}

function isNonEmptySearch(value: string | undefined): value is string {
  return value !== undefined && value.length > 0
}

export function mergeSearch(
  base: string | undefined,
  overrides: string | undefined,
): string | undefined {
  if (isNonEmptySearch(overrides)) return overrides
  if (isNonEmptySearch(base)) return base
  return undefined
}

export function mergeViewState(
  base: DataViewState,
  overrides: DataViewState,
): DataViewState {
  const search = mergeSearch(base.search, overrides.search)

  return {
    ...(base.id !== undefined ? { id: base.id } : {}),
    ...(base.name !== undefined ? { name: base.name } : {}),
    filters: mergeFilters(base.filters, overrides.filters),
    sort: mergeSort(base.sort, overrides.sort),
    ...(search !== undefined ? { search } : {}),
    ...(base.meta !== undefined ? { meta: base.meta } : {}),
  }
}

export const viewOperations = {
  load(view: DataViewState): DataViewState {
    return {
      ...view,
      filters: cloneFilters(view.filters),
      sort: [...view.sort],
    }
  },

  snapshot(
    current: DataViewState,
    overrides?: { id?: string; name?: string; meta?: DataViewStateMeta },
  ): DataViewState {
    return {
      ...current,
      filters: cloneFilters(current.filters),
      sort: [...current.sort],
      ...(overrides?.id !== undefined ? { id: overrides.id } : {}),
      ...(overrides?.name !== undefined ? { name: overrides.name } : {}),
      ...(overrides?.meta !== undefined
        ? { meta: { ...current.meta, ...overrides.meta } }
        : current.meta !== undefined
          ? { meta: { ...current.meta } }
          : {}),
    }
  },

  reset(defaultView?: DataViewState): DataViewState {
    if (defaultView) return viewOperations.load(defaultView)
    return createEmptyViewState()
  },

  merge(
    current: DataViewState,
    partial: Partial<DataViewState>,
  ): DataViewState {
    return {
      ...current,
      ...(partial.filters !== undefined ? { filters: partial.filters } : {}),
      ...(partial.sort !== undefined ? { sort: partial.sort } : {}),
      ...(partial.search !== undefined ? { search: partial.search } : {}),
      ...(partial.id !== undefined ? { id: partial.id } : {}),
      ...(partial.name !== undefined ? { name: partial.name } : {}),
      ...(partial.meta !== undefined
        ? { meta: { ...current.meta, ...partial.meta } }
        : {}),
    }
  },
}
