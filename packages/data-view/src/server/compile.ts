// @bazza-ui/data-view — AST Compiler
// Converts DataViewState + column configs into a DataViewQueryAST.

import type { ColumnType } from '../core/column-types.js'
import { builtInColumnTypes } from '../core/column-types.js'
import type {
  ColumnConfig,
  ColumnSort,
  DataViewState,
  FiltersState,
  SortState,
} from '../core/types.js'
import type {
  Condition,
  CursorPagination,
  DataViewQueryAST,
  FieldRef,
  JsonSafeValue,
  OffsetPagination,
  PaginationNode,
  SearchNode,
  SortNode,
} from './ast.js'
import {
  builtInCompilers,
  type OperatorCompiler,
  type OperatorCompilerMap,
} from './compilers.js'
import { type HasManyRelationSet, resolveFieldRefs } from './resolve.js'

// ── Compile Options ─────────────────────────────────────────

export interface CompileFilterOptions {
  /**
   * Resolved field references for each column.
   * Use `resolveFieldRefs()` to build this from column configs.
   */
  fieldRefs: Map<string, FieldRef>

  /**
   * Custom operator compilers per column type.
   * Merged with (and overrides) the built-in compilers.
   *
   * @example
   * ```typescript
   * compilers: {
   *   currency: {
   *     'is zero': (field) => ({ kind: 'comparison', field, op: 'eq', value: 0 }),
   *   },
   * }
   * ```
   */
  compilers?: Record<string, OperatorCompilerMap>

  /**
   * Column type configs for serializing filter values.
   * Built-in types are used by default. Provide custom types here
   * to handle serialization for custom column types.
   */
  // biome-ignore lint/suspicious/noExplicitAny: variance
  columnTypes?: Record<string, ColumnType<any>>
}

export interface CompileSortOptions {
  /** Resolved field references for each column. */
  fieldRefs: Map<string, FieldRef>
}

export interface CompileSearchOptions {
  /** Resolved field references for each column. */
  fieldRefs: Map<string, FieldRef>
}

/**
 * Options for `buildQueryAST()` — the top-level compile function.
 */
export interface BuildQueryASTOptions {
  /** The column configurations (from `useDataView`). */
  columns: ReadonlyArray<ColumnConfig<any, any, any, any>>

  /**
   * Set of relation names that are has-many / many-to-many.
   * Adapters build this from their relation schema.
   */
  hasManyRelations?: HasManyRelationSet

  /** Custom operator compilers per column type. */
  compilers?: Record<string, OperatorCompilerMap>

  /** Custom column type configs for value serialization. */
  // biome-ignore lint/suspicious/noExplicitAny: variance
  columnTypes?: Record<string, ColumnType<any>>

  /** Pagination to include in the AST. */
  pagination?: PaginationNode | null

  /** Search configuration. */
  search?: {
    query: string
    /** Column IDs to search across. */
    columns: string[]
    mode?: 'contains' | 'fulltext'
  } | null
}

// ── Value Serialization ─────────────────────────────────────

/**
 * Serializes filter values to JSON-safe format using the column type's
 * `serialize` function (e.g., Date → ISO string, BigInt → string).
 *
 * @internal
 */
export function serializeFilterValues(
  values: unknown[],
  columnTypeName: string,
  // biome-ignore lint/suspicious/noExplicitAny: variance
  customColumnTypes?: Record<string, ColumnType<any>>,
): JsonSafeValue[] {
  const columnType =
    customColumnTypes?.[columnTypeName] ??
    (builtInColumnTypes as Record<string, ColumnType<any>>)[columnTypeName]

  if (!columnType?.serialize) {
    // No serialization needed — values are already JSON-safe (strings, numbers, booleans)
    return values as JsonSafeValue[]
  }

  return values.map((v) => {
    if (v == null) return null
    return columnType.serialize!(v as any) as JsonSafeValue
  })
}

// ── Filter Compilation ──────────────────────────────────────

/**
 * Compiles a `FiltersState` into an AST `Condition`.
 *
 * Each filter is looked up by column type + operator ID to find the
 * appropriate compiler. Values are serialized before compilation.
 *
 * Returns `null` if there are no active filters.
 */
