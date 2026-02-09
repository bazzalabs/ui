// @bazza-ui/data-view/drizzle/pg — PostgreSQL Drizzle Adapter
// Converts DataViewQueryAST into Drizzle PostgreSQL queries.

import {
  and,
  asc,
  between,
  desc,
  eq,
  getTableColumns,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  not,
  notBetween,
  notIlike,
  notInArray,
  or,
  type SQL,
  sql,
} from 'drizzle-orm'
import type { PgColumn, PgDatabase, PgTable } from 'drizzle-orm/pg-core'

import type { ColumnType } from '../core/column-types.js'
import { builtInColumnTypes } from '../core/column-types.js'
import type { ColumnConfig, DataViewState } from '../core/types.js'
import type { DataViewResult } from '../server/adapter.js'
import type {
  ComparisonCondition,
  ComparisonOp,
  Condition,
  DataViewQueryAST,
  FieldRef,
  JsonSafeValue,
  SearchNode,
  SortNode,
} from '../server/ast.js'
import { buildQueryAST } from '../server/compile.js'
import type { OperatorCompilerMap } from '../server/compilers.js'
import type { HasManyRelationSet } from '../server/resolve.js'

// ── Relation Config Types ───────────────────────────────────

/**
 * A simple belongs-to / has-one relation:
 * just pass the related Drizzle table.
 * The adapter introspects FK metadata from the source table's columns.
 */
type SimpleRelation = PgTable

/**
 * A many-to-many relation via a pivot table.
 * The adapter introspects FK metadata from the pivot table's columns.
 */
type ManyToManyRelation = {
  through: PgTable
  to: PgTable
}

/**
 * Explicit FK override for when `.references()` isn't on the schema.
 */
type ExplicitBelongsToRelation = {
  table: PgTable
  on: { source: PgColumn; target: PgColumn }
}

type RelationConfig =
  | SimpleRelation
  | ManyToManyRelation
  | ExplicitBelongsToRelation

/** User-provided relation map. */
export type PgRelationsConfig = Record<string, RelationConfig>

// ── Options ─────────────────────────────────────────────────

/**
 * Options for `applyDataView()`.
 */
export interface ApplyDataViewOptions<TData> {
  /** The source Drizzle table (e.g. `schema.issues`). */
  table: PgTable

  /** The column configurations (from `useDataView`). */
  columns: ReadonlyArray<ColumnConfig<TData, any, any, any>>

  /** The view state from the frontend. */
  view: DataViewState

  /** Relation configuration for JOINed fields. */
  relations?: PgRelationsConfig

  /** Pagination configuration. */
  pagination?:
    | {
        kind: 'offset'
        page: number
        pageSize: number
      }
    | {
        kind: 'cursor'
        cursor: string | null
        limit: number
        direction?: 'forward' | 'backward'
      }

  /** Search configuration. */
  search?: {
    query: string
    columns: string[]
    mode?: 'contains' | 'fulltext'
  }

  /** Custom operator compilers (for custom column types). */
  compilers?: Record<string, OperatorCompilerMap>

  /** Custom column types (for value serialization). */
  // biome-ignore lint/suspicious/noExplicitAny: variance
  columnTypes?: Record<string, ColumnType<any>>

  /**
   * Optional AST transform hook. Called after compilation, before SQL generation.
   * Use this for cross-cutting concerns like tenant isolation, soft-delete, etc.
   */
  transform?: (ast: DataViewQueryAST) => DataViewQueryAST
}

// ── FK Introspection ────────────────────────────────────────

/**
 * Discovers the foreign key column on `sourceTable` that references `targetTable`.
 *
 * Drizzle columns created with `.references(() => target.id)` expose FK metadata.
 * This function scans the source table's columns to find the one referencing the target.
 *
 * @internal - exported for testing only
 */
