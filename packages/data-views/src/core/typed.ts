import type {
  FilterCondition,
  FilterGroup,
  FilterNode,
  FiltersState,
} from './filter-tree.js'
import {
  createNodeId,
  filterOperations,
  filterTreeOperations,
} from './filter-tree.js'
import type { OperatorSet } from './operator-set.js'
import type {
  bigIntOperators,
  booleanOperators,
  dateOperators,
  multiOptionOperators,
  numberOperators,
  optionOperators,
  textOperators,
} from './operator-sets.js'
import type { ColumnDataType, FilterValues } from './types.js'

/** Minimal column shape the type layer keys on. */
export type AnyColumnDef = {
  readonly id: string
  readonly type: ColumnDataType
}

export type ColumnIds<TCols extends readonly AnyColumnDef[]> =
  TCols[number]['id']

export type ColumnById<
  TCols extends readonly AnyColumnDef[],
  TId extends ColumnIds<TCols>,
> = Extract<TCols[number], { readonly id: TId }>

/** Operator id unions per built-in data type, derived from the shipped operator sets. */
type OperatorIdOf<TSet> = TSet extends OperatorSet<infer TId> ? TId : string

export type BuiltInOperatorIds = {
  text: OperatorIdOf<typeof textOperators>
  number: OperatorIdOf<typeof numberOperators>
  bigint: OperatorIdOf<typeof bigIntOperators>
  date: OperatorIdOf<typeof dateOperators>
  boolean: OperatorIdOf<typeof booleanOperators>
  option: OperatorIdOf<typeof optionOperators>
  multiOption: OperatorIdOf<typeof multiOptionOperators>
}

export type OperatorIdsForType<TType extends ColumnDataType> =
  TType extends keyof BuiltInOperatorIds ? BuiltInOperatorIds[TType] : string

export type ValuesForType<TType extends ColumnDataType> = FilterValues<TType>

function unknownColumnError(columnId: string) {
  return new Error(`[data-views] Unknown column "${columnId}"`)
}

function resolveColumn<
  TCols extends readonly AnyColumnDef[],
  TId extends ColumnIds<TCols>,
>(columns: TCols, columnId: TId): ColumnById<TCols, TId> {
  const column = columns.find((candidate) => candidate.id === columnId)

  if (!column) throw unknownColumnError(columnId)

  return column as ColumnById<TCols, TId>
}

/** Typed condition builder with an auto-generated node id. */
export function condition<
  const TCols extends readonly AnyColumnDef[],
  const TId extends ColumnIds<TCols>,
>(
  columns: TCols,
  columnId: TId,
  operator: OperatorIdsForType<ColumnById<TCols, NoInfer<TId>>['type']>,
  values: ValuesForType<ColumnById<TCols, NoInfer<TId>>['type']>,
): FilterCondition {
  const column = resolveColumn(columns, columnId)

  return {
    kind: 'condition',
    id: createNodeId(),
    columnId: column.id,
    type: column.type,
    operator,
    values: [...values],
  }
}

/** Typed group builder with an auto-generated node id. */
export function group(op: 'and' | 'or', children: FilterNode[]): FilterGroup {
  return {
    kind: 'group',
    id: createNodeId(),
    op,
    children: [...children],
  }
}

/**
 * createFilterActions(columns) — typed pure wrappers over the filter operations.
 * Each method returns a new FiltersState; no React, no side effects.
 */
export function createFilterActions<
  const TCols extends readonly AnyColumnDef[],
>(
  columns: TCols,
): {
  add<const TId extends ColumnIds<TCols>>(
    state: FiltersState,
    columnId: TId,
    input: {
      operator: OperatorIdsForType<ColumnById<TCols, NoInfer<TId>>['type']>
      values: ValuesForType<ColumnById<TCols, NoInfer<TId>>['type']>
    },
  ): FiltersState
  setValues<const TId extends ColumnIds<TCols>>(
    state: FiltersState,
    columnId: TId,
    values: ValuesForType<ColumnById<TCols, NoInfer<TId>>['type']>,
  ): FiltersState
  setOperator<const TId extends ColumnIds<TCols>>(
    state: FiltersState,
    columnId: TId,
    operator: OperatorIdsForType<ColumnById<TCols, NoInfer<TId>>['type']>,
  ): FiltersState
  remove(state: FiltersState, columnId: ColumnIds<TCols>): FiltersState
  removeAll(state: FiltersState): FiltersState
} {
  return {
    add(state, columnId, input) {
      return filterTreeOperations.addNode(
        state,
        state.id,
        condition(columns, columnId, input.operator, input.values),
      )
    },

    setValues(state, columnId, values) {
      const column = resolveColumn(columns, columnId)

      return filterOperations.setFilterValue(state, column, values)
    },

    setOperator(state, columnId, operator) {
      const column = resolveColumn(columns, columnId)

      return filterOperations.setFilterOperator(state, column.id, operator)
    },

    remove(state, columnId) {
      const column = resolveColumn(columns, columnId)

      return filterOperations.removeFilter(state, column.id)
    },

    removeAll(state) {
      return filterOperations.removeAllFilters(state)
    },
  }
}
