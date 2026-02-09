// @bazza-ui/data-view — Query Adapter Interface
// Abstract interface that ORM adapters implement.

import type { DataViewQueryAST } from './ast.js'

/**
 * The result of applying a data-view query.
 */
export interface DataViewResult<TData> {
  /** The rows matching the query. */
  data: TData[]
  /** Total count of matching rows (before pagination). */
  totalCount: number
}

/**
 * Abstract interface that ORM adapters implement.
 *
 * `TQuery` is the ORM's query builder type (e.g., Drizzle's `PgSelect`).
 * Each method takes the current query and returns a modified copy.
 *
 * Adapters are not required to implement this interface directly —
 * they may expose a simpler `applyDataView()` function instead.
 * This interface exists for consumers who need fine-grained control.
 */
export interface QueryAdapter<TQuery> {
  /**
   * Applies all parts of the AST to a query in the correct order:
   * JOINs → WHERE → search → ORDER BY → pagination.
   */
  applyAll(query: TQuery, ast: DataViewQueryAST): TQuery
}