export function discoverFK(
  sourceTable: PgTable,
  targetTable: PgTable,
): { sourceColumn: PgColumn; targetColumn: PgColumn } | null {
  // Get the target table's name for matching
  const targetTableName =
    (targetTable as any)[Symbol.for('drizzle:Name')] ??
    (targetTable as any)['_']?.['name']

  // Drizzle stores inline foreign keys at the table level
  // via Symbol.for('drizzle:PgInlineForeignKeys')
  const inlineFKs: any[] =
    (sourceTable as any)[Symbol.for('drizzle:PgInlineForeignKeys')] ?? []

  for (const fk of inlineFKs) {
    try {
      // fk.reference is a function that returns { columns, foreignTable, foreignColumns }
      const ref =
        typeof fk.reference === 'function' ? fk.reference() : fk.reference
      if (!ref) continue

      const refTableName =
        ref.foreignTable?.[Symbol.for('drizzle:Name')] ??
        ref.foreignTable?.['_']?.['name']

      if (refTableName && refTableName === targetTableName) {
        // Use the first column pair (single-column FKs)
        const sourceColumn = ref.columns?.[0] as PgColumn | undefined
        const targetColumn = ref.foreignColumns?.[0] as PgColumn | undefined

        if (sourceColumn && targetColumn) {
          return { sourceColumn, targetColumn }
        }
      }
    } catch {}
  }

  return null
}

// ── Relation Resolution ─────────────────────────────────────

/** @internal - exported for testing only */
export type ResolvedBelongsTo = {
  kind: 'belongsTo'
  relatedTable: PgTable
  sourceFK: PgColumn
  targetPK: PgColumn
}

/** @internal - exported for testing only */
export type ResolvedManyToMany = {
  kind: 'manyToMany'
  pivotTable: PgTable
  pivotSourceFK: PgColumn
  sourcePK: PgColumn
  targetTable: PgTable
  pivotTargetFK: PgColumn
  targetPK: PgColumn
}

/** @internal - exported for testing only */
export type ResolvedRelation = ResolvedBelongsTo | ResolvedManyToMany

/** @internal - exported for testing only */
export function isManyToManyConfig(
  config: RelationConfig,
): config is ManyToManyRelation {
  return (
    typeof config === 'object' &&
    config !== null &&
    'through' in config &&
    'to' in config
  )
}

/** @internal - exported for testing only */
export function isExplicitBelongsToConfig(
  config: RelationConfig,
): config is ExplicitBelongsToRelation {
  return (
    typeof config === 'object' &&
    config !== null &&
    'table' in config &&
    'on' in config
  )
}

/**
 * Resolves a user-provided relation config into resolved FK information.
 * @internal - exported for testing only
 */
export function resolveRelation(
  name: string,
  config: RelationConfig,
  sourceTable: PgTable,
): ResolvedRelation {
  if (isManyToManyConfig(config)) {
    // Many-to-many: discover FKs on the pivot table
    const pivotToSource = discoverFK(config.through, sourceTable)
    const pivotToTarget = discoverFK(config.through, config.to)

    if (!pivotToSource) {
      throw new Error(
        `[data-view/drizzle/pg] Cannot find FK from pivot table to source table for relation "${name}". ` +
          'Ensure the pivot table has a column with .references() pointing to the source table.',
      )
    }
    if (!pivotToTarget) {
      throw new Error(
        `[data-view/drizzle/pg] Cannot find FK from pivot table to target table for relation "${name}". ` +
          'Ensure the pivot table has a column with .references() pointing to the target table.',
      )
    }

    return {
      kind: 'manyToMany',
      pivotTable: config.through,
      pivotSourceFK: pivotToSource.sourceColumn,
      sourcePK: pivotToSource.targetColumn,
      targetTable: config.to,
      pivotTargetFK: pivotToTarget.sourceColumn,
      targetPK: pivotToTarget.targetColumn,
    }
  }

  if (isExplicitBelongsToConfig(config)) {
    return {
      kind: 'belongsTo',
      relatedTable: config.table,
      sourceFK: config.on.source,
      targetPK: config.on.target,
    }
  }

  // Simple belongs-to: config is the target table directly
  const targetTable = config as PgTable
  const fk = discoverFK(sourceTable, targetTable)

  if (!fk) {
    throw new Error(
      `[data-view/drizzle/pg] Cannot find FK from source table to "${name}" relation table. ` +
        'Ensure the source table has a column with .references() pointing to the related table, ' +
        'or use the explicit { table, on: { source, target } } form.',
    )
  }

  return {
    kind: 'belongsTo',
    relatedTable: targetTable,
    sourceFK: fk.sourceColumn,
    targetPK: fk.targetColumn,
  }
}

// ── Column Resolution ───────────────────────────────────────

