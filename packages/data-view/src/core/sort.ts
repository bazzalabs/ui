// @bazza-ui/data-view — Sort Operations
// Pure sort state transition functions.

import type {
  ColumnSort,
  CustomSort,
  SortDirection,
  SortState,
} from './types.js'

// ── Type Guards ─────────────────────────────────────────────

function isColumnSort(rule: { type: string }): rule is ColumnSort {
  return rule.type === 'column'
}

function isCustomSort(rule: { type: string }): rule is CustomSort {
  return rule.type === 'custom'
}

// ── Sort Cycle ──────────────────────────────────────────────

/**
 * Default sort cycle: none → desc → asc → none.
 * Given the current direction (or undefined for "none"), returns the next.
 */
function nextDirection(
  current: SortDirection | undefined,
  defaultDirection: SortDirection = 'desc',
): SortDirection | undefined {
  if (current === undefined) return defaultDirection
  if (current === 'desc') return 'asc'
  // current === 'asc'
  return undefined // remove
}

// ── Operations ──────────────────────────────────────────────

/**
 * Pure sort state operations.
 *
 * Every method takes the current `SortState` (and arguments) and
 * returns a **new** `SortState` — no mutations.
 */
export const sortOperations = {
  /**
   * Toggles a column sort through the cycle: none → desc → asc → none.
   *
   * - If the column has no existing sort rule, adds one with `desc`.
   * - If the column is currently `desc`, switches to `asc`.
   * - If the column is currently `asc`, removes the sort rule.
   * - Preserves all other sort rules (including custom sorts) in their positions.
   *
   * @param defaultDirection - Starting direction when toggling from "none". Defaults to 'desc'.
   */
  toggleColumnSort(
    sort: SortState,
    columnId: string,
    defaultDirection: SortDirection = 'desc',
  ): SortState {
    const existingIndex = sort.findIndex(
      (r) => isColumnSort(r) && r.columnId === columnId,
    )

    if (existingIndex === -1) {
      // No existing rule — add at the end
      return [
        ...sort,
        { type: 'column', columnId, direction: defaultDirection },
      ]
    }

    const existing = sort[existingIndex] as ColumnSort
    const next = nextDirection(existing.direction, defaultDirection)

    if (next === undefined) {
      // Remove the sort rule
      return sort.filter((_, i) => i !== existingIndex)
    }

    // Update direction in place
    return sort.map((r, i) =>
      i === existingIndex
        ? { type: 'column' as const, columnId, direction: next }
        : r,
    )
  },

  /**
   * Sets or removes a custom sort rule.
   *
   * - `enabled: true` — adds or updates the custom sort rule.
   * - `enabled: false` — removes the custom sort rule.
   * - Preserves all other sort rules (including column sorts) in their positions.
   */
  setCustomSort(sort: SortState, id: string, enabled: boolean): SortState {
    const existingIndex = sort.findIndex((r) => isCustomSort(r) && r.id === id)

    if (!enabled) {
      // Remove the custom sort
      if (existingIndex === -1) return sort
      return sort.filter((_, i) => i !== existingIndex)
    }

    // Add or update
    if (existingIndex === -1) {
      return [...sort, { type: 'custom', id, enabled: true }]
    }

    return sort.map((r, i) =>
      i === existingIndex ? { type: 'custom' as const, id, enabled: true } : r,
    )
  },

  /**
   * Full replacement of the sort state.
   */
  setSort(newSort: SortState): SortState {
    return newSort
  },

  /**
   * Clears all sort rules.
   */
  clearSort(): SortState {
    return []
  },
}
