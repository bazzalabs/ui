// @bazza-ui/data-view — Field Path Resolution
// Parses `.field()` string hints from column configs into structured FieldRef objects.

import type { ColumnConfig, ColumnDataType } from '../core/types.js'
import type {
  BelongsToFieldPath,
  DirectFieldPath,
  FieldPath,
  FieldRef,
  HasManyFieldPath,
} from './ast.js'

// ── Field Path Parsing ──────────────────────────────────────

/**
 * Parses a `.field()` string hint into a structured `FieldPath`.
 *
 * Convention:
 * - `'column_name'` → `DirectFieldPath` (rename from column ID)
 * - `'relation.column'` → relation path (adapter resolves kind from its own schema)
 *
 * @internal
 */
export function parseFieldPath(fieldHint: string): FieldPath {
  const dotIndex = fieldHint.indexOf('.')

  if (dotIndex === -1) {
    // No dot → direct column (possibly renamed)
    return { kind: 'direct', column: fieldHint }
  }

  const relation = fieldHint.slice(0, dotIndex)
  const column = fieldHint.slice(dotIndex + 1)

  if (!relation || !column) {
    throw new Error(
      `[data-view] Invalid field path "${fieldHint}". Expected "column" or "relation.column".`,
    )
  }

  // At parse time, we don't know if this is belongs-to or has-many.
  // We return a 'relation' kind that the adapter will resolve to the
  // correct type based on its own relation schema.
  // For the AST, we default to 'belongsTo' — adapters override to
  // 'hasMany' when they detect a many-to-many or has-many relation.
  return { kind: 'belongsTo', relation, column }
}

// ── Relation Kind Override ──────────────────────────────────

/**
 * Set of relation names that should be treated as has-many / many-to-many.
 * Adapters provide this based on their relation schema.
 */
export type HasManyRelationSet = Set<string>

/**
 * Refines a parsed `FieldPath` by upgrading `belongsTo` to `hasMany`
 * for relations that are known to be has-many or many-to-many.
 *
 * @internal
 */
export function refineFieldPath(
  path: FieldPath,
  hasManyRelations: HasManyRelationSet,
): FieldPath {
  if (path.kind === 'belongsTo' && hasManyRelations.has(path.relation)) {
    return {
      kind: 'hasMany',
      relation: path.relation,
      column: path.column,
    } satisfies HasManyFieldPath
  }
  return path
}

// ── FieldRef Resolution ─────────────────────────────────────

/**
 * Resolves a column config into a `FieldRef` for use in the query AST.
 *
 * - If `.field()` is set, parses it into a `FieldPath`.
 * - If `.field()` is not set, uses the column `id` as the DB column name.
 * - Refines the path kind based on `hasManyRelations` if provided.
 */
export function resolveFieldRef(
  column: ColumnConfig<any, any, any, any>,
  hasManyRelations?: HasManyRelationSet,
): FieldRef {
  const fieldHint = column.field

  let path: FieldPath

  if (fieldHint) {
    path = parseFieldPath(fieldHint)
  } else {
    // Default: column ID = DB column name
    path = { kind: 'direct', column: column.id } satisfies DirectFieldPath
  }

  // Refine belongsTo → hasMany if applicable
  if (hasManyRelations) {
    path = refineFieldPath(path, hasManyRelations)
  }

  return {
    columnId: column.id,
    type: column.type as ColumnDataType,
    path,
  }
}

// ── Batch Resolution ────────────────────────────────────────

/**
 * Resolves all column configs into a lookup map of `columnId → FieldRef`.
 */
export function resolveFieldRefs(
  columns: ReadonlyArray<ColumnConfig<any, any, any, any>>,
  hasManyRelations?: HasManyRelationSet,
): Map<string, FieldRef> {
  const map = new Map<string, FieldRef>()

  for (const column of columns) {
    map.set(column.id, resolveFieldRef(column, hasManyRelations))
  }

  return map
}