/**
 * Resolves a FieldRef to a Drizzle PgColumn reference.
 * @internal - exported for testing only
 */
export function resolveColumn(
  fieldRef: FieldRef,
  sourceTable: PgTable,
  resolvedRelations: Map<string, ResolvedRelation>,
): PgColumn {
  const cols = getTableColumns(sourceTable)

  switch (fieldRef.path.kind) {
    case 'direct': {
      // Try exact match first (column ID = JS property name)
      const directCol = (cols as Record<string, PgColumn>)[fieldRef.path.column]
      if (directCol) return directCol

      // Try matching by DB column name
      for (const col of Object.values(cols)) {
        if ((col as any).name === fieldRef.path.column) {
          return col as PgColumn
        }
      }

      throw new Error(
        `[data-view/drizzle/pg] Cannot find column "${fieldRef.path.column}" on source table ` +
          `for column ID "${fieldRef.columnId}".`,
      )
    }

    case 'belongsTo': {
      const rel = resolvedRelations.get(fieldRef.path.relation)
      if (!rel || rel.kind !== 'belongsTo') {
        throw new Error(
          `[data-view/drizzle/pg] Relation "${fieldRef.path.relation}" not found or not a belongs-to relation ` +
            `for column ID "${fieldRef.columnId}".`,
        )
      }

      const relCols = getTableColumns(rel.relatedTable)
      const col = (relCols as Record<string, PgColumn>)[fieldRef.path.column]
      if (!col) {
        // Try DB name match
        for (const c of Object.values(relCols)) {
          if ((c as any).name === fieldRef.path.column) return c as PgColumn
        }
        throw new Error(
          `[data-view/drizzle/pg] Cannot find column "${fieldRef.path.column}" ` +
            `on related table for relation "${fieldRef.path.relation}".`,
        )
      }
      return col
    }

    case 'hasMany': {
      const rel = resolvedRelations.get(fieldRef.path.relation)
      if (!rel || rel.kind !== 'manyToMany') {
        throw new Error(
          `[data-view/drizzle/pg] Relation "${fieldRef.path.relation}" not found or not a many-to-many relation ` +
            `for column ID "${fieldRef.columnId}".`,
        )
      }

      const targetCols = getTableColumns(rel.targetTable)
      const col = (targetCols as Record<string, PgColumn>)[fieldRef.path.column]
      if (!col) {
        for (const c of Object.values(targetCols)) {
          if ((c as any).name === fieldRef.path.column) return c as PgColumn
        }
        throw new Error(
          `[data-view/drizzle/pg] Cannot find column "${fieldRef.path.column}" ` +
            `on target table for relation "${fieldRef.path.relation}".`,
        )
      }
      return col
    }
  }
}

// ── AST → Drizzle SQL ───────────────────────────────────────

/**
 * Converts a ComparisonOp + value to a Drizzle SQL expression.
 * @internal - exported for testing only
 */
export function applyComparisonOp(
  col: PgColumn,
  op: ComparisonOp,
  value: JsonSafeValue | JsonSafeValue[],
): SQL {
  switch (op) {
    case 'eq':
      return eq(col, value as any)
    case 'neq':
      return ne(col, value as any)
    case 'gt':
      return gt(col, value as any)
    case 'gte':
      return gte(col, value as any)
    case 'lt':
      return lt(col, value as any)
    case 'lte':
      return lte(col, value as any)
    case 'ilike':
      return ilike(col, value as string)
    case 'like':
      return sql`${col} LIKE ${value}`
    case 'notIlike':
      return notIlike(col, value as string)
    case 'notLike':
      return sql`${col} NOT LIKE ${value}`
    case 'in':
      return inArray(col, value as any[])
    case 'notIn':
      return notInArray(col, value as any[])
    case 'between': {
      const [a, b] = value as JsonSafeValue[]
      return between(col, a as any, b as any)
    }
    case 'notBetween': {
      const [a, b] = value as JsonSafeValue[]
      return notBetween(col, a as any, b as any)
    }
    case 'isNull':
      return isNull(col)
    case 'isNotNull':
      return isNotNull(col)
    case 'arrayContains':
      // PostgreSQL: column @> ARRAY[values]
      return sql`${col} @> ARRAY[${sql.join(
        (value as JsonSafeValue[]).map((v) => sql`${v}`),
        sql`,`,
      )}]`
    case 'arrayOverlaps':
      // PostgreSQL: column && ARRAY[values]
      return sql`${col} && ARRAY[${sql.join(
        (value as JsonSafeValue[]).map((v) => sql`${v}`),
        sql`,`,
      )}]`
    default:
      throw new Error(
        `[data-view/drizzle/pg] Unsupported comparison operator: "${op}"`,
      )
  }
}

