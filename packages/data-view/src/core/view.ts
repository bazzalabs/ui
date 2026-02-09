// @bazza-ui/data-view — View Operations
// Pure view state transition functions.

import type {
  DataViewState,
  DataViewStateMeta,
  FiltersState,
  SortState,
} from './types.js'

/** Default empty view state. */
const EMPTY_VIEW: DataViewState = { filters: [], sort: [] }

// ── Merge Helpers ───────────────────────────────────────────

/**
 * Merges base filters with override filters.
 *
 * - Concatenates both arrays.
 * - If the same `columnId` appears in both, the **override wins** (replaces the base entry).
 * - Order: base filters first (excluding overridden), then all override filters.
 */
export function mergeFilters(
  base: FiltersState,
  overrides: FiltersState,
): FiltersState {
  if (overrides.length === 0) return base
  if (base.length === 0) return overrides

  const overrideColumnIds = new Set(overrides.map((f) => f.columnId))
  const baseWithoutOverridden = base.filter(
    (f) => !overrideColumnIds.has(f.columnId),
  )

  return [...baseWithoutOverridden, ...overrides]
}

/**
 * Merges base sort with override sort.
 *
 * - If overrides sort is non-empty, it wins entirely.
 * - Otherwise, falls back to base sort.
 * - No interleaving.
 */
export function mergeSort(base: SortState, overrides: SortState): SortState {
  return overrides.length > 0 ? overrides : base
}

// ── View Operations ─────────────────────────────────────────

/**
 * Pure view state operations.
 *
 * Every method returns a **new** `DataViewState` — no mutations.
 */
export const viewOperations = {
  /**
   * Loads a complete view state, replacing the current one.
   */
  load(view: DataViewState): DataViewState {
    return view
  },

  /**
   * Creates a snapshot of the current view state with optional metadata.
   * Returns a new object (shallow copy) — safe for storing as a "saved view".
   */
  snapshot(
    current: DataViewState,
    overrides?: { id?: string; name?: string; meta?: DataViewStateMeta },
  ): DataViewState {
    return {
      ...current,
      // Shallow-copy arrays so the snapshot is independent
      filters: [...current.filters],
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

  /**
   * Resets the view state to the provided default, or to an empty state.
   */
  reset(defaultView?: DataViewState): DataViewState {
    if (defaultView) {
      return {
        ...defaultView,
        filters: [...defaultView.filters],
        sort: [...defaultView.sort],
      }
    }
    return { ...EMPTY_VIEW, filters: [], sort: [] }
  },

  /**
   * Merges a partial update into the current view state.
   *
   * - `filters` and `sort` are replaced entirely (not deep-merged).
   * - `id` and `name` are updated if provided.
   * - Unspecified properties are preserved from the current state.
   */
  merge(
    current: DataViewState,
    partial: Partial<DataViewState>,
  ): DataViewState {
    return {
      ...current,
      ...(partial.filters !== undefined ? { filters: partial.filters } : {}),
      ...(partial.sort !== undefined ? { sort: partial.sort } : {}),
      ...(partial.id !== undefined ? { id: partial.id } : {}),
      ...(partial.name !== undefined ? { name: partial.name } : {}),
      ...(partial.meta !== undefined
        ? { meta: { ...current.meta, ...partial.meta } }
        : {}),
    }
  },
}
