// @bazza-ui/data-view — Serialization
// serializeView and deserializeView utilities.

import type { ColumnType } from '../core/column-types.js'
import type { DataViewState, FilterModel } from '../core/types.js'

// ── Types ───────────────────────────────────────────────────

/**
 * Options for serialization/deserialization.
 * The `columnTypes` map is used to call `serialize`/`deserialize` on filter values
 * for types that need special handling (Date, BigInt, custom types).
 */
export interface SerializeOptions {
  /**
   * Map of column type IDs to their ColumnType definitions.
   * Used to look up `serialize`/`deserialize` functions for filter values.
   *
   * @example
   * ```typescript
   * import { builtInColumnTypes } from '@bazza-ui/data-view'
   * serializeView(view, { columnTypes: builtInColumnTypes })
   * ```
   */
  columnTypes?: Record<string, ColumnType<any>>
}

// ── Serialize ───────────────────────────────────────────────

/**
 * Serializes a `DataViewState` to a URL-safe base64 string.
 *
 * Filter values for types with a `serialize` function (Date, BigInt, custom)
 * are converted to their serialized form before encoding.
 *
 * @example
 * ```typescript
 * import { serializeView, builtInColumnTypes } from '@bazza-ui/data-view'
 * const encoded = serializeView(view, { columnTypes: builtInColumnTypes })
 * // Use as a URL query param: ?view=<encoded>
 * ```
 */
export function serializeView(
  view: DataViewState,
  options?: SerializeOptions,
): string {
  const columnTypes = options?.columnTypes

  const serializable: DataViewState = {
    ...view,
    filters: view.filters.map((filter) => {
      const colType = columnTypes?.[filter.type]
      if (!colType?.serialize) return filter

      return {
        ...filter,
        values: filter.values.map((v) => colType.serialize!(v)),
      }
    }),
    // Sort is already JSON-safe (strings, booleans)
    sort: [...view.sort],
    // Meta is passed through as-is (should be JSON-safe)
    ...(view.meta !== undefined ? { meta: view.meta } : {}),
  }

  const json = JSON.stringify(serializable)
  // btoa-safe: encode to base64, then make URL-safe
  const base64 = btoa(encodeURIComponent(json))
  return base64
}

// ── Deserialize ─────────────────────────────────────────────

/**
 * Deserializes a URL-safe base64 string back to a `DataViewState`.
 *
 * Filter values for types with a `deserialize` function (Date, BigInt, custom)
 * are converted back from their serialized form.
 *
 * Returns `null` if the input is malformed or cannot be parsed.
 *
 * @example
 * ```typescript
 * import { deserializeView, builtInColumnTypes } from '@bazza-ui/data-view'
 * const view = deserializeView(encoded, { columnTypes: builtInColumnTypes })
 * if (view) {
 *   // Use view
 * }
 * ```
 */
export function deserializeView(
  encoded: string,
  options?: SerializeOptions,
): DataViewState | null {
  try {
    const json = decodeURIComponent(atob(encoded))
    const parsed = JSON.parse(json) as DataViewState

    // Basic structural validation
    if (!parsed || typeof parsed !== 'object') return null
    if (!Array.isArray(parsed.filters)) return null
    if (!Array.isArray(parsed.sort)) return null

    const columnTypes = options?.columnTypes

    const view: DataViewState = {
      ...parsed,
      filters: parsed.filters.map((filter: FilterModel) => {
        const colType = columnTypes?.[filter.type]
        if (!colType?.deserialize) return filter

        return {
          ...filter,
          values: filter.values.map((v) => colType.deserialize!(v)),
        }
      }),
      sort: parsed.sort,
    }

    return view
  } catch {
    return null
  }
}
