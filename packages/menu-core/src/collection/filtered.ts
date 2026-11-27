// The rows of a surface whose store filters them itself, for `buildSnapshot`:
// the DOM adapter's (composable JSX rows that register) and the Virtual
// adapter's (an `items` array, mounted or not). Each item row is scored
// against the search, and a Container shows while any row in it, or in a
// Container inside it, does.

import type { FilterFn } from '../text/filter.js'
import type {
  ContainerRowMeta,
  ItemRowMeta,
  RowId,
  RowMeta,
  SnapshotInput,
} from './types.js'

export interface FilteredCollectionInput {
  /** The item rows, each naming its Container as `containerId`. */
  items: readonly ItemRowMeta[]
  /** The Containers the rows can be in. */
  containers: Iterable<string>
  /** The Container around each nested one. */
  containerParents: ReadonlyMap<string, string>
  /** The normalized search. Empty while browsing. */
  search: string
  /** How a row scores against the search; `false` shows every row. */
  filter: FilterFn | false
}

/**
 * `buildSnapshot`'s input for rows the store filters: the Container rows,
 * then the item rows in the order given. While browsing, or with no filter,
 * every row shows and scores 1. While searching, a row scores its
 * `forceScore`, else `filter(textValue, search, keywords)`, and shows when
 * that's positive; a Container shows when a row in it shows, and so does
 * every Container around it. A Container no row names stays hidden.
 */
export function filteredSnapshotInput(
  input: FilteredCollectionInput,
): SnapshotInput & { rows: RowMeta[] } {
  const { items, containers, containerParents, search, filter } = input
  const searching = Boolean(search) && filter !== false
  const scores = new Map<RowId, number>()
  const hidden = new Set<RowId>()
  const visibleContainers = new Set<string>(searching ? [] : containers)
  if (searching) {
    for (const row of items) {
      const score =
        row.forceScore ??
        (filter as FilterFn)(
          row.textValue,
          search,
          row.keywords as string[] | undefined,
        )
      scores.set(row.id, score)
      if (score > 0) {
        let containerId = row.containerId
        while (containerId && !visibleContainers.has(containerId)) {
          visibleContainers.add(containerId)
          containerId = containerParents.get(containerId)
        }
      } else hidden.add(row.id)
    }
  }

  const rows: RowMeta[] = []
  for (const id of new Set([...containers, ...visibleContainers])) {
    const row: ContainerRowMeta = { id, kind: 'container', selection: 'none' }
    rows.push(row)
    if (!visibleContainers.has(id)) hidden.add(id)
  }
  for (const row of items) rows.push(row)
  return { rows, hidden, scores }
}
