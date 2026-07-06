import type { FilterGroup, FiltersState } from './filter-tree.js'
import {
  createEmptyFilters,
  createNodeId,
  normalizeFilters,
} from './filter-tree.js'
import {
  type AnyColumnDef,
  type ColumnById,
  type ColumnIds,
  condition,
  type OperatorIdsForType,
  type ValuesForType,
} from './typed.js'
import type { CustomSort, DataViewState, DataViewStateMeta } from './types.js'

export type TypedConditionInput<TCols extends readonly AnyColumnDef[]> = {
  [TId in ColumnIds<TCols>]: {
    columnId: TId
    operator: OperatorIdsForType<ColumnById<TCols, TId>['type']>
    values: ValuesForType<ColumnById<TCols, TId>['type']>
  }
}[ColumnIds<TCols>]

export interface TypedViewInput<TCols extends readonly AnyColumnDef[]> {
  id?: string
  name?: string
  /**
   * A FilterGroup (from group()/condition() builders) OR an array of typed
   * condition inputs treated as root-level AND conditions.
   */
  filters?: FilterGroup | Array<TypedConditionInput<TCols>>
  sort?: Array<
    { columnId: ColumnIds<TCols>; direction: 'asc' | 'desc' } | CustomSort
  >
  search?: string
  meta?: DataViewStateMeta
}

function normalizeTypedConditions<const TCols extends readonly AnyColumnDef[]>(
  columns: TCols,
  filters: Array<TypedConditionInput<TCols>>,
): FiltersState {
  return normalizeFilters({
    kind: 'group',
    id: createNodeId(),
    op: 'and',
    children: filters.map((filter) =>
      condition(columns, filter.columnId, filter.operator, filter.values),
    ),
  })
}

function normalizeViewFilters<const TCols extends readonly AnyColumnDef[]>(
  columns: TCols,
  filters: TypedViewInput<TCols>['filters'],
): FiltersState {
  if (!filters) return createEmptyFilters()
  if (Array.isArray(filters)) return normalizeTypedConditions(columns, filters)

  return normalizeFilters(filters)
}

function normalizeViewSort<const TCols extends readonly AnyColumnDef[]>(
  sort: TypedViewInput<TCols>['sort'],
): DataViewState['sort'] {
  if (!sort) return []

  return sort.map((rule) => {
    if ('columnId' in rule) {
      return {
        type: 'column',
        columnId: rule.columnId,
        direction: rule.direction,
      }
    }

    return rule
  })
}

export function defineView<const TCols extends readonly AnyColumnDef[]>(
  columns: TCols,
): (input: TypedViewInput<TCols>) => DataViewState {
  return (input) => ({
    ...(input.id !== undefined ? { id: input.id } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    filters: normalizeViewFilters(columns, input.filters),
    sort: normalizeViewSort(input.sort),
    ...(input.search !== undefined ? { search: input.search } : {}),
    ...(input.meta !== undefined ? { meta: input.meta } : {}),
  })
}
