import type * as React from 'react'

/**
 * A single entry in the array form of the `items` prop passed to
 * `Select.Root` / `Combobox.Root`.
 */
export interface ItemsEntry {
  /**
   * The item's value.
   *
   * Use `null` to describe a clearable/placeholder item (its label is used as
   * the trigger placeholder and selecting it clears the value).
   */
  value: string | null
  /** The label to display for this item. */
  label: React.ReactNode
  /**
   * Additional keywords to match against when filtering, on top of the label.
   * Useful for aliases or synonyms.
   */
  keywords?: string[]
}

/**
 * Data structure describing the items rendered in a Select/Combobox popup.
 *
 * Either a record mapping a value to its label, or an array of entries. Only
 * the array form can express `keywords` or a `null` (clearable) value.
 */
export type Items = Record<string, React.ReactNode> | Array<ItemsEntry>

/**
 * The resolved metadata for a single item looked up from the `items` prop.
 */
export interface ResolvedItem {
  label: React.ReactNode
  keywords?: string[]
}

/** Serialize an entry value to the string key used for registry lookups. */
function entryKey(value: string | null): string {
  return value == null ? '' : value
}

/**
 * Resolve the full entry (label + keywords) from the `items` prop for a given
 * serialized value key. Returns `undefined` when there is no match.
 */
export function resolveItemFromItems(
  items: Items | undefined,
  valueKey: string,
): ResolvedItem | undefined {
  if (!items) return undefined

  if (Array.isArray(items)) {
    const entry = items.find((i) => entryKey(i.value) === valueKey)
    if (!entry) return undefined
    return { label: entry.label, keywords: entry.keywords }
  }

  const label = items[valueKey]
  if (label === undefined) return undefined
  return { label }
}

/**
 * Resolve just the label from the `items` prop for a given serialized value
 * key. Returns `undefined` when there is no match.
 */
export function resolveLabelFromItems(
  items: Items | undefined,
  valueKey: string,
): React.ReactNode | undefined {
  return resolveItemFromItems(items, valueKey)?.label
}

/**
 * Merge a set of extra keyword strings into an existing keywords array,
 * preserving order and removing duplicates. Returns the original `keywords`
 * reference untouched when there is nothing to add.
 */
export function mergeKeywords(
  keywords: string[] | undefined,
  extra: Array<string | undefined>,
): string[] | undefined {
  const additions = extra.filter((k): k is string => Boolean(k))
  if (additions.length === 0) return keywords

  const merged = keywords ? [...keywords] : []
  for (const keyword of additions) {
    if (!merged.includes(keyword)) merged.push(keyword)
  }
  return merged
}
