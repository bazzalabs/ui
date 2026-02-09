// @bazza-ui/data-view — Server Query AST
// JSON-serializable intermediate representation for server-side query generation.
// This is the "protocol" between the data-view state and ORM adapters.

import type { ColumnDataType } from '../core/types.js'

// ── JSON-Safe Values ────────────────────────────────────────

/**
 * Values that survive `JSON.stringify` → `JSON.parse` round-trips.
 * Date → ISO string, BigInt → string. Adapters deserialize as needed.
 */
export type JsonSafeValue = string | number | boolean | null

// ── Field References ────────────────────────────────────────

/** A direct column on the source table. */
export type DirectFieldPath = {
  kind: 'direct'
  /** The DB column name (e.g. 'title', 'created_at'). */
  column: string
}

/**
 * A field accessed through a belongs-to / has-one relation.
 * Adapters generate a JOIN to resolve this.
 */
export type BelongsToFieldPath = {
  kind: 'belongsTo'
  /** Logical relation name (e.g. 'status', 'assignee'). */
  relation: string
  /** The column on the related table (e.g. 'name', 'email'). */
  column: string
}

/**
 * A field accessed through a has-many or many-to-many relation.
 * Adapters generate an EXISTS subquery to resolve this.
 */
export type HasManyFieldPath = {
  kind: 'hasMany'
  /** Logical relation name (e.g. 'labels', 'comments'). */
  relation: string
  /** The column on the related table (e.g. 'name'). */
  column: string
}

/** Discriminated union of all field path types. */
export type FieldPath = DirectFieldPath | BelongsToFieldPath | HasManyFieldPath

/**
 * A fully resolved field reference in the query AST.
 * Maps a frontend column ID to its backend location.
 */
export type FieldRef = {
  /** The frontend column ID (from `ColumnConfig.id`). */
  columnId: string
  /** The column data type (for value coercion by adapters). */
  type: ColumnDataType
  /** How to reach this field (direct, through a relation, etc.). */
  path: FieldPath
}

// ── Comparison Operators ────────────────────────────────────

/**
 * Comparison operators that map to SQL/ORM operations.
 * Adapters translate these to database-specific syntax.
 */
export type ComparisonOp =
  | 'eq' // =
  | 'neq' // != / <>
  | 'gt' // >
  | 'gte' // >=
  | 'lt' // <
  | 'lte' // <=
  | 'like' // LIKE (case-sensitive)
  | 'ilike' // ILIKE (case-insensitive, PG) / LIKE (MySQL/SQLite)
  | 'notLike' // NOT LIKE
  | 'notIlike' // NOT ILIKE
  | 'in' // IN (...)
  | 'notIn' // NOT IN (...)
  | 'between' // BETWEEN x AND y
  | 'notBetween' // NOT BETWEEN x AND y
  | 'arrayContains' // array @> (PG) / JSON_CONTAINS (MySQL)
  | 'arrayOverlaps' // array && (PG) / JSON_OVERLAPS (MySQL)
  | 'isNull' // IS NULL
  | 'isNotNull' // IS NOT NULL

// ── Condition Nodes ─────────────────────────────────────────

/** A single comparison: field <op> value(s). */
export type ComparisonCondition = {
  kind: 'comparison'
  field: FieldRef
  op: ComparisonOp
  /** Serialized values — always JSON-safe (no Date objects, no BigInt). */
  value: JsonSafeValue | JsonSafeValue[]
}

/** Logical AND / OR combinator. */
export type LogicalCondition = {
  kind: 'and' | 'or'
  conditions: Condition[]
}

/** Logical NOT wrapper. */
export type NotCondition = {
  kind: 'not'
  condition: Condition
}

/** The union of all condition node types. */
export type Condition = ComparisonCondition | LogicalCondition | NotCondition

// ── Sort Nodes ──────────────────────────────────────────────

/** A single sort rule in the query. */
export type SortNode = {
  field: FieldRef
  direction: 'asc' | 'desc'
  /** Where to place NULL values. Defaults to 'last'. */
  nulls?: 'first' | 'last'
}

// ── Pagination Nodes ────────────────────────────────────────

/** Traditional offset-based pagination. */
export type OffsetPagination = {
  kind: 'offset'
  /** Zero-based offset (e.g. page 2, pageSize 25 → offset 25). */
  offset: number
  /** Maximum number of rows to return. */
  limit: number
}

/** Cursor-based pagination (Relay-style). */
export type CursorPagination = {
  kind: 'cursor'
  /** The cursor to start from. `null` for the first page. */
  cursor: string | null
  /** Maximum number of rows to return. */
  limit: number
  /** Direction of traversal. */
  direction: 'forward' | 'backward'
}

/** Discriminated union of pagination strategies. */
export type PaginationNode = OffsetPagination | CursorPagination

// ── Search Node ─────────────────────────────────────────────

/** Full-text or pattern-based search across multiple fields. */
export type SearchNode = {
  /** The search query string. */
  query: string
  /** Which fields to search across. */
  fields: FieldRef[]
  /**
   * Search mode:
   * - `'contains'` — ILIKE/LIKE pattern matching (portable, no index required).
   * - `'fulltext'` — native full-text search (PG tsvector, MySQL FULLTEXT, etc.).
   */
  mode: 'contains' | 'fulltext'
}

// ── Complete Query AST ──────────────────────────────────────

/**
 * The complete, JSON-serializable query AST.
 * This is the intermediary between `DataViewState` and ORM-specific query code.
 *
 * Adapters consume this via the `QueryAdapter` interface.
 */
export type DataViewQueryAST = {
  /** Filter conditions (WHERE clause). `null` means no filtering. */
  where: Condition | null
  /** Sort rules (ORDER BY clause). Empty array means no sorting. */
  orderBy: SortNode[]
  /** Pagination (LIMIT/OFFSET or cursor). `null` means no pagination. */
  pagination: PaginationNode | null
  /** Search across fields. `null` means no search. */
  search: SearchNode | null
}