export function compileFilters(
  filters: FiltersState,
  options: CompileFilterOptions,
): Condition | null {
  const conditions: Condition[] = []

  for (const filter of filters) {
    const fieldRef = options.fieldRefs.get(filter.columnId)
    if (!fieldRef) continue

    // Serialize values (Date → ISO, BigInt → string, etc.)
    const serializedValues = serializeFilterValues(
      filter.values,
      filter.type,
      options.columnTypes,
    )

    // Find the compiler: custom overrides first, then built-in
    const customCompilers = options.compilers?.[filter.type]
    const defaultCompilers = builtInCompilers[
      filter.type as keyof typeof builtInCompilers
    ] as OperatorCompilerMap | undefined
    const typeCompilers = customCompilers
      ? { ...defaultCompilers, ...customCompilers }
      : defaultCompilers

    if (!typeCompilers) continue

    const compiler: OperatorCompiler | undefined =
      typeCompilers[filter.operator]
    if (!compiler) continue

    conditions.push(compiler(fieldRef, serializedValues))
  }

  if (conditions.length === 0) return null
  if (conditions.length === 1) return conditions[0]!
  return { kind: 'and', conditions }
}

// ── Sort Compilation ────────────────────────────────────────

/**
 * Compiles a `SortState` into an array of `SortNode`s.
 *
 * Only processes `ColumnSort` rules (type: 'column'). `CustomSort` rules
 * are ignored — they represent application-level sort logic.
 */
export function compileSort(
  sort: SortState,
  options: CompileSortOptions,
): SortNode[] {
  const nodes: SortNode[] = []

  for (const rule of sort) {
    if (rule.type !== 'column') continue

    const columnSort = rule as ColumnSort
    const fieldRef = options.fieldRefs.get(columnSort.columnId)
    if (!fieldRef) continue

    nodes.push({
      field: fieldRef,
      direction: columnSort.direction,
      nulls: 'last',
    })
  }

  return nodes
}

// ── Search Compilation ──────────────────────────────────────

/**
 * Compiles a search query into a `SearchNode`.
 *
 * Resolves the requested column IDs to `FieldRef`s and packages them
 * with the search query and mode.
 */
export function compileSearch(
  search: { query: string; columns: string[]; mode?: 'contains' | 'fulltext' },
  options: CompileSearchOptions,
): SearchNode | null {
  if (!search.query.trim()) return null

  const fields: FieldRef[] = []
  for (const columnId of search.columns) {
    const fieldRef = options.fieldRefs.get(columnId)
    if (fieldRef) fields.push(fieldRef)
  }

  if (fields.length === 0) return null

  return {
    query: search.query,
    fields,
    mode: search.mode ?? 'contains',
  }
}

// ── Top-Level Compiler ──────────────────────────────────────

/**
 * Builds a complete `DataViewQueryAST` from a `DataViewState` and options.
 *
 * This is the main entry point for the compile step. Adapters typically
 * call this internally, but it can also be used directly for inspecting
 * or transforming the AST.
 *
 * @example
 * ```typescript
 * const ast = buildQueryAST(dataViewState, {
 *   columns: issueColumns,
 *   hasManyRelations: new Set(['labels']),
 *   pagination: { kind: 'offset', offset: 0, limit: 25 },
 * })
 * ```
 */
export function buildQueryAST(
  view: DataViewState,
  options: BuildQueryASTOptions,
): DataViewQueryAST {
  // Resolve field refs from column configs
  const fieldRefs = resolveFieldRefs(options.columns, options.hasManyRelations)

  // Compile each part of the query
  const where = compileFilters(view.filters, {
    fieldRefs,
    compilers: options.compilers,
    columnTypes: options.columnTypes,
  })

  const orderBy = compileSort(view.sort, { fieldRefs })

  const search = options.search
    ? compileSearch(options.search, { fieldRefs })
    : null

  const pagination = options.pagination ?? null

  return { where, orderBy, pagination, search }
}