/**
 * Converts an AST Condition into a Drizzle SQL expression.
 * Handles has-many fields by wrapping them in EXISTS subqueries.
 * @internal - exported for testing only
 */
export function conditionToSQL(
  condition: Condition,
  sourceTable: PgTable,
  resolvedRelations: Map<string, ResolvedRelation>,
): SQL {
  switch (condition.kind) {
    case 'and': {
      const parts = condition.conditions.map((c) =>
        conditionToSQL(c, sourceTable, resolvedRelations),
      )
      return and(...parts) ?? sql`TRUE`
    }

    case 'or': {
      const parts = condition.conditions.map((c) =>
        conditionToSQL(c, sourceTable, resolvedRelations),
      )
      return or(...parts) ?? sql`TRUE`
    }

    case 'not':
      return not(
        conditionToSQL(condition.condition, sourceTable, resolvedRelations),
      )

    case 'comparison':
      return comparisonToSQL(condition, sourceTable, resolvedRelations)
  }
}

/**
 * Converts a ComparisonCondition into SQL.
 * For has-many fields, generates an EXISTS subquery.
 * @internal - exported for testing only
 */
export function comparisonToSQL(
  cond: ComparisonCondition,
  sourceTable: PgTable,
  resolvedRelations: Map<string, ResolvedRelation>,
): SQL {
  const { field, op, value } = cond

  if (field.path.kind === 'hasMany') {
    // Generate EXISTS subquery for many-to-many
    return existsSubquery(field, op, value, sourceTable, resolvedRelations)
  }

  // Direct or belongs-to: resolve column and apply operator
  const col = resolveColumn(field, sourceTable, resolvedRelations)
  return applyComparisonOp(col, op, value)
}

/**
 * Generates an EXISTS subquery for a has-many / many-to-many comparison.
 * @internal - exported for testing only
 */
export function existsSubquery(
  field: FieldRef,
  op: ComparisonOp,
  value: JsonSafeValue | JsonSafeValue[],
  sourceTable: PgTable,
  resolvedRelations: Map<string, ResolvedRelation>,
): SQL {
  if (field.path.kind !== 'hasMany') {
    throw new Error(
      '[data-view/drizzle/pg] existsSubquery called on non-hasMany field',
    )
  }

  const rel = resolvedRelations.get(field.path.relation)
  if (!rel || rel.kind !== 'manyToMany') {
    throw new Error(
      `[data-view/drizzle/pg] Relation "${field.path.relation}" must be a many-to-many relation for EXISTS subquery.`,
    )
  }

  const targetCol = resolveColumn(field, sourceTable, resolvedRelations)
  const filterCondition = applyComparisonOp(targetCol, op, value)

  // EXISTS (
  //   SELECT 1 FROM pivot_table
  //     JOIN target_table ON target_table.id = pivot_table.target_fk
  //   WHERE pivot_table.source_fk = source_table.source_pk
  //     AND <filterCondition>
  // )
  return sql`EXISTS (
    SELECT 1 FROM ${rel.pivotTable}
      INNER JOIN ${rel.targetTable} ON ${rel.targetPK} = ${rel.pivotTargetFK}
    WHERE ${rel.pivotSourceFK} = ${rel.sourcePK}
      AND ${filterCondition}
  )`
}

// ── Search → SQL ────────────────────────────────────────────

/**
 * Converts a SearchNode into a Drizzle SQL expression.
 * @internal - exported for testing only
 */
