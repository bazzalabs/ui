import { isItemRow, Pos, type RowId, type RowMeta } from './types.js'

/**
 * The `Pos` bitmask of each row in `visibleOrder`: every visible row in order,
 * each one a key of `rows`, structural rows and disabled rows included (they take positions though
 * navigation skips them). Every row in `visibleOrder` gets an entry, 0 when
 * it's at no edge. One pass over the rows, then one write per edge.
 *
 * The rules are `getRowPositions` in `ListboxStore`: a Container's row,
 * separators, empty and loading rows never count as inside a Container,
 * whatever `containerId` they carry, because they register without a group.
 */
export function computePositions(
  visibleOrder: readonly RowId[],
  rows: ReadonlyMap<RowId, RowMeta>,
): Map<RowId, number> {
  const positions = new Map<RowId, number>()
  let first: RowId | undefined
  let last: RowId | undefined
  let firstContainer: RowId | undefined
  let lastContainer: RowId | undefined
  const firstInContainer = new Map<string, RowId>()
  const lastInContainer = new Map<string, RowId>()

  for (const id of visibleOrder) {
    positions.set(id, 0)
    const row = rows.get(id)!
    const containerId = isItemRow(row) ? row.containerId : undefined
    if (containerId === undefined) {
      first ??= id
      last = id
    }
    if (row.kind === 'container') {
      firstContainer ??= id
      lastContainer = id
    }
    if (containerId) {
      if (!firstInContainer.has(containerId)) {
        firstInContainer.set(containerId, id)
      }
      lastInContainer.set(containerId, id)
    }
  }

  const mark = (id: RowId | undefined, bit: Pos) => {
    if (id !== undefined) positions.set(id, (positions.get(id) ?? 0) | bit)
  }
  mark(first, Pos.First)
  mark(last, Pos.Last)
  mark(firstContainer, Pos.FirstContainer)
  mark(lastContainer, Pos.LastContainer)
  for (const id of firstInContainer.values()) mark(id, Pos.FirstInContainer)
  for (const id of lastInContainer.values()) mark(id, Pos.LastInContainer)

  return positions
}
