// The Data adapter: a data-first surface's Collection, read from the Display
// Nodes its pipeline already filtered, scored and sorted. Its rows never
// register, and it neither filters nor sorts again.

import type {
  PipelineDisplayNode,
  PipelineDisplayRowNode,
  PipelineMenuNode,
} from '../data/types.js'
import { selectionOf } from '../tree/container.js'
import type { AnyMenuNode } from '../tree/menu-node.js'
import type { AnyNodeDefTypes, RowNodeDef } from '../tree/node-def-map.js'
import { buildSnapshot } from './snapshot.js'
import type {
  CollectionSnapshot,
  ItemRowKind,
  RowId,
  RowMeta,
  SnapshotInput,
  SnapshotOptions,
} from './types.js'

export interface DataCollectionInput<
  N extends PipelineMenuNode<N> = AnyMenuNode,
> {
  /** The surface's Display Nodes, as the pipeline filtered, scored and sorted them. */
  displayNodes: readonly PipelineDisplayNode<N>[]
  /**
   * The surface's browse Display Nodes (no query): every row it has. Those
   * `displayNodes` leaves out stay in the Collection, hidden, after the
   * visible rows. While browsing, pass the same nodes as `displayNodes`.
   */
  browseNodes: readonly PipelineDisplayNode<N>[]
}

const itemKindOf: Readonly<Record<RowNodeDef['kind'], ItemRowKind>> = {
  item: 'item',
  'link-item': 'link',
  'checkbox-item': 'checkbox',
  'radio-item': 'radio',
  submenu: 'submenu-trigger',
  subpage: 'subpage-trigger',
  'tree-item': 'tree',
}

/**
 * Whether a row closes the menu when its def doesn't say, as the JSX part
 * that renders it defaults: an item or tree row does; a link, checkbox or
 * radio row doesn't; a submenu or subpage trigger never does.
 */
const closesByDefault: Readonly<Record<RowNodeDef['kind'], boolean>> = {
  item: true,
  'link-item': false,
  'checkbox-item': false,
  'radio-item': false,
  submenu: false,
  subpage: false,
  'tree-item': true,
}

/**
 * The rows of a data-first surface, for `buildSnapshot`. Rows come in
 * Display Node order: a Container's row, then its rows (each naming it as
 * `containerId`); separators are rows too. A row is disabled when its render
 * context says so (its own `disabled` or one inherited from a disabled
 * branch), and scores its context's search score, or 1 while browsing. A
 * header tree row (`selectable: false`) isn't activatable but is navigated
 * to, as data-first does today.
 *
 * The caller can add rows the Display Nodes don't hold, such as a loading
 * row after them, before building.
 */
export function dataSnapshotInput<N extends PipelineMenuNode<N> = AnyMenuNode>(
  input: DataCollectionInput<N>,
): SnapshotInput & { rows: RowMeta[]; hidden: ReadonlySet<RowId> } {
  const { displayNodes, browseNodes } = input
  const rows: RowMeta[] = []
  const scores = new Map<RowId, number>()
  const seen = new Set<RowId>()

  appendRows(displayNodes, rows, scores, seen)
  const hidden = new Set<RowId>()
  const start = rows.length
  appendRows(browseNodes, rows, null, seen)
  for (let i = start; i < rows.length; i++) hidden.add(rows[i]!.id)
  return { rows, hidden, scores }
}

/** `buildSnapshot` over `dataSnapshotInput`. */
export function buildDataSnapshot<N extends PipelineMenuNode<N> = AnyMenuNode>(
  input: DataCollectionInput<N>,
  previous?: CollectionSnapshot,
  options?: SnapshotOptions,
): CollectionSnapshot {
  return buildSnapshot(dataSnapshotInput(input), previous, options)
}

function appendRows<N extends PipelineMenuNode<N>>(
  nodes: readonly PipelineDisplayNode<N>[],
  rows: RowMeta[],
  scores: Map<RowId, number> | null,
  seen: Set<RowId>,
): void {
  // First wins: an id the pipeline shows twice is one row.
  const add = (row: RowMeta) => {
    if (seen.has(row.id)) return false
    seen.add(row.id)
    rows.push(row)
    return true
  }

  for (const node of nodes) {
    switch (node.kind) {
      case 'row':
        appendItemRow(node, undefined, add, scores)
        break
      case 'separator':
        add({ id: node.node.id, kind: 'separator' })
        break
      default: {
        const containerId = node.node.id
        add({
          id: containerId,
          kind: 'container',
          selection: selectionOf(node.kind),
        })
        for (const row of node.items) {
          appendItemRow(row, containerId, add, scores)
        }
      }
    }
  }
}

function appendItemRow<N extends PipelineMenuNode<N>>(
  row: PipelineDisplayRowNode<N>,
  containerId: string | undefined,
  add: (row: RowMeta) => boolean,
  scores: Map<RowId, number> | null,
): void {
  const def = row.node.def as RowNodeDef<AnyNodeDefTypes>
  const added = add({
    id: row.node.id,
    kind: itemKindOf[def.kind],
    textValue: def.value,
    keywords: def.keywords,
    containerId,
    disabled: row.context.disabled,
    activatable: def.kind !== 'tree-item' || def.selectable !== false,
    closeOnClick:
      'closeOnClick' in def && def.closeOnClick !== undefined
        ? def.closeOnClick
        : closesByDefault[def.kind],
    forceOrder: def.forceOrder,
    forceScore: def.forceScore,
    shortcut: 'shortcut' in def ? def.shortcut : undefined,
  })
  if (added && scores && row.context.search) {
    scores.set(row.node.id, row.context.search.score)
  }
}
