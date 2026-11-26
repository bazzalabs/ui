import { computePositions } from './positions.js'
import {
  type CollectionSnapshot,
  type ContainerRowMeta,
  type ItemRowMeta,
  isItemRow,
  type RowId,
  type RowMeta,
  type SnapshotInput,
  type SnapshotOptions,
} from './types.js'

const noPositions: ReadonlyMap<RowId, number> = new Map()

/** The Collection of a surface with no rows yet: version 0. */
export const emptyCollection: CollectionSnapshot = {
  version: 0,
  rows: new Map(),
  orderedIds: [],
  navOrder: [],
  visible: new Set(),
  visibleContainers: new Set(),
  positions: new Map(),
  scores: new Map(),
}

/**
 * Builds a surface's Collection from what its adapter supplies.
 *
 * A row is visible unless `hidden` names it or its Container (a Container's
 * row id is the id its rows name as `containerId`) is hidden. A
 * `containerId` with no Container row before it doesn't hide anything.
 *
 * `version` is `previous.version + 1`. A build that comes out equal to
 * `previous` (same rows in the same order, same visibility, same scores)
 * returns `previous` itself, so a store can skip notifying on identity and
 * `version` only counts real changes.
 */
export function buildSnapshot(
  input: SnapshotInput,
  previous: CollectionSnapshot = emptyCollection,
  options: SnapshotOptions = {},
): CollectionSnapshot {
  return build(
    input,
    previous,
    options.positions === false ? null : computePositions,
  )
}

/**
 * `buildSnapshot` with `positions` left empty, for a caller that works
 * positions out another way. It doesn't reference `computePositions`, so a
 * bundle that only uses it leaves that out.
 */
export function buildSnapshotWithoutPositions(
  input: SnapshotInput,
  previous: CollectionSnapshot = emptyCollection,
): CollectionSnapshot {
  return build(input, previous, null)
}

function build(
  input: SnapshotInput,
  previous: CollectionSnapshot,
  positionsOf: typeof computePositions | null,
): CollectionSnapshot {
  const { hidden, scores: inputScores } = input
  const rows = new Map<RowId, RowMeta>()
  const orderedIds: RowId[] = []
  const visible = new Set<RowId>()
  const scores = new Map<RowId, number>()
  // Whether each Container shows, recorded as its row goes by.
  const containerShows = new Map<string, boolean>()

  for (const row of input.rows) {
    if (rows.has(row.id)) continue
    rows.set(row.id, row)
    orderedIds.push(row.id)
    const shows =
      !hidden?.has(row.id) &&
      (row.containerId === undefined ||
        containerShows.get(row.containerId) !== false)
    if (row.kind === 'container') containerShows.set(row.id, shows)
    if (shows) visible.add(row.id)
    if (isItemRow(row)) {
      scores.set(row.id, shows ? (inputScores?.get(row.id) ?? 1) : 0)
    }
  }

  if (isUnchanged(previous, rows, orderedIds, visible, scores)) return previous

  const visibleOrder: RowId[] = []
  const navOrder: RowId[] = []
  const visibleContainers = new Set<string>()
  for (const id of orderedIds) {
    if (!visible.has(id)) continue
    visibleOrder.push(id)
    const row = rows.get(id)!
    if (row.kind === 'container') visibleContainers.add(id)
    else if (isItemRow(row) && !row.disabled) navOrder.push(id)
  }

  return {
    version: previous.version + 1,
    rows,
    orderedIds,
    navOrder,
    visible,
    visibleContainers,
    positions: positionsOf ? positionsOf(visibleOrder, rows) : noPositions,
    scores,
  }
}

function isUnchanged(
  previous: CollectionSnapshot,
  rows: ReadonlyMap<RowId, RowMeta>,
  orderedIds: readonly RowId[],
  visible: ReadonlySet<RowId>,
  scores: ReadonlyMap<RowId, number>,
): boolean {
  if (
    previous.orderedIds.length !== orderedIds.length ||
    previous.visible.size !== visible.size ||
    previous.scores.size !== scores.size
  ) {
    return false
  }
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i]!
    if (previous.orderedIds[i] !== id) return false
    const before = previous.rows.get(id)
    if (!before || !rowMetaEqual(before, rows.get(id)!)) return false
    if (previous.visible.has(id) !== visible.has(id)) return false
    if (previous.scores.get(id) !== scores.get(id)) return false
  }
  return true
}

/** Whether two row metas say the same thing, field by field. */
function rowMetaEqual(a: RowMeta, b: RowMeta): boolean {
  if (a === b) return true
  if (a.id !== b.id || a.kind !== b.kind || a.containerId !== b.containerId) {
    return false
  }
  if (a.kind === 'container') {
    return a.selection === (b as ContainerRowMeta).selection
  }
  if (!isItemRow(a)) return true
  const other = b as ItemRowMeta
  return (
    a.textValue === other.textValue &&
    a.disabled === other.disabled &&
    a.activatable === other.activatable &&
    a.closeOnClick === other.closeOnClick &&
    a.forceOrder === other.forceOrder &&
    a.forceScore === other.forceScore &&
    a.shortcut === other.shortcut &&
    keywordsEqual(a.keywords, other.keywords)
  )
}

function keywordsEqual(
  a: readonly string[] | undefined,
  b: readonly string[] | undefined,
): boolean {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}
