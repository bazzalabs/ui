// The Collection: a surface's immutable snapshot of its rows. Every way rows
// reach a surface (composable JSX, data-first Display Nodes, a virtualized
// `items` array) builds the same snapshot through a Collection Adapter, and
// the list reads order, visibility, positions and scores from it.

import type { ContainerSelection } from '../tree/container.js'

/** A row's identity in its Collection: its Resolved ID or registration id. */
export type RowId = string

/** The kinds of row the list highlights and activates. */
export type ItemRowKind =
  | 'item'
  | 'link'
  | 'checkbox'
  | 'radio'
  | 'submenu-trigger'
  | 'subpage-trigger'
  | 'subpage-back'
  | 'tree'

/**
 * A row the list can highlight and activate: what the store reads from an
 * item's registration (`ItemRegistration` in `ListboxStore`). Whether it's a
 * submenu trigger (`isSubmenuTrigger`) is its `kind`.
 */
export interface ItemRowMeta {
  id: RowId
  kind: ItemRowKind
  /** The text a search matches. */
  textValue: string
  keywords?: readonly string[]
  /** The Container the row is in, when it's in one. */
  containerId?: string
  /** Disabled rows show and take positions, but navigation skips them. */
  disabled: boolean
  /**
   * Whether Enter or a click activates the row. A row that isn't activatable
   * (a header tree row) still shows, takes positions and is navigated to.
   */
  activatable: boolean
  /** Whether activating the row closes the menu. */
  closeOnClick: boolean
  forceOrder?: number
  forceScore?: number
  shortcut?: string
}

/** A Container's own row: the element a group, radio or checkbox group renders. */
export interface ContainerRowMeta {
  id: RowId
  kind: 'container'
  selection: ContainerSelection
  /**
   * The Container around this one, when it's nested. Only visibility reads
   * it: a nested Container's row counts as a row outside any Container for
   * `Pos.First` and `Pos.Last`, as it does today.
   */
  containerId?: string
}

/** A separator, empty or loading row. */
export interface PlainStructuralRowMeta {
  id: RowId
  kind: 'separator' | 'empty' | 'loading'
  /**
   * The Container the row sits in. Only visibility reads it: the row counts
   * as a row outside any Container for `Pos.First` and `Pos.Last`.
   */
  containerId?: string
}

/** What the Collection knows about one row. */
export type RowMeta = ItemRowMeta | ContainerRowMeta | PlainStructuralRowMeta

/** Whether a row is one the list can highlight and activate. */
export function isItemRow(row: RowMeta): row is ItemRowMeta {
  switch (row.kind) {
    case 'container':
    case 'separator':
    case 'empty':
    case 'loading':
      return false
    default:
      return true
  }
}

/**
 * Positional bits, one bitmask per visible row (`CollectionSnapshot.positions`).
 *
 * - `First` / `Last`: the first and last visible row outside any Container.
 *   A Container's own row, separators, empty and loading rows always count
 *   as outside one; item rows inside a Container never do.
 * - `FirstInContainer` / `LastInContainer`: the first and last visible item
 *   row of each Container.
 * - `FirstContainer` / `LastContainer`: the first and last visible Container
 *   row.
 */
export const Pos = {
  First: 1,
  Last: 2,
  FirstInContainer: 4,
  LastInContainer: 8,
  FirstContainer: 16,
  LastContainer: 32,
} as const

export type Pos = (typeof Pos)[keyof typeof Pos]

/** A surface's rows at one moment. Never mutated: each change is a new snapshot. */
export interface CollectionSnapshot {
  /** Counts distinct snapshots: each build that changes anything adds one. */
  readonly version: number
  /** Every row, hidden ones included. */
  readonly rows: ReadonlyMap<RowId, RowMeta>
  /** Every row in order, rows a search hides included. */
  readonly orderedIds: readonly RowId[]
  /** Visible, enabled item rows in navigation order. */
  readonly navOrder: readonly RowId[]
  /** Every visible row, structural rows included. */
  readonly visible: ReadonlySet<RowId>
  /** The ids of the visible Containers. */
  readonly visibleContainers: ReadonlySet<string>
  /** The `Pos` bitmask of each visible row; 0 for a row at no edge. */
  readonly positions: ReadonlyMap<RowId, number>
  /**
   * The search score of every item row, for ordering only. `visible` alone
   * decides whether a row shows: a visible row can score 0 (a
   * `preserve-show-all` Container shows its rows that don't match). Hidden
   * rows score 0.
   */
  readonly scores: ReadonlyMap<RowId, number>
}

/** What a Collection Adapter hands `buildSnapshot`. */
export interface SnapshotInput {
  /**
   * Every row in order, each once. A Container's row comes before the rows
   * in it, as it does in any tree order.
   */
  rows: readonly RowMeta[]
  /**
   * Rows that don't show, such as those a search hides. They stay in `rows`
   * and `orderedIds`. A row in a hidden Container is hidden too.
   */
  hidden?: ReadonlySet<RowId>
  /**
   * Visible item rows' search scores, for ordering only: they never hide a
   * row. A visible row without one scores 1, as every row does with no
   * search.
   */
  scores?: ReadonlyMap<RowId, number>
}

/** How `buildSnapshot` builds a snapshot. */
export interface SnapshotOptions {
  /**
   * Whether to work out `positions`. A caller that works positions out
   * another way passes `false`, and `positions` is empty.
   * @default true
   */
  positions?: boolean
}