export function searchToSQL(
  search: SearchNode,
  sourceTable: PgTable,
  resolvedRelations: Map<string, ResolvedRelation>,
): SQL | null {
  if (!search.query.trim()) return null

  if (search.mode === 'fulltext') {
    // PostgreSQL full-text search using tsvector/tsquery
    const tsvectorParts = search.fields
      .map((field) => {
        if (field.path.kind === 'hasMany') {
          // Can't include hasMany fields in tsvector concatenation — skip
          return null
        }
        const col = resolveColumn(field, sourceTable, resolvedRelations)
        return sql`COALESCE(${col}::text, '')`
      })
      .filter(Boolean) as SQL[]

    if (tsvectorParts.length === 0) return null

    const concatenated = sql.join(tsvectorParts, sql` || ' ' || `)
    return sql`to_tsvector('english', ${concatenated}) @@ plainto_tsquery('english', ${search.query})`
  }

  // 'contains' mode — ILIKE pattern matching
  const pattern = `%${search.query.replace(/[%_\\]/g, '\\$&')}%`
  const conditions: SQL[] = []

  for (const field of search.fields) {
    if (field.path.kind === 'hasMany') {
      // EXISTS subquery with ILIKE on the target column
      const rel = resolvedRelations.get(field.path.relation)
      if (!rel || rel.kind !== 'manyToMany') continue

      const targetCol = resolveColumn(field, sourceTable, resolvedRelations)
      conditions.push(sql`EXISTS (
        SELECT 1 FROM ${rel.pivotTable}
          INNER JOIN ${rel.targetTable} ON ${rel.targetPK} = ${rel.pivotTargetFK}
        WHERE ${rel.pivotSourceFK} = ${rel.sourcePK}
          AND ${ilike(targetCol, pattern)}
      )`)
    } else {
      const col = resolveColumn(field, sourceTable, resolvedRelations)
      conditions.push(ilike(col, pattern))
    }
  }

  if (conditions.length === 0) return null
  if (conditions.length === 1) return conditions[0]!
  return or(...conditions) ?? null
}

// ── Sort → SQL ──────────────────────────────────────────────

/**
 * Converts SortNodes into Drizzle order-by expressions.
 * @internal - exported for testing only
 */
export function sortToSQL(
  sorts: SortNode[],
  sourceTable: PgTable,
  resolvedRelations: Map<string, ResolvedRelation>,
): SQL[] {
  return sorts.map((sort) => {
    const col = resolveColumn(sort.field, sourceTable, resolvedRelations)
    return sort.direction === 'asc' ? asc(col) : desc(col)
  })
}

// ── Main Entry Point ────────────────────────────────────────

/**
 * Applies a `DataViewState` to a Drizzle PostgreSQL query.
 *
 * This is the primary API for server-side filtering, sorting, pagination,
 * and search using Drizzle ORM with PostgreSQL.
 *
 * @example
 * ```typescript
 * import { applyDataView } from '@bazza-ui/data-view/drizzle/pg'
 *
 * // Simple (flat table)
 * const result = await applyDataView(db, {
 *   table: schema.users,
 *   columns: userColumns,
 *   view: dataViewState,
 * })
 *
 * // With relations and pagination
 * const result = await applyDataView(db, {
 *   table: schema.issues,
 *   columns: issueColumns,
 *   view: dataViewState,
 *   relations: {
 *     status: schema.statuses,
 *     assignee: schema.users,
 *     labels: { through: schema.issueLabels, to: schema.labels },
 *   },
 *   pagination: { kind: 'offset', page: 1, pageSize: 25 },
 * })
 * ```
 */
export async function applyDataView<TData>(
  // biome-ignore lint/suspicious/noExplicitAny: Drizzle's DB type is complex
  db: PgDatabase<any, any, any>,
  options: ApplyDataViewOptions<TData>,
): Promise<DataViewResult<TData>> {
  const {
    table,
    columns,
    view,
    relations: relationsConfig,
    pagination,
    search,
    compilers,
    columnTypes,
    transform,
  } = options

  // ── 1. Resolve relations ──
  const resolvedRelations = new Map<string, ResolvedRelation>()
  const hasManyRelations: HasManyRelationSet = new Set()

  if (relationsConfig) {
    for (const [name, config] of Object.entries(relationsConfig)) {
      const resolved = resolveRelation(name, config, table)
      resolvedRelations.set(name, resolved)
      if (resolved.kind === 'manyToMany') {
        hasManyRelations.add(name)
      }
    }
  }

  // ── 2. Compile AST ──
  let ast = buildQueryAST(view, {
    columns,
    hasManyRelations,
    compilers,
    columnTypes,
    pagination: pagination
      ? pagination.kind === 'offset'
        ? {
            kind: 'offset',
            offset: (pagination.page - 1) * pagination.pageSize,
            limit: pagination.pageSize,
          }
        : {
            kind: 'cursor',
            cursor: pagination.cursor,
            limit: pagination.limit,
            direction: pagination.direction ?? 'forward',
          }
      : null,
    search: search ?? null,
  })

  // ── 3. Apply transform hook ──
  if (transform) {
    ast = transform(ast)
  }

  // ── 4. Collect required belongs-to JOINs ──
  const requiredJoins = new Set<string>()
  collectRequiredJoins(ast, requiredJoins)

  // ── 5. Build the query ──
  // Start with the base select
  let query: any = db.select().from(table)

  // Apply belongs-to JOINs
  for (const relationName of requiredJoins) {
    const rel = resolvedRelations.get(relationName)
    if (!rel || rel.kind !== 'belongsTo') continue
    query = query.innerJoin(rel.relatedTable, eq(rel.targetPK, rel.sourceFK))
  }

  // Build combined WHERE condition
  const whereConditions: SQL[] = []

  if (ast.where) {
    whereConditions.push(conditionToSQL(ast.where, table, resolvedRelations))
  }

  if (ast.search) {
    const searchSQL = searchToSQL(ast.search, table, resolvedRelations)
    if (searchSQL) whereConditions.push(searchSQL)
  }

  if (whereConditions.length > 0) {
    query = query.where(
      whereConditions.length === 1
        ? whereConditions[0]
        : and(...whereConditions),
    )
  }

  // Apply ORDER BY
  if (ast.orderBy.length > 0) {
    const orderClauses = sortToSQL(ast.orderBy, table, resolvedRelations)
    query = query.orderBy(...orderClauses)
  }

  // Apply pagination
  if (ast.pagination) {
    if (ast.pagination.kind === 'offset') {
      query = query.limit(ast.pagination.limit).offset(ast.pagination.offset)
    } else {
      // Cursor pagination: limit + 1 to detect hasNextPage
      query = query.limit(ast.pagination.limit + 1)
      // Note: cursor WHERE condition should be in the transform hook
      // or handled by the consumer. This is a basic implementation.
    }
  }

  // ── 6. Execute data query ──
  const rows = (await query) as TData[]

  // ── 7. Get total count ──
  const countQuery = db.select({ count: sql<number>`count(*)` }).from(table)
  // Reapply the same WHERE + JOINs for count (without ORDER BY or pagination)
  let countQ: any = countQuery

  for (const relationName of requiredJoins) {
    const rel = resolvedRelations.get(relationName)
    if (!rel || rel.kind !== 'belongsTo') continue
    countQ = countQ.innerJoin(rel.relatedTable, eq(rel.targetPK, rel.sourceFK))
  }

  if (whereConditions.length > 0) {
    countQ = countQ.where(
      whereConditions.length === 1
        ? whereConditions[0]
        : and(...whereConditions),
    )
  }

  const [countResult] = (await countQ) as [{ count: number }]
  const totalCount = Number(countResult?.count ?? 0)

  return { data: rows, totalCount }
}

// ── Helpers ─────────────────────────────────────────────────

/**
 * Walks the AST to collect all relation names that need belongs-to JOINs.
 * Has-many relations use EXISTS subqueries and don't need JOINs.
 * @internal - exported for testing only
 */
export function collectRequiredJoins(
  ast: DataViewQueryAST,
  joins: Set<string>,
): void {
  if (ast.where) collectJoinsFromCondition(ast.where, joins)
  if (ast.search) {
    for (const field of ast.search.fields) {
      if (field.path.kind === 'belongsTo') {
        joins.add(field.path.relation)
      }
    }
  }
  for (const sort of ast.orderBy) {
    if (sort.field.path.kind === 'belongsTo') {
      joins.add(sort.field.path.relation)
    }
  }
}

function collectJoinsFromCondition(
  condition: Condition,
  joins: Set<string>,
): void {
  switch (condition.kind) {
    case 'comparison':
      if (condition.field.path.kind === 'belongsTo') {
        joins.add(condition.field.path.relation)
      }
      break
    case 'and':
    case 'or':
      for (const c of condition.conditions) {
        collectJoinsFromCondition(c, joins)
      }
      break
    case 'not':
      collectJoinsFromCondition(condition.condition, joins)
      break
  }
}
