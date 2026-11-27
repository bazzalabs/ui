import { createSelector, ReactStore } from '@base-ui/utils/store'
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect'
import { useRefWithInit } from '@base-ui/utils/useRefWithInit'
import {
  buildSnapshotWithoutPositions,
  type CollectionSnapshot,
  type ControlledCell,
  cellValue,
  changeCell,
  computePositions,
  createCell,
  emptyCollection,
  type FilterFn,
  filteredSnapshotInput,
  type ItemRowMeta,
  isItemRow,
  mergeByPosition,
  Pos,
  type RowMeta,
  type SearchNormalizer,
} from '@bazza-ui/menu-core'
import {
  createChangeEventDetails,
  createGenericEventDetails,
  REASONS,
} from '../../../utils/events/index.js'
import {
  deriveOpenMethod,
  type OpenMethod,
} from '../../../utils/input-modality.js'
import type { VirtualizationConfig } from '../contexts/listbox-context.js'
import type {
  HighlightChangeEventDetails,
  HighlightChangeReason,
  PopupMenuOpenChangeEventDetails,
  PopupMenuOpenChangeReason,
} from '../events.js'
import { commandScore } from '../utils/command-score.js'
import { normalizeValue } from '../utils/normalize.js'

export type { OpenMethod }

// ============================================================================
// Types
// ============================================================================

export type { FilterFn, SearchNormalizer }

export interface ItemRegistration {
  value: string
  keywords?: string[]
  groupId?: string
  disabled?: boolean
  /** Lower values are sorted earlier in score-based lists. */
  forceOrder?: number
  /** Overrides computed fuzzy score in score-based lists. */
  forceScore?: number
  /** Whether this item is a submenu trigger */
  isSubmenuTrigger?: boolean
  /** Single character keyboard shortcut to trigger this item */
  shortcut?: string
  /** Whether selecting this item should close the menu (default: true) */
  closeOnClick?: boolean
  /** Whether this item can be activated via Enter/click (default: true). Non-activatable items remain highlightable. */
  activatable?: boolean
}

/** Kinds of rows that participate in positional attributes. */
export type ListboxRowKind =
  | 'item'
  | 'group'
  | 'separator'
  | 'empty'
  | 'loading'

/** A mounted row tracked for positional attributes, in DOM order. */
export interface ListboxOrderedRow {
  /** Unique row id (stable per component instance). */
  id: string
  kind: ListboxRowKind
  /** Set for option-like rows rendered inside a Group/RadioGroup. */
  groupId?: string
}

/**
 * Pre-registered item for virtualization.
 * This allows the store to know about all items even when they're not mounted.
 * The `value` field serves as both the unique identifier and the filtering value.
 */
export interface VirtualItem {
  /** Value used as unique identifier and for filtering/matching */
  value: string
  /** Additional keywords for filtering */
  keywords?: string[]
  /** Whether the item is disabled */
  disabled?: boolean
}

export type HighlightSource = 'keyboard' | 'pointer' | 'auto' | null

/**
 * Describes why the consumer updated ordered items when filter={false}.
 * - `replace`: list was re-ordered/replaced (default); highlight moves to the first item
 * - `append`: new items were appended to the end while preserving existing order
 * - `refresh`: the list changed but the search did not (e.g. async results
 *   arrived); keep the highlighted item while it is still present and enabled
 */
export type OrderedItemsUpdateReason = 'replace' | 'append' | 'refresh'

export interface SetOrderedItemsOptions {
  /** Why ordered items were updated. @default 'replace' */
  reason?: OrderedItemsUpdateReason
}

/**
 * Refs for DOM elements used for scroll behavior.
 * These are stored outside of reactive state to avoid unnecessary re-renders.
 */
export interface DOMRefs {
  /** Ref to the semantic listbox element */
  listRef: React.RefObject<HTMLElement | null>
  /** Ref to the element that owns the list's scroll position */
  listScrollContainerRef: React.RefObject<HTMLElement | null>
  /** Ref to the popup (visual container) element */
  popupRef: React.RefObject<HTMLElement | null>
  /** Map of item ID to ref for the item's DOM element */
  itemRefs: Map<string, React.RefObject<HTMLElement | null>>
  /** Map of group ID to ref for the group's DOM element */
  groupRefs: Map<string, React.RefObject<HTMLElement | null>>
}

export interface ListboxState {
  /** Whether the listbox is open, controlled or not. */
  open: boolean
  /** Controlled open prop, `undefined` while uncontrolled. */
  openProp: boolean | undefined

  /**
   * How the listbox was most recently opened (`mouse`/`touch`/`pen`/`keyboard`).
   * `null` until first opened. Retained after close (only updated on open).
   */
  openMethod: OpenMethod | null

  /** Current search query, controlled or not. */
  search: string
  /** Controlled search prop, `undefined` while uncontrolled. */
  searchProp: string | undefined

  /** Normalized search query used for filtering and visibility checks */
  normalizedSearch: string
  /** Currently highlighted item ID */
  highlightedId: string | null
  /** Source of the current highlight (keyboard or pointer) */
  highlightSource: HighlightSource
  /** Whether an Input is present in the Surface */
  hasInput: boolean
  /** Whether the input is currently active (rendered) when hideUntilActive mode is used */
  inputActive: boolean
  /** Pending search character typed before input was active */
  pendingSearch: string
  /** Filtered results: item ID to score */
  filteredItems: Map<string, number>
  /** Groups that have at least one visible item */
  visibleGroups: Set<string>
  /** Count of visible items */
  filteredCount: number
  /** Counter to trigger re-filtering when items change */
  filterTrigger: number
  /** Whether virtualization mode is enabled */
  virtualized: boolean
  /** Count of virtual items (from items prop) */
  virtualItemsCount: number
  /**
   * Rows currently mounted in the DOM, sorted by document position.
   * Mounted ⇔ visible, so this is the list of visible rows.
   * Immutable: replaced wholesale on every registry change so selectors recompute.
   */
  orderedRows: readonly ListboxOrderedRow[]
  /**
   * Bumped when rows or items start waiting for
   * `flushPendingRegistrations()`. The list subscribes to it, so React
   * re-renders the list right away and its layout effect publishes them.
   */
  registrationBatch: number
}

export interface ListboxContext {
  /** Filter function or false to disable filtering */
  filter: FilterFn | false
  /** Function used to normalize search before filtering. */
  normalizeSearch: SearchNormalizer
  /** Whether to loop navigation */
  loop: boolean
  /**
   * Controls auto-highlighting behavior when the menu opens.
   * - `true`: highlight the first item (default)
   * - `false`: don't auto-highlight any item
   * - `string`: highlight the item with this specific value
   */
  autoHighlightFirst: boolean | string
  /**
   * Whether to clear search on close.
   * - `true`: clear immediately when menu closes (default)
   * - `false`: preserve search when menu closes
   * - `'after-exit'`: clear after exit animation completes (requires Surface to call clearSearch)
   */
  clearSearchOnClose: boolean | 'after-exit'
  /** Whether to reset list scroll position when search changes. */
  resetScrollOnSearch: boolean
  /** Whether hideUntilActive mode is enabled */
  hideUntilActive: boolean
  /** ID for the list element (for aria-activedescendant) */
  listId: string
  /** ID for the input element */
  inputId: string
  /** Map of item ID to registration data */
  readonly items: Map<string, ItemRegistration>
  /** Map of group ID to set of item IDs */
  readonly groups: Map<string, Set<string>>
  /** Map of a nested group's ID to the ID of the group around it */
  readonly groupParents: Map<string, string>
  /** Map of item ID to onSelect callback */
  readonly itemSelects: Map<string, () => void>
  /** Map of submenu trigger ID to open callback */
  readonly submenuOpens: Map<string, () => void>
  /** Map of submenu trigger ID to close callback */
  readonly submenuCloses: Map<string, () => void>
  /** Map of shortcut key to item ID */
  readonly shortcuts: Map<string, string>
  /** Map of row ID to its mounted DOM element (positional registry). */
  readonly rowElements: Map<string, HTMLElement>
  /**
   * Callback when open state changes.
   * The second parameter contains event details including the reason for the change.
   */
  onOpenChange: (
    open: boolean,
    eventDetails: PopupMenuOpenChangeEventDetails,
  ) => void
  /** Callback when search state changes */
  onSearchChange: ((search: string) => void) | undefined
  /**
   * Pre-registered items for virtualization.
   * When provided, navigation uses this array order instead of DOM registration order.
   */
  virtualItems: VirtualItem[]
  /**
   * Consumer-provided ordered list of item values when filter={false}.
   * Used to determine correct navigation/highlight order when consumer handles filtering externally.
   * Must always be provided when filter={false}.
   */
  orderedItems: string[]
  /**
   * Callback when highlighted item changes.
   * Useful for synchronizing with virtualizers (scrollToIndex) and other UI state.
   * The third parameter contains event details including the reason for the change.
   */
  onHighlightChange:
    | ((
        id: string | null,
        index: number,
        eventDetails: HighlightChangeEventDetails,
      ) => void)
    | undefined
  /**
   * DOM refs for scroll behavior.
   * Stored in context (not state) to avoid re-renders.
   */
  refs: DOMRefs
  /**
   * Callback when menu close animation completes.
   * Used for resetting row width measurements.
   */
  onCloseComplete?: () => void
  /**
   * Callback when popup close transition completes.
   * Used by popup-layer features that should reset only after exit animations.
   */
  onPopupCloseComplete?: () => void
  /**
   * Last known pointer position for detecting actual pointer movement.
   * Used to prevent "phantom" highlights when content shifts under a stationary pointer.
   */
  lastPointerPosition: { x: number; y: number } | null
}

/**
 * Options for the validateHighlight method.
 */
interface ValidateHighlightOptions {
  /**
   * Force highlighting the first item, even if current highlight is valid.
   * Used when the list order changes (e.g., after filtering).
   */
  forceFirst?: boolean
  /**
   * The new search query the Collection was just built for.
   * Used together with prevSearch to detect when search is cleared.
   */
  newSearch?: string
  /**
   * The previous search query before the change.
   * Used together with newSearch to detect when search is cleared.
   */
  prevSearch?: string
}

// ============================================================================
// Row Positions
// ============================================================================

// `orderedRows` is replaced wholesale on every registry change, so its identity
// keys one derivation per order change. Positional selectors run per row on
// every store notification and stay O(1).
const positionBitsCache = new WeakMap<
  readonly ListboxOrderedRow[],
  ReadonlyMap<string, number>
>()

/**
 * Each mounted row's `Pos` bitmask, from `orderedRows`, by the Collection's
 * rules (`computePositions`): a group's own row, separators, empty and
 * loading rows are rows outside any group; an item's `groupId` is its
 * Container.
 */
function rowPositionBits(
  rows: readonly ListboxOrderedRow[],
): ReadonlyMap<string, number> {
  const cached = positionBitsCache.get(rows)
  if (cached) return cached

  const ids: string[] = []
  const metas = new Map<string, RowMeta>()
  for (const row of rows) {
    ids.push(row.id)
    metas.set(row.id, orderedRowMeta(row))
  }
  const bits = computePositions(ids, metas)
  positionBitsCache.set(rows, bits)
  return bits
}

/** The part of a row's `RowMeta` that `computePositions` reads. */
function orderedRowMeta({ id, kind, groupId }: ListboxOrderedRow): RowMeta {
  switch (kind) {
    case 'group':
      return { id, kind: 'container', selection: 'none' }
    case 'item':
      return {
        id,
        kind,
        textValue: '',
        containerId: groupId,
        disabled: false,
        activatable: true,
        closeOnClick: true,
      }
    default:
      return { id, kind }
  }
}

// ============================================================================
// Selectors
// ============================================================================

/**
 * A state key, off the published `ListboxState`, for whether the Data
 * adapter fills the store's Collection: a data-first list mounts only the
 * rows and groups it shows, so the visibility selectors read every one as
 * visible while it does. Selectors read it, so rows re-render when it
 * changes.
 */
const dataAdapterKey: unique symbol = Symbol('dataAdapter')

/** `ListboxState` with the Data adapter's flag. */
type StateWithDataAdapter = ListboxState & { [dataAdapterKey]?: boolean }

/** Whether a data-first list's rows fill the store's Collection. */
function hasDataAdapter(state: ListboxState): boolean {
  return (state as StateWithDataAdapter)[dataAdapterKey] === true
}

/** The store's controlled values, by the state field that mirrors each. */
interface ControlledCells {
  open: ControlledCell<boolean>
  search: ControlledCell<string>
}

const selectors = {
  open: createSelector((state: ListboxState) => state.open),
  openMethod: createSelector((state: ListboxState) => state.openMethod),
  search: createSelector((state: ListboxState) => state.search),
  registrationBatch: createSelector(
    (state: ListboxState) => state.registrationBatch,
  ),
  normalizedSearch: createSelector(
    (state: ListboxState) => state.normalizedSearch,
  ),
  hasSearch: createSelector(
    (state: ListboxState) => state.normalizedSearch.length > 0,
  ),
  highlightedId: createSelector((state: ListboxState) => state.highlightedId),
  highlightSource: createSelector(
    (state: ListboxState) => state.highlightSource,
  ),
  hasInput: createSelector((state: ListboxState) => state.hasInput),
  inputActive: createSelector((state: ListboxState) => state.inputActive),
  pendingSearch: createSelector((state: ListboxState) => state.pendingSearch),
  filteredCount: createSelector((state: ListboxState) => state.filteredCount),
  filteredItems: createSelector((state: ListboxState) => state.filteredItems),
  visibleGroups: createSelector((state: ListboxState) => state.visibleGroups),
  virtualized: createSelector((state: ListboxState) => state.virtualized),

  isHighlighted: createSelector(
    (state: ListboxState, itemId: string) => state.highlightedId === itemId,
  ),

  isGroupVisible: createSelector(
    (state: ListboxState, groupId: string) =>
      hasDataAdapter(state) ||
      state.normalizedSearch.length === 0 ||
      state.visibleGroups.has(groupId),
  ),

  isFirstRow: createSelector(
    (state: ListboxState, rowId: string) =>
      (positionBits(state, rowId) & Pos.First) !== 0,
  ),

  isLastRow: createSelector(
    (state: ListboxState, rowId: string) =>
      (positionBits(state, rowId) & Pos.Last) !== 0,
  ),

  isFirstGroup: createSelector(
    (state: ListboxState, rowId: string) =>
      (positionBits(state, rowId) & Pos.FirstContainer) !== 0,
  ),

  isLastGroup: createSelector(
    (state: ListboxState, rowId: string) =>
      (positionBits(state, rowId) & Pos.LastContainer) !== 0,
  ),

  isFirstInGroup: createSelector(
    (state: ListboxState, rowId: string) =>
      (positionBits(state, rowId) & Pos.FirstInContainer) !== 0,
  ),

  isLastInGroup: createSelector(
    (state: ListboxState, rowId: string) =>
      (positionBits(state, rowId) & Pos.LastInContainer) !== 0,
  ),

  getItemScore: createSelector((state: ListboxState, itemId: string) => {
    if (state.normalizedSearch.length === 0) {
      return 1 // All items visible when no search
    }
    return state.filteredItems.get(itemId) ?? 0
  }),

  /**
   * Whether an item passes the filter: no active search, or a positive score.
   * Returns a boolean so rows only re-render when their visibility flips.
   */
  isItemVisible: createSelector(
    (state: ListboxState, itemId: string) =>
      hasDataAdapter(state) ||
      state.normalizedSearch.length === 0 ||
      (state.filteredItems.get(itemId) ?? 0) > 0,
  ),

  hasSearchWithNoResults: createSelector((state: ListboxState) => {
    // Must have an active search
    if (state.normalizedSearch.length === 0) return false

    // In virtualized mode with items prop, check virtualItemsCount
    // (filteredCount won't be accurate since items aren't registered in DOM)
    if (state.virtualized && state.virtualItemsCount >= 0) {
      return state.virtualItemsCount === 0
    }

    // Non-virtualized mode: check filteredCount from registered items
    return state.filteredCount === 0
  }),
}

// ============================================================================
// Key selectors
//
// What a row reads by its id, each a primitive, so a store update re-renders
// only the rows whose answer changed. Exported from this module only, off the
// published `ListboxStore` type: parts read them with
// `useStore(store, selector, id)` from `@base-ui/utils/store`.
// ============================================================================

/**
 * A mounted row's `Pos` bitmask (`Pos.First` … `Pos.LastContainer`), 0 at no
 * edge and in a virtualized list, whose rows can't tell their edges.
 */
export function positionBits(state: ListboxState, rowId: string): number {
  if (state.virtualized) return 0
  return rowPositionBits(state.orderedRows).get(rowId) ?? 0
}

/** Whether an item shows: `isItemVisible`. */
export const isVisible = selectors.isItemVisible

/** Whether a group shows: `isGroupVisible`. */
export const containerVisible = selectors.isGroupVisible

/** Whether the surface has rows to show: no search, or one that matched. */
export function hasResults(state: ListboxState): boolean {
  return !selectors.hasSearchWithNoResults(state)
}

interface DomOrderEntry {
  id: string
  element: HTMLElement | null
  index: number
}

/**
 * Orders items by DOM position, falling back to relative registration order
 * when either element is unmounted/disconnected (a deterministic fallback —
 * returning 0 would make the comparator inconsistent when null and connected
 * elements are mixed, leaving placement implementation-defined).
 */
function compareByDomOrder(a: DomOrderEntry, b: DomOrderEntry): number {
  if (
    a.element === null ||
    b.element === null ||
    !a.element.isConnected ||
    !b.element.isConnected
  ) {
    return a.index - b.index
  }

  return a.element.compareDocumentPosition(b.element) &
    Node.DOCUMENT_POSITION_FOLLOWING
    ? -1
    : 1
}

const defaultSearchNormalizer: SearchNormalizer = (search) => {
  return normalizeValue(search)
}

// ============================================================================
// Collection rows
// ============================================================================

/**
 * A data-first row's element, the JSX group around it if any, and what its
 * part was given (a `render` can override the def's props on the part, as
 * `<Item {...props} disabled={x}>`). The Data adapter's rows bind this
 * instead of registering.
 */
export interface BoundRow {
  /** The row's element, read when it's needed, so it can change. */
  elementRef: { readonly current: HTMLElement | null }
  groupId: string | undefined
  disabled: boolean
  closeOnClick: boolean
  activatable: boolean
  isSubmenuTrigger: boolean
  shortcut: string | undefined
}

/**
 * The Collection Adapter filling a store's Collection: composable JSX rows
 * (`dom`), a virtualized list's items (`virtual`), or a data-first list's
 * rows (`data`).
 */
type AdapterKind = 'dom' | 'virtual' | 'data'

/** A registered item's row in the Collection, made once per registration. */
const registrationRows = new WeakMap<ItemRegistration, ItemRowMeta>()

function registrationRow(
  id: string,
  registration: ItemRegistration,
): ItemRowMeta {
  let row = registrationRows.get(registration)
  if (row?.id === id) return row
  row = {
    id,
    kind: registration.isSubmenuTrigger ? 'submenu-trigger' : 'item',
    textValue: registration.value,
    keywords: registration.keywords,
    containerId: registration.groupId,
    disabled: registration.disabled ?? false,
    activatable: registration.activatable ?? true,
    closeOnClick: registration.closeOnClick ?? true,
    forceOrder: registration.forceOrder,
    forceScore: registration.forceScore,
    shortcut: registration.shortcut,
  }
  registrationRows.set(registration, row)
  return row
}

// Derived once per snapshot, so lookups stay O(1) between snapshot changes.
const registrationsCache = new WeakMap<
  CollectionSnapshot,
  Map<string, ItemRegistration>
>()
const shortcutsCache = new WeakMap<CollectionSnapshot, Map<string, string>>()

function itemRowRegistration(row: ItemRowMeta): ItemRegistration {
  return {
    // A data-first row registered under its Resolved ID as its value too.
    value: row.id,
    keywords: row.keywords ? [...row.keywords] : undefined,
    disabled: row.disabled,
    forceOrder: row.forceOrder,
    forceScore: row.forceScore,
    isSubmenuTrigger: row.kind === 'submenu-trigger',
    shortcut: row.shortcut,
    closeOnClick: row.closeOnClick,
    activatable: row.activatable,
  }
}

function collectionRegistrations(
  snapshot: CollectionSnapshot,
): Map<string, ItemRegistration> {
  let registrations = registrationsCache.get(snapshot)
  if (!registrations) {
    registrations = new Map()
    for (const row of snapshot.rows.values()) {
      if (isItemRow(row)) registrations.set(row.id, itemRowRegistration(row))
    }
    registrationsCache.set(snapshot, registrations)
  }
  return registrations
}

function collectionShortcuts(
  snapshot: CollectionSnapshot,
): Map<string, string> {
  let shortcuts = shortcutsCache.get(snapshot)
  if (!shortcuts) {
    shortcuts = new Map()
    for (const id of snapshot.orderedIds) {
      const row = snapshot.rows.get(id)
      if (row && isItemRow(row) && row.shortcut) {
        const key = row.shortcut.toLowerCase()
        // Registration order: the last row with a shortcut owns it.
        shortcuts.set(key, id)
      }
    }
    shortcutsCache.set(snapshot, shortcuts)
  }
  return shortcuts
}

const visibleItemCountCache = new WeakMap<CollectionSnapshot, number>()

/** The number of visible item rows, disabled ones included. */
function countVisibleItemRows(snapshot: CollectionSnapshot): number {
  let count = visibleItemCountCache.get(snapshot)
  if (count === undefined) {
    count = 0
    for (const id of snapshot.visible) {
      const row = snapshot.rows.get(id)
      if (row && isItemRow(row)) count++
    }
    visibleItemCountCache.set(snapshot, count)
  }
  return count
}

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i])
}

/** `snapshot` navigating `navOrder`, itself when that's its order already. */
function withNavOrder(
  snapshot: CollectionSnapshot,
  navOrder: readonly string[],
): CollectionSnapshot {
  return sameIds(snapshot.navOrder, navOrder)
    ? snapshot
    : { ...snapshot, navOrder }
}

function orderedRowsEqual(
  a: readonly ListboxOrderedRow[],
  b: readonly ListboxOrderedRow[],
): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const rowA = a[i]!
    const rowB = b[i]!
    if (
      rowA.id !== rowB.id ||
      rowA.kind !== rowB.kind ||
      rowA.groupId !== rowB.groupId
    ) {
      return false
    }
  }
  return true
}

/** Whether `a` comes before `b` in the document. */
function precedes(a: HTMLElement, b: HTMLElement): boolean {
  return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
}

/** `element` while it's in the document. */
function connected(
  element: HTMLElement | null | undefined,
): HTMLElement | undefined {
  return element?.isConnected ? element : undefined
}

// ============================================================================
// Data adapter entry points
//
// Exported from this module only, never from `internal/listbox/index.ts`, so
// the published `ListboxStore` type doesn't carry them.
// ============================================================================

interface DataRowsAccess {
  publishDataRows(
    store: ListboxStore,
    snapshot: CollectionSnapshot | null,
  ): void
  bindDataRow(store: ListboxStore, id: string, row: BoundRow): () => void
  refreshDataRows(store: ListboxStore): void
  getRegistration(store: ListboxStore, id: string): ItemRegistration | undefined
  getShortcutItemId(store: ListboxStore, key: string): string | undefined
}

let dataRowsAccess: DataRowsAccess

/**
 * The Data adapter: a data-first list hands the store the rows it already
 * filtered, scored and ordered, which become the store's Collection. The
 * list calls it from a layout effect that runs after its rows' (so they're
 * bound) and before the list primitive's flush, so rows see one publish per
 * commit. Highlight changes stay with the caller (`setOrderedItems`,
 * `highlightFirstOrderedItem`). `null` hands the rows back to the DOM
 * adapter, as when the list unmounts.
 */
export function publishDataRows(
  store: ListboxStore,
  snapshot: CollectionSnapshot | null,
): void {
  dataRowsAccess.publishDataRows(store, snapshot)
}

/**
 * Binds a data-first row under its Resolved ID, with its element (which may
 * attach later, or never) and the props its part was given. Returns the
 * unbind. A bound row doesn't register: the Collection already has it.
 */
export function bindDataRow(
  store: ListboxStore,
  id: string,
  row: BoundRow,
): () => void {
  return dataRowsAccess.bindDataRow(store, id, row)
}

/**
 * Works positions out again once a row that bound without its element gets
 * one, at the next microtask.
 */
export function refreshDataRows(store: ListboxStore): void {
  dataRowsAccess.refreshDataRows(store)
}

/**
 * An item's registration: a data-first row's from the Collection, with what
 * its part overrides while it's bound; otherwise what the item registered.
 * Read registrations through this, never `context.items`.
 */
export function getRegistration(
  store: ListboxStore,
  id: string,
): ItemRegistration | undefined {
  return dataRowsAccess.getRegistration(store, id)
}

/**
 * The item a shortcut key selects, if any. Read shortcuts through this,
 * never `context.shortcuts`.
 */
export function getShortcutItemId(
  store: ListboxStore,
  key: string,
): string | undefined {
  return dataRowsAccess.getShortcutItemId(store, key)
}

// ============================================================================
// Open source
//
// Exported from this module only, like the entry points above.
// ============================================================================

/**
 * The store that keeps another store's open cell: a menu tree keeps its
 * root's, and writes the store's `open`, `openProp` and `openMethod` with it
 * (`changeOpen`, `controlCell`). The store hands it `setOpen` and the
 * `openProp` sync.
 */
export interface OpenOwner {
  setOpen(
    open: boolean,
    reason?: PopupMenuOpenChangeReason,
    event?: Event,
  ): void
  /** Syncs the controlled `open` prop. */
  control(open: boolean | undefined): void
}

let openOwnerAccess: {
  get(store: ListboxStore): OpenOwner | undefined
  attach(store: ListboxStore, owner: OpenOwner): void
  getCloseCause(store: ListboxStore): CloseCause | null
  setCloseCause(store: ListboxStore, cause: CloseCause | null): void
  request(
    store: ListboxStore,
    open: boolean,
    reason: PopupMenuOpenChangeReason,
    event: Event | undefined,
    cause: CloseCause | undefined,
  ): PopupMenuOpenChangeEventDetails
}

/**
 * What closed a store's popup, for the popups that close with it (a menu's
 * submenus): the reason and event of the close request the consumer let
 * through, or the cause the request named for them.
 */
export interface CloseCause {
  readonly reason: PopupMenuOpenChangeReason
  readonly event?: Event
}

/**
 * Why `store`'s popup is closing, while its `open` goes false: the last close
 * request the consumer let through, unless a later request or a prop sync
 * superseded it (see `changeOpen`). Read it from an observer of `open`.
 */
export function getCloseCause(store: ListboxStore): CloseCause | null {
  return openOwnerAccess.getCloseCause(store)
}

/**
 * Requests `open` for a store that keeps its own open cell, as `setOpen`
 * does, and returns the details its consumer saw (canceled or not). `cause`
 * is what the popups that close with it are told; the request's reason and
 * event when left out.
 */
export function requestStoreOpen(
  store: ListboxStore,
  open: boolean,
  reason: PopupMenuOpenChangeReason = REASONS.none,
  event?: Event,
  cause?: CloseCause,
): PopupMenuOpenChangeEventDetails {
  return openOwnerAccess.request(store, open, reason, event, cause)
}

/**
 * Hands `store`'s open state to `owner`, for the store's lifetime. Call it
 * before anything reads or changes the store's open state.
 */
export function attachOpenOwner(store: ListboxStore, owner: OpenOwner): void {
  openOwnerAccess.attach(store, owner)
}

/** The owner of `store`'s open state, if another store keeps it. */
export function getOpenOwner(store: ListboxStore): OpenOwner | undefined {
  return openOwnerAccess.get(store)
}

/**
 * Requests `open` for an open cell (a `ListboxStore`'s, or a menu tree's,
 * for its root) and writes `store`, whose state mirrors it. The consumer's
 * `onOpenChange` runs first; a canceled change, or one to a controlled value,
 * leaves the cell as it is. Returns the details the consumer saw.
 *
 * A close of a popup that's open records its cause (`cause`, else the
 * request's reason and event) before the consumer runs, so observers of
 * `open` read it (`getCloseCause`), even when the consumer applies a
 * controlled `open` from inside its callback (`flushSync`). A canceled
 * change puts the previous cause back. An uncontrolled close drops it once
 * it has written `open`; for a controlled `open` it lasts until it's
 * superseded: by the next request (an open, or a close of a closed popup,
 * records none), or by the next prop sync, once its observers have read it.
 * No timer: a controlled `open` applied in a later task (a commit React
 * schedules for a non-discrete update) still reads it.
 */
export function changeOpen(
  store: ListboxStore,
  cells: { open: ControlledCell<boolean> },
  onOpenChange:
    | ((open: boolean, details: PopupMenuOpenChangeEventDetails) => void)
    | undefined,
  open: boolean,
  reason: PopupMenuOpenChangeReason = REASONS.none,
  event?: Event,
  cause?: CloseCause,
): PopupMenuOpenChangeEventDetails {
  const eventDetails = createChangeEventDetails(reason, event)
  const prevCell = cells.open
  const previousCause = openOwnerAccess.getCloseCause(store)
  const closeCause =
    !open && cellValue(prevCell) ? (cause ?? { reason, event }) : null
  openOwnerAccess.setCloseCause(store, closeCause)
  const nextCell = changeCell(prevCell, open, eventDetails, onOpenChange)

  if (eventDetails.isCanceled) {
    // Unless a prop sync inside the callback already dropped it
    if (openOwnerAccess.getCloseCause(store) === closeCause) {
      openOwnerAccess.setCloseCause(store, previousCause)
    }
    return eventDetails
  }

  // Record how the popup was opened so hover-only affordances (scroll arrows,
  // Select's align-item-with-trigger) can disable themselves for touch input.
  // Set before `open` so observers of `open` see the current method.
  if (open) {
    store.set('openMethod', deriveOpenMethod(event))
  }

  // Unchanged when controlled. Skipped when the callback changed the cell
  // (synced a prop from inside it): `nextCell` is stale then.
  if (nextCell !== prevCell && cells.open === prevCell) {
    cells.open = nextCell
    // oxlint-disable-next-line bazza/no-raw-controlled-state -- the cell's mirror, written with it
    store.set('open', open)
    // Uncontrolled, the close is done and its observers have read the cause
    if (openOwnerAccess.getCloseCause(store) === closeCause) {
      openOwnerAccess.setCloseCause(store, null)
    }
  }
  return eventDetails
}

/**
 * Syncs a controlled `open` prop into an open cell, as `controlCell` does,
 * then drops the close cause the last request recorded: observers of `open`
 * read it while the prop applies the close.
 */
export function controlOpenCell(
  store: ListboxStore,
  cells: { open: ControlledCell<boolean> },
  controlled: boolean | undefined,
): void {
  controlCell(store, cells, 'open', controlled)
  openOwnerAccess.setCloseCause(store, null)
}

/**
 * Syncs a controlled prop into its cell (`cells[name]`), and the cell's
 * mirrors in `store` (`name` and `${name}Prop`) with it.
 */
export function controlCell<State, Name extends keyof State & string>(
  store: { update(changes: Partial<State>): void },
  cells: { [Key in Name]: ControlledCell<State[Key]> },
  name: Name,
  controlled: State[Name] | undefined,
): void {
  const cell = cells[name]
  if (controlled === undefined || controlled === cell.controlled) return
  cells[name] = createCell(cell.internal, controlled)
  // `bazza/no-raw-controlled-state` doesn't see computed keys, so this write
  // needs no exception.
  store.update({
    [name]: controlled,
    [`${name}Prop`]: controlled,
  } as Partial<State>)
}

// ============================================================================
// Surface settings
//
// Exported from this module only, like the entry points above.
// ============================================================================

/**
 * A Surface's settings but `orderedItems`. The Surface memoizes them over the
 * props they come from: a new object means one of those changed, and a sync
 * writes them all.
 */
export interface SurfaceSettings {
  /**
   * What the store's context takes as it is. `filter` is `false` for a
   * data-first Surface, whose list filters.
   */
  context: Pick<
    ListboxContext,
    | 'filter'
    | 'loop'
    | 'autoHighlightFirst'
    | 'clearSearchOnClose'
    | 'resetScrollOnSearch'
    | 'listId'
    | 'inputId'
    | 'onSearchChange'
  >
  normalizeSearch: SearchNormalizer
  virtualization: VirtualizationConfig | undefined
}

/**
 * Writes a Surface's settings into its store, before the commit's rows
 * flush: the Surface calls it from a layout effect of `SurfaceConfigSync`,
 * its first child, keyed on the settings. With no `virtualization`, the
 * virtualization slot is left alone, for a child's own virtual list to write.
 */
export function syncSurfaceSettings(
  store: ListboxStore,
  settings: SurfaceSettings,
): void {
  Object.assign(store.context, settings.context)
  store.setSearchNormalizer(settings.normalizeSearch)
  const { virtualization } = settings
  if (virtualization) {
    store.setVirtualized(virtualization.virtualized)
    store.setVirtualItems(virtualization.items)
    store.setOnHighlightChange(virtualization.onHighlightChange)
  }
}

/**
 * Whether the Surface applies `autoHighlightFirst` again (`applyAutoHighlight`)
 * once a commit's items register: when it's a value. The Surface asks from a
 * passive effect keyed on `autoHighlightFirst` alone, so it applies when the
 * Surface mounts and when the value changes; the store also applies it when
 * the menu opens, and when its row first arrives while the highlight is
 * still the automatic one. Another setting's change (a new `virtualization`
 * from a new `onHighlightChange` or `items`, a new `onSearchChange`) leaves
 * the highlight where it is.
 */
export function reapplyAutoHighlight(
  autoHighlightFirst: boolean | string,
): boolean {
  return typeof autoHighlightFirst === 'string'
}

// ============================================================================
// Store
// ============================================================================

/**
 * Core store for listbox-like components.
 * Handles item registration, filtering, navigation, and highlight state.
 *
 * Used by: DropdownMenu, ContextMenu, Select, CommandMenu
 */
export class ListboxStore extends ReactStore<
  ListboxState,
  ListboxContext,
  typeof selectors
> {
  static {
    // The Data adapter's entry points, off the class's public surface (and
    // its published types): see `publishDataRows` above.
    dataRowsAccess = {
      publishDataRows: (store, snapshot) => store.#publishDataRows(snapshot),
      bindDataRow: (store, id, row) => store.#bindDataRow(id, row),
      refreshDataRows: (store) => {
        store.#dataRowsDirty = true
        store.#scheduleBindFlush()
      },
      getRegistration: (store, id) => store.#getRegistration(id),
      getShortcutItemId: (store, key) => store.#getShortcutItemId(key),
    }
    openOwnerAccess = {
      get: (store) => store.#openOwner,
      attach: (store, owner) => {
        store.#openOwner = owner
      },
      getCloseCause: (store) => store.#closeCause,
      setCloseCause: (store, cause) => {
        store.#closeCause = cause
      },
      request: (store, open, reason, event, cause) =>
        changeOpen(
          store,
          store.#cells,
          store.context.onOpenChange,
          open,
          reason,
          event,
          cause,
        ),
    }
  }

  constructor(
    initialState?: Partial<ListboxState>,
    context?: Partial<ListboxContext>,
  ) {
    const defaultContext: ListboxContext = {
      filter: commandScore,
      normalizeSearch: defaultSearchNormalizer,
      loop: true,
      autoHighlightFirst: true,
      clearSearchOnClose: true,
      resetScrollOnSearch: true,
      hideUntilActive: false,
      listId: '',
      inputId: '',
      items: new Map(),
      groups: new Map(),
      groupParents: new Map(),
      itemSelects: new Map(),
      submenuOpens: new Map(),
      submenuCloses: new Map(),
      shortcuts: new Map(),
      rowElements: new Map(),
      onOpenChange: () => {},
      onSearchChange: undefined,
      virtualItems: [],
      orderedItems: [],
      onHighlightChange: undefined,
      refs: {
        listRef: { current: null },
        listScrollContainerRef: { current: null },
        popupRef: { current: null },
        itemRefs: new Map(),
        groupRefs: new Map(),
      },
      onCloseComplete: undefined,
      onPopupCloseComplete: undefined,
      lastPointerPosition: null,
    }

    const mergedContext = { ...defaultContext, ...context }
    const mergedState = { ...createInitialState(), ...initialState }
    const openCell = createCell(mergedState.open, mergedState.openProp)
    const searchCell = createCell(mergedState.search, mergedState.searchProp)
    mergedState.open = cellValue(openCell)
    mergedState.search = cellValue(searchCell)
    mergedState.normalizedSearch = mergedContext.normalizeSearch(
      mergedState.search,
    )

    super(mergedState, mergedContext, selectors)
    this.#cells = { open: openCell, search: searchCell }

    // Handle open/close
    this.observe('open', (open, prevOpen) => {
      if (open === prevOpen) {
        return
      }

      if (open) {
        // Reset pointer position tracking on open to prevent phantom highlights
        this.resetPointerPosition()

        // A string `autoHighlightFirst`: a Surface that stayed mounted (a
        // kept-mounted popup, a reopen during the exit animation) still has
        // its rows, and its synced value is this session's, so it applies
        // now. Otherwise the value may be the last session's, until the new
        // Surface syncs its own: the row waits, pending, and is dropped once
        // the Surface syncs another value.
        const autoHighlight = this.context.autoHighlightFirst
        if (autoHighlight === true) {
          // Default: highlight first item
          this.highlightFirstItem()
        } else if (typeof autoHighlight === 'string') {
          if (this.context.items.size > 0 || this.#boundRows.size > 0) {
            this.applyAutoHighlight()
          } else this.#pendingAutoHighlight = autoHighlight
        }
      } else {
        this.#pendingAutoHighlight = null
        // Clear search and highlight on close
        // When 'after-exit', search is cleared by Root after animation completes
        if (this.context.clearSearchOnClose === true) {
          this.setSearch('')
        }

        // When 'after-exit', also defer hiding the input until animation completes
        // This prevents the input from disappearing before the popup animates out
        const deferInputHide = this.context.clearSearchOnClose === 'after-exit'

        this.update({
          inputActive: deferInputHide ? this.state.inputActive : false,
          pendingSearch: '',
        })
      }
    })

    // Keep normalizedSearch in sync when search changes (including controlled props).
    this.observe('search', (search, prevSearch) => {
      if (search !== prevSearch) {
        this.syncNormalizedSearch()
      }
    })

    // Recompute filtered items when normalized search changes.
    this.observe('normalizedSearch', (search, prevSearch) => {
      if (search !== prevSearch) {
        // Reset pointer position when search changes - content is about to shift
        // and we don't want stationary pointers to trigger phantom highlights
        this.resetPointerPosition()
        // A search moves the highlight to its first result instead.
        this.#pendingAutoHighlight = null
        this.#publishCollection(prevSearch)

        if (this.context.resetScrollOnSearch && !this.state.virtualized) {
          this.scrollListToTop()
        }
      }
    })
  }

  // The controlled values. `open`, `openProp`, `search` and `searchProp` in
  // state mirror them, written in the same update as the cell: by `setOpen`,
  // `setSearch` and `useControlledProp('openProp' | 'searchProp', …)`.
  #cells: ControlledCells

  // Set when another store keeps the open cell (`attachOpenOwner`): the
  // `open` cell above isn't read then, and the owner writes the mirrors.
  #openOwner: OpenOwner | undefined

  // What closed the popup, while observers of `open` read it (`changeOpen`).
  #closeCause: CloseCause | null = null

  /**
   * Syncs a controlled prop into the store. `openProp` and `searchProp` go
   * into their cell, and the mirrored fields with it.
   */
  override useControlledProp<Key extends keyof ListboxState>(
    key: Key,
    controlled: ListboxState[Key] | undefined,
  ): void {
    useIsoLayoutEffect(() => {
      if (key === 'openProp') {
        if (this.#openOwner) {
          this.#openOwner.control(controlled as boolean | undefined)
        } else {
          controlOpenCell(this, this.#cells, controlled as boolean | undefined)
        }
      } else if (key === 'searchProp') {
        controlCell(this, this.#cells, 'search', controlled as string)
      }
    }, [this, key, controlled])
    // Runs after the effect above, so for those two keys it finds the value
    // synced and only warns when a prop switches between controlled and not.
    super.useControlledProp(key, controlled)
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Set the open state with event details.
   *
   * @param open - The new open state
   * @param reason - The reason for the state change (default: 'none')
   * @param event - The native DOM event that triggered the change (optional)
   */
  setOpen(
    open: boolean,
    reason: PopupMenuOpenChangeReason = REASONS.none,
    event?: Event,
  ) {
    if (this.#openOwner) this.#openOwner.setOpen(open, reason, event)
    else {
      const { onOpenChange } = this.context
      changeOpen(this, this.#cells, onOpenChange, open, reason, event)
    }
  }

  setSearch(search: string) {
    this.#cells.search = changeCell(this.#cells.search, search)
    const effectiveSearch = cellValue(this.#cells.search)
    this.update({
      // oxlint-disable-next-line bazza/no-raw-controlled-state -- the cell's mirror, written with it
      search: effectiveSearch,
      normalizedSearch: this.context.normalizeSearch(effectiveSearch),
    })
    // After the update, unlike `setOpen`: the search has no cancel, and the
    // highlight change the new search causes is reported first.
    this.context.onSearchChange?.(search)
    // Note: the Collection is rebuilt by the 'normalizedSearch' observer
  }

  setSearchNormalizer(normalizeSearch: SearchNormalizer) {
    this.context.normalizeSearch = normalizeSearch

    const normalizedSearch = normalizeSearch(this.select('search'))
    if (normalizedSearch !== this.state.normalizedSearch) {
      this.set('normalizedSearch', normalizedSearch)
    }
  }

  private syncNormalizedSearch() {
    const normalizedSearch = this.context.normalizeSearch(this.select('search'))
    if (normalizedSearch !== this.state.normalizedSearch) {
      this.set('normalizedSearch', normalizedSearch)
    }
  }

  private defaultSearchInitialized = false

  // Registrations waiting for `flushPendingRegistrations()`. A row maps to
  // `null` when it unregistered.
  private pendingRows = new Map<string, ListboxOrderedRow | null>()
  private pendingRegisteredItems = new Set<string>()
  private pendingRescore = false
  private registrationBatchOpen = false

  initializeDefaultSearch(defaultSearch: string) {
    if (this.defaultSearchInitialized) return
    this.defaultSearchInitialized = true

    if (
      this.state.searchProp === undefined &&
      defaultSearch !== this.state.search
    ) {
      this.setSearch(defaultSearch)
    }
  }

  setHighlightedId(id: string | null, cause: HighlightSource = 'pointer') {
    // The user moved the highlight: `autoHighlightFirst` waits no longer.
    if (cause === 'keyboard' || cause === 'pointer') {
      this.#pendingAutoHighlight = null
    }
    const prevId = this.state.highlightedId
    if (prevId === id) return

    // Close any open submenus that are not the newly highlighted item
    // This ensures only one submenu is open at a time in this menu
    this.closeSiblingSubmenus(id)

    this.update({ highlightedId: id, highlightSource: cause })

    // Always notify about highlight changes (for virtualization, analytics, etc.)
    this.notifyHighlightChange(id, cause)

    // Handle scroll behavior for keyboard navigation
    if (cause === 'keyboard' && id !== null) {
      this.scrollItemIntoView(id)
    }
  }

  /**
   * Notify listeners about highlight changes.
   * Called whenever highlightedId changes, regardless of virtualization or DOM state.
   * Useful for virtualization scroll sync, analytics, or any other tracking needs.
   *
   * @param id - The newly highlighted item ID (or null if cleared)
   * @param cause - What caused the highlight change
   */
  private notifyHighlightChange(id: string | null, cause: HighlightSource) {
    const { onHighlightChange } = this.context
    if (!onHighlightChange) return

    // Map cause to reason
    const reason: HighlightChangeReason =
      cause === 'keyboard'
        ? REASONS.keyboard
        : cause === 'pointer'
          ? REASONS.pointer
          : REASONS.auto

    // Get the index of the highlighted item
    const index =
      id === null
        ? -1
        : this.state.virtualized
          ? this.getVirtualItemIndex(id)
          : this.getVisibleItemIndex(id)

    const eventDetails = createGenericEventDetails(reason, undefined, { index })
    onHighlightChange(id, index, eventDetails)
  }

  /**
   * Scroll the highlighted item into view.
   * Uses native scrollIntoView if the element is in the DOM.
   * For virtualized lists, the onHighlightChange callback (called from setHighlightedId)
   * should handle scrolling via the virtualizer.
   *
   * @param id - The item ID to scroll into view
   */
  private scrollItemIntoView(id: string) {
    const { refs } = this.context
    const listEl = refs.listRef.current
    const itemRef = refs.itemRefs.get(id)
    const itemEl = itemRef?.current

    // If the item element exists and is inside the list, use native scrollIntoView
    if (itemEl && listEl) {
      try {
        const isInList = listEl.contains(itemEl)
        if (isInList) {
          itemEl.scrollIntoView({ block: 'nearest' })
          this.maybeRevealGroupTop(id, listEl)
        }
      } catch {
        // Ignore errors from scrollIntoView
      }
    }
    // For virtualized lists where the item is not in the DOM,
    // the onHighlightChange callback handles scroll via virtualizer
  }

  /**
   * Reveal the top of an item's group after the item has been scrolled into
   * view. When keyboard navigation lands on the first visible item of a
   * group, aligning the viewport to the item alone leaves the group's label
   * clipped just above the viewport (e.g. when navigating upward or wrapping
   * around). Scrolling up by the clipped amount aligns the viewport top with
   * the group's top edge so the label is visible.
   *
   * No-ops when the item is not the first visible item of its group, when the
   * group element is unknown or outside the list, or when the group's top is
   * already visible (e.g. when navigating downward).
   */
  private maybeRevealGroupTop(id: string, listEl: HTMLElement) {
    const groupId = this.#getRegistration(id)?.groupId
    if (!groupId) return

    // Only the group's first visible item anchors to the group top
    const visibleIds = this.getVisibleItemIds()
    const firstInGroup = visibleIds.find(
      (visibleId) => this.#getRegistration(visibleId)?.groupId === groupId,
    )
    if (firstInGroup !== id) return

    const groupEl = this.context.refs.groupRefs.get(groupId)?.current
    if (!groupEl || !listEl.contains(groupEl)) return

    const scrollEl =
      this.context.refs.listScrollContainerRef.current ??
      this.getScrollResetElement(listEl)

    const clippedAbove =
      scrollEl.getBoundingClientRect().top - groupEl.getBoundingClientRect().top
    if (clippedAbove > 0) {
      scrollEl.scrollTop -= clippedAbove
    }
  }

  private scrollListToTop() {
    const listEl = this.context.refs.listRef.current
    const scrollEl =
      this.context.refs.listScrollContainerRef.current ??
      (listEl ? this.getScrollResetElement(listEl) : null)
    if (!scrollEl) return

    if (typeof scrollEl.scrollTo === 'function') {
      scrollEl.scrollTo({ top: 0 })
      return
    }

    // jsdom and older DOM environments may not implement Element.scrollTo.
    // Assigning scrollTop keeps the behavior testable and preserves the reset.
    scrollEl.scrollTop = 0
  }

  /** The element that scrolls the list: the first scrollable ancestor of the list element, or the list element itself. */
  getScrollResetElement(listEl: HTMLElement): HTMLElement {
    let element: HTMLElement | null = listEl

    while (element) {
      if (this.isScrollableElement(element)) {
        return element
      }

      element = element.parentElement
    }

    return listEl
  }

  private isScrollableElement(element: HTMLElement): boolean {
    const win = element.ownerDocument?.defaultView
    const overflowY = win?.getComputedStyle(element).overflowY
    const canScrollY =
      overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'

    return (
      element.scrollTop > 0 ||
      (canScrollY && element.scrollHeight > element.clientHeight)
    )
  }

  setHasInput(hasInput: boolean) {
    this.set('hasInput', hasInput)
  }

  setInputActive(active: boolean) {
    this.set('inputActive', active)
  }

  setPendingSearch(search: string) {
    this.set('pendingSearch', search)
  }

  setHideUntilActive(enabled: boolean) {
    this.context.hideUntilActive = enabled
    // If enabling and there's already search content, activate immediately
    if (enabled && this.state.normalizedSearch.length > 0) {
      this.setInputActive(true)
    }
  }

  setVirtualized(virtualized: boolean) {
    this.set('virtualized', virtualized)
  }

  setVirtualItems(items: VirtualItem[]) {
    // A pending `autoHighlightFirst` row among the new items is applied once
    // they're validated: the validation would move the highlight off it.
    this.#holdingAutoHighlight = true
    try {
      this.#setVirtualItems(items)
    } finally {
      this.#holdingAutoHighlight = false
    }
    this.#applyPendingAutoHighlight()
  }

  #setVirtualItems(items: VirtualItem[]) {
    const prevItems = this.context.virtualItems
    this.context.virtualItems = items

    // Update count in state for selectors to use
    this.set('virtualItemsCount', items.length)

    // The Collection takes every virtual item, mounted or not
    if (items.length > 0) this.#publishCollection()

    // Skip if items reference didn't change (same array)
    if (items === prevItems) {
      return
    }

    // Skip if the navigation-relevant data hasn't changed.
    // Virtual items are often recreated (new array reference) when parent content
    // re-renders due to non-navigation changes (e.g. checkbox checked state).
    // Only trigger highlight validation when values or disabled states actually differ.
    if (prevItems.length === items.length) {
      let same = true
      for (let i = 0; i < prevItems.length; i++) {
        const prev = prevItems[i]
        const next = items[i]
        if (
          !prev ||
          !next ||
          prev.value !== next.value ||
          prev.disabled !== next.disabled
        ) {
          same = false
          break
        }
      }
      if (same) {
        return
      }
    }

    // Skip highlight validation if not in the right state
    if (!this.state.virtualized || !this.select('open') || items.length === 0) {
      return
    }

    // Determine if we need to force highlight the first item
    const prevFirstItem = prevItems.find((item) => !item.disabled)
    const newFirstItem = items.find((item) => !item.disabled)
    // Only force "first item" behavior when there was a previous first item.
    // This avoids transient resets caused by virtualization effect cleanup
    // temporarily clearing virtual items between renders.
    const firstItemChanged =
      prevFirstItem !== undefined && newFirstItem?.value !== prevFirstItem.value

    // Validate and potentially update the highlight
    this.validateHighlight({ forceFirst: firstItemChanged })
  }

  /**
   * Set the consumer-provided ordered items.
   * Used when filter={false} and consumer controls item order/visibility.
   * Must always be provided when filter={false}.
   *
   * @param items - Array of item IDs in display order
   */
  setOrderedItems(items: string[], options?: SetOrderedItemsOptions) {
    const reason = options?.reason ?? 'replace'
    const prevItems = this.context.orderedItems
    this.context.orderedItems = items

    // Skip if items reference didn't change (same array)
    if (items === prevItems) {
      return
    }

    // Skip highlight update if not open
    if (!this.select('open')) {
      return
    }

    // For append-only and same-search updates, preserve the current highlight
    // while it remains valid (identity, not position).
    if (
      (reason === 'append' || reason === 'refresh') &&
      this.state.highlightedId !== null
    ) {
      // A virtualized list's unmounted rows are reachable through its items.
      const highlightedId = this.state.highlightedId
      const registration = this.#getRegistration(highlightedId)
      if (
        items.includes(highlightedId) &&
        this.#isItemReachable(highlightedId) &&
        registration !== undefined &&
        !registration.disabled
      ) {
        return
      }
    }

    this.highlightFirstOrderedItem()
  }

  /**
   * Highlights the first registered item in the ordered items (or clears the
   * highlight when there is none). Uses the 'auto' source: not user-initiated,
   * so submenus don't auto-open. No-op while closed.
   */
  highlightFirstOrderedItem() {
    if (!this.select('open')) return
    const items = this.context.orderedItems
    const firstRegisteredItem = items.find((id) => this.#isItemNavigable(id))
    this.setHighlightedId(firstRegisteredItem ?? null, 'auto')
  }

  /**
   * Try to auto-highlight when an item registers.
   * This handles the case where orderedItems was set before items mounted.
   * Only highlights if:
   * - filter={false} (using orderedItems)
   * - Menu is open
   * - No item is currently highlighted
   * - autoHighlightFirst is enabled
   * - One of the registering items is the first registered in orderedItems
   */
  private maybeAutoHighlightOnRegister(registeredIds: ReadonlySet<string>) {
    if (registeredIds.size === 0) {
      return
    }

    if (this.context.filter !== false && !this.#dataRows) {
      return
    }
    if (!this.select('open')) {
      return
    }
    if (this.state.highlightedId !== null) {
      return
    }
    if (!this.context.autoHighlightFirst) {
      return
    }

    const orderedItems = this.context.orderedItems
    if (orderedItems.length === 0) {
      return
    }

    // Find the first item in orderedItems that is registered
    const firstRegisteredItem = orderedItems.find((itemId) =>
      this.#isItemNavigable(itemId),
    )

    // Only highlight if the first registered item registered just now
    // Use 'auto' source to indicate this is automatic (not user-initiated)
    if (
      firstRegisteredItem !== undefined &&
      registeredIds.has(firstRegisteredItem)
    ) {
      this.setHighlightedId(firstRegisteredItem, 'auto')
    }
  }

  setOnHighlightChange(
    callback:
      | ((
          id: string | null,
          index: number,
          eventDetails: HighlightChangeEventDetails,
        ) => void)
      | undefined,
  ) {
    this.context.onHighlightChange = callback
  }

  // ============================================================================
  // DOM Refs Management
  // ============================================================================

  /**
   * Set the list element ref for scroll container detection.
   */
  setListRef(ref: React.RefObject<HTMLElement | null>) {
    this.context.refs.listRef = ref
  }

  /**
   * Set the list scroll container ref for scroll position management.
   * Use this when the semantic list element is rendered inside another
   * scrollable container, such as a custom ScrollArea viewport.
   */
  setListScrollContainerRef(ref: React.RefObject<HTMLElement | null>) {
    this.context.refs.listScrollContainerRef = ref
  }

  /**
   * Set the popup (visual container) ref. Used by popup-layer features such as
   * Select's align-item-with-trigger positioning.
   */
  setPopupRef(ref: React.RefObject<HTMLElement | null>) {
    this.context.refs.popupRef = ref
  }

  /**
   * Register an item's DOM ref for scrollIntoView behavior.
   * Returns a cleanup function.
   */
  registerItemRef(
    id: string,
    ref: React.RefObject<HTMLElement | null>,
  ): () => void {
    this.context.refs.itemRefs.set(id, ref)
    return () => {
      this.context.refs.itemRefs.delete(id)
    }
  }

  // ============================================================================
  // Pointer Position Tracking
  // ============================================================================

  /**
   * Check if pointer has moved and should allow highlight.
   * This prevents "phantom" highlights when content shifts under a stationary pointer
   * (e.g., when search results change or menu items reorder).
   *
   * @param x - Current pointer X position
   * @param y - Current pointer Y position
   * @returns true if pointer has actually moved and highlight should be allowed
   */
  shouldAllowPointerHighlight(x: number, y: number): boolean {
    const last = this.context.lastPointerPosition
    if (last === null) {
      // First pointer event - record position and allow highlight
      this.context.lastPointerPosition = { x, y }
      return true
    }

    // Check if pointer has actually moved (with small tolerance for sub-pixel movements)
    const dx = Math.abs(x - last.x)
    const dy = Math.abs(y - last.y)
    const hasMoved = dx > 1 || dy > 1

    if (hasMoved) {
      // Update position and allow highlight
      this.context.lastPointerPosition = { x, y }
      return true
    }

    // Pointer hasn't moved - don't allow highlight
    return false
  }

  /**
   * Reset pointer position tracking.
   * Call this when the menu opens or content changes significantly.
   */
  resetPointerPosition() {
    this.context.lastPointerPosition = null
  }

  // ============================================================================
  // Item Registration
  // ============================================================================

  registerItem(id: string, registration: ItemRegistration): () => void {
    // Check if this item is already registered with the same properties
    // This optimization reduces unnecessary recomputation in virtualized mode
    const existing = this.context.items.get(id)
    const isSameRegistration =
      existing &&
      existing.value === registration.value &&
      existing.disabled === registration.disabled &&
      existing.forceOrder === registration.forceOrder &&
      existing.forceScore === registration.forceScore &&
      existing.groupId === registration.groupId &&
      existing.shortcut === registration.shortcut &&
      existing.activatable === registration.activatable

    if (isSameRegistration) {
      // Item already registered with same properties, skip recompute
      return () => {
        // Only clean up if this item is still in the map
        // (another registration might have replaced it)
        if (this.context.items.get(id) === existing) {
          this.context.items.delete(id)
          this.context.itemSelects.delete(id)
          if (registration.groupId) {
            this.context.groups.get(registration.groupId)?.delete(id)
          }
          if (registration.shortcut) {
            this.context.shortcuts.delete(registration.shortcut.toLowerCase())
          }
          this.queueRescore()
        }
      }
    }

    this.context.items.set(id, registration)

    // Add to group if specified
    if (registration.groupId) {
      const groupItems = this.context.groups.get(registration.groupId)
      if (groupItems) {
        groupItems.add(id)
      }
    }

    // Register shortcut if specified
    if (registration.shortcut) {
      const key = registration.shortcut.toLowerCase()
      this.context.shortcuts.set(key, id)
    }

    // Scores and auto-highlight run once for every item registered this
    // commit, at the next flush.
    this.pendingRegisteredItems.add(id)
    this.queueRescore()

    return () => {
      this.context.items.delete(id)
      this.context.itemSelects.delete(id)

      if (registration.groupId) {
        const groupItems = this.context.groups.get(registration.groupId)
        if (groupItems) {
          groupItems.delete(id)
        }
      }

      // Unregister shortcut
      if (registration.shortcut) {
        const key = registration.shortcut.toLowerCase()
        this.context.shortcuts.delete(key)
      }

      this.queueRescore()
    }
  }

  /**
   * Register a group. Optionally registers the group's DOM element ref,
   * used for scroll positioning (e.g. revealing the group's label), and the
   * ID of the group around it: a search that matches an item in a nested
   * group shows every group around it too.
   * Returns a cleanup function.
   */
  registerGroup(
    id: string,
    ref?: React.RefObject<HTMLElement | null>,
    parentId?: string,
  ): () => void {
    this.context.groups.set(id, new Set())
    if (ref) {
      this.context.refs.groupRefs.set(id, ref)
    }
    if (parentId) {
      this.context.groupParents.set(id, parentId)
      this.queueRescore()
    }

    return () => {
      this.context.groups.delete(id)
      this.context.refs.groupRefs.delete(id)
      if (parentId && this.context.groupParents.get(id) === parentId) {
        this.context.groupParents.delete(id)
      }
    }
  }

  /**
   * Register a mounted row element for positional tracking.
   * Rows are kept in `state.orderedRows` sorted by DOM document position.
   * Call from a layout effect once the element is mounted; the returned
   * cleanup removes the row (call it when the element unmounts).
   *
   * The change reaches `state.orderedRows` at the next
   * `flushPendingRegistrations()`, so rows mounting together cost one sort.
   */
  registerRow(
    id: string,
    element: HTMLElement,
    row: { kind: ListboxRowKind; groupId?: string },
  ): () => void {
    this.context.rowElements.set(id, element)
    this.pendingRows.set(id, { id, kind: row.kind, groupId: row.groupId })
    this.scheduleRegistrationFlush()

    return () => {
      // Only remove if this registration still owns the id (a re-registration
      // for the same id may have replaced the element already).
      if (this.context.rowElements.get(id) === element) {
        this.context.rowElements.delete(id)
        this.pendingRows.set(id, null)
        this.scheduleRegistrationFlush()
      }
    }
  }

  /**
   * Publish the rows and items registered or unregistered since the last
   * flush: one sort of `orderedRows`, one rebuild of the Collection. The list
   * calls this from its layout effect, which runs after its rows' layout
   * effects; registrations that arrive later bump `registrationBatch`, which
   * re-renders the list. Store methods that read registration state call it
   * first, and a microtask covers rows outside a list.
   */
  flushPendingRegistrations() {
    this.registrationBatchOpen = false
    const rows = this.#applyPendingRows(this.#registeredRows)
    if (rows) this.#registeredRows = rows
    if (this.#dataRows) {
      this.#flushDataRows(rows !== null)
    } else {
      if (rows) this.set('orderedRows', rows)

      if (this.pendingRescore || this.pendingRegisteredItems.size > 0) {
        const registered = this.pendingRegisteredItems
        this.pendingRegisteredItems = new Set()
        // A search change may already have recomputed with these items.
        if (this.pendingRescore) {
          this.#publishCollection()
        }
        this.maybeAutoHighlightOnRegister(registered)
      }
    }
    this.#applyPendingAutoHighlight()
  }

  /**
   * `rows` with the rows registered and unregistered since the last flush,
   * in document order, or `null` when none are waiting.
   */
  #applyPendingRows(
    rows: readonly ListboxOrderedRow[],
  ): ListboxOrderedRow[] | null {
    if (this.pendingRows.size === 0) return null
    const pending = this.pendingRows
    this.pendingRows = new Map()
    const next = rows.filter((r) => !pending.has(r.id))
    let added = false
    for (const row of pending.values()) {
      if (row) {
        next.push(row)
        added = true
      }
    }
    if (added) {
      next.sort((a, b) => this.compareRowOrder(a, b))
    }
    return next
  }

  // ==========================================================================
  // The Collection
  //
  // The store keeps one Collection of its surface's rows (`#collection`),
  // which one Collection Adapter (`#adapter`) fills:
  // - DOM: composable JSX rows register (`registerItem`), and the store
  //   scores them against the search. Navigation orders them by document
  //   position when it reads them; with `filter={false}`, by the consumer's
  //   `orderedItems`.
  // - Virtual: a virtualized list's `virtualItems`, mounted or not, in their
  //   order, scored the same way.
  // - Data: a data-first list publishes the rows it already filtered, scored
  //   and ordered (`publishDataRows`). Its rows bind their element and part
  //   props (`bindDataRow`) instead of registering. Rows that still register
  //   next to them (a JSX `Item`, or a `Separator`, `Group`, `Empty` or
  //   `Loading` part) go in among them by document position, for navigation
  //   and positions alike.
  // Navigation reads its `navOrder`. `filteredItems`, `visibleGroups` and
  // `filteredCount` in state are derived from it when the store publishes
  // (a search, a flush, new virtual items); a data-first list's `filteredCount`
  // when it publishes. Positions come from `orderedRows`: the rows that
  // registered their element, in document order, with a data list's bound
  // rows among them.
  // ==========================================================================

  #collection: CollectionSnapshot = emptyCollection
  /**
   * The DOM or Virtual adapter's build before a navigation override: the
   * next build compares against it, so an override never narrows the next.
   */
  #base: CollectionSnapshot = emptyCollection
  #adapter: AdapterKind = 'dom'
  /** Whether the consumer orders the DOM adapter's rows (`orderedItems`). */
  #ordered = false
  /** What `#collection` was built from: rebuilt when any of it changes. */
  #collectionInputs: readonly unknown[] = []

  /** The rows a data-first list published (the Data adapter), or `null`. */
  #dataRows: CollectionSnapshot | null = null
  #boundRows = new Map<string, BoundRow>()
  /** The shortcuts bound rows' parts were given, by key. */
  #boundShortcuts = new Map<string, string>()
  #pendingBoundIds = new Set<string>()
  #dataRowsDirty = false
  /** Rows registered with `registerRow`, in document order. */
  #registeredRows: readonly ListboxOrderedRow[] = []

  /**
   * What the Collection is built from, the adapter first: a data-first
   * list's rows, else a virtualized list's items, else the rows that
   * registered.
   */
  #inputs(): readonly unknown[] {
    const { virtualItems, orderedItems, filter } = this.context
    const { virtualized, normalizedSearch } = this.state
    const adapter: AdapterKind = this.#dataRows
      ? 'data'
      : virtualized && virtualItems.length > 0
        ? 'virtual'
        : 'dom'
    return [
      adapter,
      this.#dataRows,
      virtualItems,
      orderedItems,
      filter === false,
      normalizedSearch,
      virtualized,
    ]
  }

  /** The Collection, rebuilt first when what it's built from changed. */
  #current(): CollectionSnapshot {
    const inputs = this.#inputs()
    const built = this.#collectionInputs
    if (inputs.some((input, i) => input !== built[i])) this.#rebuild()
    return this.#collection
  }

  /** Builds the Collection from its adapter's rows. */
  #rebuild(): void {
    const inputs = this.#inputs()
    const adapter = inputs[0] as AdapterKind
    const previous = this.#collection
    // A build for another adapter has a navigation order of its own.
    const sameAdapter = this.#adapter === adapter
    const { filter, orderedItems } = this.context
    this.#adapter = adapter
    this.#ordered =
      adapter === 'dom' && filter === false && orderedItems.length > 0
    this.#collectionInputs = inputs

    if (adapter === 'data') {
      const data = this.#dataRows!
      const navOrder = mergeByPosition(
        this.#dataNavIds(data),
        this.#registeredItemsOutsideData(data, true),
        (id) => connected(this.#itemElement(id)),
        precedes,
      )
      // The same rows in the same order are the same Collection.
      this.#collection =
        sameAdapter &&
        previous.rows === data.rows &&
        sameIds(previous.navOrder, navOrder)
          ? previous
          : withNavOrder(data, navOrder)
      return
    }

    const { items, groups, groupParents, virtualItems } = this.context
    const rows: ItemRowMeta[] = []
    // Navigation's rows, when not every visible row is one.
    let navigable: ReadonlySet<string> | null = null
    if (adapter === 'virtual') {
      const virtualIds = new Set<string>()
      for (const item of virtualItems) {
        virtualIds.add(item.value)
        const registration = items.get(item.value)
        const row = registrationRow(item.value, registration ?? item)
        // The items array decides which rows navigation skips, mounted or
        // not.
        const disabled = item.disabled ?? false
        rows.push(row.disabled === disabled ? row : { ...row, disabled })
      }
      // Registered rows outside the items array score and count, but
      // navigation doesn't visit them.
      for (const [id, registration] of items) {
        if (!virtualIds.has(id)) rows.push(registrationRow(id, registration))
      }
      navigable = virtualIds
    } else if (this.#ordered) {
      // The consumer's order first; the rows it leaves out show but aren't
      // navigated to.
      const ordered = new Set<string>()
      for (const id of orderedItems) {
        const registration = items.get(id)
        if (!registration || ordered.has(id)) continue
        ordered.add(id)
        rows.push(registrationRow(id, registration))
      }
      for (const [id, registration] of items) {
        if (!ordered.has(id)) rows.push(registrationRow(id, registration))
      }
      navigable = ordered
    } else {
      // Registration order: navigation sorts it by document position.
      for (const [id, registration] of items) {
        rows.push(registrationRow(id, registration))
      }
    }

    // Against the last build, never the last override: an unchanged build
    // returns it, and its every visible enabled row.
    const base = buildSnapshotWithoutPositions(
      filteredSnapshotInput({
        items: rows,
        containers: groups.keys(),
        containerParents: groupParents,
        search: this.state.normalizedSearch,
        filter,
      }),
      sameAdapter ? this.#base : undefined,
    )
    this.#base = base
    this.#collection = navigable
      ? withNavOrder(
          base,
          base.navOrder.filter((id) => navigable.has(id)),
        )
      : base
  }

  /**
   * Rebuilds the Collection and publishes what state derives from it:
   * `filteredItems`, `visibleGroups` and `filteredCount`, and, when the
   * store filters, the highlight it keeps. Runs for a new search, a flush of
   * new registrations and new virtual items.
   */
  #publishCollection(prevSearch?: string) {
    if (this.#dataRows) {
      this.#publishDataResults()
      return
    }
    // Scores every registered item, so a queued rescore is covered.
    this.pendingRescore = false
    this.#rebuild()
    const collection = this.#collection

    const { filter, virtualItems } = this.context
    // The Collection's scores, every item row's. While browsing, a
    // virtualized list's results are its items.
    let filteredItems = collection.scores as Map<string, number>
    let filteredCount = countVisibleItemRows(collection)
    if (
      this.#adapter === 'virtual' &&
      (!this.state.normalizedSearch || filter === false)
    ) {
      filteredItems = new Map()
      for (const item of virtualItems) filteredItems.set(item.value, 1)
      filteredCount = virtualItems.length
    }
    const results = {
      filteredItems,
      visibleGroups: new Set(collection.visibleContainers),
      filteredCount,
      filterTrigger: this.state.filterTrigger + 1,
    }

    // When filter={false}, the consumer moves the highlight with
    // `setOrderedItems`, once its rows are in.
    if (filter === false) {
      this.update(results)
      return
    }
    const highlightedId = this.validateHighlight({
      newSearch: this.state.normalizedSearch,
      prevSearch,
    })
    this.update({
      ...results,
      highlightedId,
      // Auto-highlight shouldn't trigger scroll
      highlightSource: null,
    })
  }

  // ==========================================================================
  // The Data adapter
  // ==========================================================================

  #publishDataRows(snapshot: CollectionSnapshot | null) {
    if (snapshot === null) {
      if (!this.#dataRows) return
      this.flushPendingRegistrations()
      this.#dataRows = null
      this.#pendingBoundIds.clear()
      this.#setDataAdapterState(false, { orderedRows: this.#registeredRows })
      this.queueRescore()
      return
    }

    if (!this.#dataRows) {
      this.#setDataAdapterState(true)
      this.pendingRescore = true
    }
    if (snapshot !== this.#dataRows) this.#dataRowsDirty = true
    this.#dataRows = snapshot
    this.flushPendingRegistrations()
  }

  /**
   * Sets the Data adapter's flag in state, with `changes`. Through
   * `setState`: `update` only looks at string keys, so it would drop the
   * flag's symbol key on its own.
   */
  #setDataAdapterState(on: boolean, changes: Partial<ListboxState> = {}) {
    const next: StateWithDataAdapter = {
      ...this.state,
      ...changes,
      [dataAdapterKey]: on,
    }
    this.setState(next)
  }

  #bindDataRow(id: string, row: BoundRow): () => void {
    this.#boundRows.set(id, row)
    if (row.shortcut) this.#boundShortcuts.set(row.shortcut.toLowerCase(), id)
    this.#pendingBoundIds.add(id)
    this.#dataRowsDirty = true
    this.#scheduleBindFlush()

    return () => {
      if (this.#boundRows.get(id) !== row) return
      this.#boundRows.delete(id)
      const key = row.shortcut?.toLowerCase()
      if (key && this.#boundShortcuts.get(key) === id) {
        this.#boundShortcuts.delete(key)
      }
      this.#pendingBoundIds.delete(id)
      this.#dataRowsDirty = true
      this.#scheduleBindFlush()
    }
  }

  #bindFlushQueued = false

  /**
   * Rows bind in the commit that renders them, and the list's
   * `CollectionPublisher` publishes in that same commit, so a bind doesn't
   * re-render the list the way a registration does. A microtask, which still
   * runs before paint, covers rows that mount without the list rendering.
   */
  #scheduleBindFlush() {
    if (this.#bindFlushQueued) return
    this.#bindFlushQueued = true
    queueMicrotask(() => {
      this.#bindFlushQueued = false
      if (this.#dataRowsDirty || this.#pendingBoundIds.size > 0) {
        this.flushPendingRegistrations()
      }
    })
  }

  /**
   * An item's registration: a data-first row's from the Collection, with what
   * its part overrides while it's bound; a virtualized list's item from the
   * Collection until it mounts; otherwise what the item registered. Read
   * registrations through this, never `context.items`.
   */
  #getRegistration(id: string): ItemRegistration | undefined {
    const data = this.#dataRows
    const fromData = data ? collectionRegistrations(data).get(id) : undefined
    if (!fromData) {
      const registration = this.context.items.get(id)
      if (registration) return registration
      // A virtualized list's item that hasn't mounted: its Collection row.
      const row = this.#current().rows.get(id)
      return this.#adapter === 'virtual' && row && isItemRow(row)
        ? itemRowRegistration(row)
        : undefined
    }
    const bound = this.#boundRows.get(id)
    if (!bound) return fromData
    return {
      ...fromData,
      groupId: bound.groupId,
      disabled: bound.disabled,
      closeOnClick: bound.closeOnClick,
      activatable: bound.activatable,
      isSubmenuTrigger: bound.isSubmenuTrigger,
      shortcut: bound.shortcut,
    }
  }

  /**
   * The item a shortcut key selects, if any. Read shortcuts through this,
   * never `context.shortcuts`.
   */
  #getShortcutItemId(key: string): string | undefined {
    const normalized = key.toLowerCase()
    const data = this.#dataRows
    if (!data) return this.context.shortcuts.get(normalized)
    // A bound row's shortcut is the one its part was given; an unbound row's
    // (outside a virtualized window) is its def's.
    const bound = this.#boundShortcuts.get(normalized)
    if (bound !== undefined) return bound
    const fromData = collectionShortcuts(data).get(normalized)
    if (fromData !== undefined && !this.#boundRows.has(fromData)) {
      return fromData
    }
    return this.context.shortcuts.get(normalized)
  }

  /**
   * Whether navigation can reach an item, disabled or not: registered, a
   * virtualized list's item, or a data-first row that's bound (any
   * data-first row while virtualized, as virtual items count without being
   * mounted).
   */
  #isItemReachable(id: string): boolean {
    if (this.#dataRows?.rows.has(id)) {
      return this.state.virtualized || this.#boundRows.has(id)
    }
    return this.#getRegistration(id) !== undefined
  }

  /** Whether navigation can land on an item: reachable and enabled. */
  #isItemNavigable(id: string): boolean {
    return this.#isItemReachable(id) && !this.#getRegistration(id)?.disabled
  }

  /** The data rows navigation visits, in the list's order. */
  #dataNavIds(data: CollectionSnapshot): string[] {
    const ids: string[] = []
    const { virtualized } = this.state
    for (const id of data.orderedIds) {
      if (!data.visible.has(id)) continue
      const row = data.rows.get(id)
      if (!row || !isItemRow(row)) continue
      const bound = this.#boundRows.get(id)
      if (!bound && !virtualized) continue
      if (!(bound ? bound.disabled : row.disabled)) ids.push(id)
    }
    return ids
  }

  /**
   * The items that registered next to the data rows, in document order.
   * Only rows in the document count.
   */
  #registeredItemsOutsideData(
    data: CollectionSnapshot,
    enabledOnly: boolean,
  ): string[] {
    const ids: string[] = []
    if (this.context.items.size === 0) return ids
    for (const [id, registration] of this.context.items) {
      if (data.rows.has(id)) continue
      if (enabledOnly && registration.disabled) continue
      if (!this.context.refs.itemRefs.get(id)?.current?.isConnected) continue
      ids.push(id)
    }
    if (ids.length > 1) {
      ids.sort((a, b) => {
        const elementA = this.context.refs.itemRefs.get(a)!.current!
        const elementB = this.context.refs.itemRefs.get(b)!.current!
        return precedes(elementA, elementB) ? -1 : 1
      })
    }
    return ids
  }

  #itemElement(id: string): HTMLElement | null | undefined {
    return (
      this.#boundRows.get(id)?.elementRef.current ??
      this.context.refs.itemRefs.get(id)?.current ??
      undefined
    )
  }

  /**
   * Publishes the data rows with what bound, unbound and registered since
   * the last flush, and auto-highlights rows that just came in.
   */
  #flushDataRows(rowsChanged: boolean) {
    if (rowsChanged || this.#dataRowsDirty || this.pendingRescore) {
      this.#dataRowsDirty = false
      this.#publishDataResults()
    }

    const registered = this.#pendingBoundIds
    if (registered.size > 0 || this.pendingRegisteredItems.size > 0) {
      this.#pendingBoundIds = new Set()
      for (const id of this.pendingRegisteredItems) registered.add(id)
      this.pendingRegisteredItems = new Set()
      this.maybeAutoHighlightOnRegister(registered)
    }
  }

  /**
   * Rebuilds the Collection from the data rows and publishes what state
   * derives from them, in one update: positions (`orderedRows`) and the
   * count of the rows shown with the items registered next to them. The
   * list filters its rows, so they change when it publishes.
   */
  #publishDataResults() {
    this.pendingRescore = false
    this.#rebuild()
    const data = this.#dataRows!
    const merged = this.#mergeDataRows(data)
    const filteredCount =
      countVisibleItemRows(data) +
      this.#registeredItemsOutsideData(data, false).length
    const { state } = this
    const orderedRowsChanged = !orderedRowsEqual(merged, state.orderedRows)
    if (orderedRowsChanged || filteredCount !== state.filteredCount) {
      this.update({
        orderedRows: orderedRowsChanged ? merged : state.orderedRows,
        filteredCount,
      })
    }
  }

  /**
   * The rows positions are worked out over: the visible bound data rows in
   * the list's order, with registered rows placed among them by document
   * position.
   */
  #mergeDataRows(data: CollectionSnapshot): ListboxOrderedRow[] {
    const items: ListboxOrderedRow[] = []
    for (const id of data.orderedIds) {
      const bound = this.#boundRows.get(id)
      if (!bound || !data.visible.has(id)) continue
      items.push({ id, kind: 'item', groupId: bound.groupId })
    }
    // Registered rows sort again here: they're few, and a search can move
    // them (a `Group` part that `sortGroups` reorders) without registering
    // again.
    const registered =
      this.#registeredRows.length > 1
        ? [...this.#registeredRows].sort((a, b) => this.compareRowOrder(a, b))
        : this.#registeredRows
    return mergeByPosition(
      items,
      registered,
      (row) =>
        connected(
          this.#boundRows.get(row.id)?.elementRef.current ??
            this.context.rowElements.get(row.id),
        ),
      precedes,
    )
  }

  private scheduleRegistrationFlush() {
    if (this.registrationBatchOpen) return
    this.registrationBatchOpen = true
    this.set('registrationBatch', this.state.registrationBatch + 1)
    // For rows outside a list, which nothing else flushes.
    queueMicrotask(() => this.flushPendingRegistrations())
  }

  private queueRescore() {
    this.pendingRescore = true
    this.scheduleRegistrationFlush()
  }

  /**
   * Compare two rows by DOM document position.
   * Falls back to preserving current relative order when either element
   * is missing or disconnected (Array.prototype.sort is stable).
   */
  private compareRowOrder(a: ListboxOrderedRow, b: ListboxOrderedRow): number {
    const elA = this.context.rowElements.get(a.id)
    const elB = this.context.rowElements.get(b.id)
    if (!elA || !elB || !elA.isConnected || !elB.isConnected) {
      return 0
    }
    const position = elA.compareDocumentPosition(elB)
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
      return -1
    }
    if (position & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1
    }
    return 0
  }

  registerItemSelect(
    id: string,
    onSelect: (() => void) | undefined,
  ): () => void {
    if (onSelect) {
      this.context.itemSelects.set(id, onSelect)
    }
    return () => {
      this.context.itemSelects.delete(id)
    }
  }

  registerSubmenuOpen(
    id: string,
    onOpen: (() => void) | undefined,
  ): () => void {
    if (onOpen) {
      this.context.submenuOpens.set(id, onOpen)
    }
    return () => {
      this.context.submenuOpens.delete(id)
    }
  }

  registerSubmenuClose(
    id: string,
    onClose: (() => void) | undefined,
  ): () => void {
    if (onClose) {
      this.context.submenuCloses.set(id, onClose)
    }
    return () => {
      this.context.submenuCloses.delete(id)
    }
  }

  /**
   * Close all submenus except the one with the given ID.
   * Used when hovering over a new submenu trigger to close sibling submenus.
   */
  closeSiblingSubmenus(exceptId: string | null) {
    for (const [id, onClose] of this.context.submenuCloses) {
      if (id !== exceptId) {
        try {
          onClose()
        } catch {
          // Ignore errors from closing submenus
        }
      }
    }
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  highlightNext() {
    const visibleIds = this.getVisibleItemIds()

    if (visibleIds.length === 0) return

    const currentIndex = this.state.highlightedId
      ? visibleIds.indexOf(this.state.highlightedId)
      : -1
    let nextIndex = currentIndex + 1

    if (nextIndex >= visibleIds.length) {
      nextIndex = this.context.loop ? 0 : visibleIds.length - 1
    }

    const nextId = visibleIds[nextIndex]

    if (nextId) {
      this.setHighlightedId(nextId, 'keyboard')
    }
  }

  highlightPrev() {
    const visibleIds = this.getVisibleItemIds()

    if (visibleIds.length === 0) return

    const currentIndex = this.state.highlightedId
      ? visibleIds.indexOf(this.state.highlightedId)
      : visibleIds.length
    let prevIndex = currentIndex - 1

    if (prevIndex < 0) {
      prevIndex = this.context.loop ? visibleIds.length - 1 : 0
    }

    const prevId = visibleIds[prevIndex]

    if (prevId) {
      this.setHighlightedId(prevId, 'keyboard')
    }
  }

  selectHighlighted() {
    if (this.state.highlightedId) {
      const item = this.#getRegistration(this.state.highlightedId)
      if (item?.activatable === false) return

      const onSelect = this.context.itemSelects.get(this.state.highlightedId)
      onSelect?.()
    }
  }

  /**
   * Select an item by its keyboard shortcut.
   * Returns true if an item was found and selected, false otherwise.
   */
  selectByShortcut(key: string): boolean {
    this.flushPendingRegistrations()
    const itemId = this.#getShortcutItemId(key)
    if (!itemId) return false

    const registration = this.#getRegistration(itemId)
    if (!registration || registration.disabled) return false

    // Check if item is visible (passes filter)
    const data = this.#dataRows
    if (data?.rows.has(itemId)) {
      // A data-first row needs to be shown and mounted: an unmounted row has
      // no select handler to run.
      if (!data.visible.has(itemId) || !this.#boundRows.has(itemId)) {
        return false
      }
    } else if (!data) {
      const isVisible =
        this.state.normalizedSearch.length === 0 ||
        this.#current().visible.has(itemId)
      if (!isVisible) return false
    }

    const onSelect = this.context.itemSelects.get(itemId)
    onSelect?.()
    return true
  }

  openSubmenuForHighlighted() {
    if (this.state.highlightedId) {
      const onOpen = this.context.submenuOpens.get(this.state.highlightedId)
      onOpen?.()
    }
  }

  isHighlightedSubmenuTrigger(): boolean {
    if (!this.state.highlightedId) return false
    return (
      this.#getRegistration(this.state.highlightedId)?.isSubmenuTrigger ?? false
    )
  }

  /**
   * Get the item registration for the highlighted item.
   * Returns undefined if no item is highlighted.
   */
  getHighlightedItem(): ItemRegistration | undefined {
    if (!this.state.highlightedId) return undefined
    return this.#getRegistration(this.state.highlightedId)
  }

  clearSearch() {
    this.setSearch('')
  }

  clearHighlight() {
    this.update({ highlightedId: null, highlightSource: null })
  }

  highlightFirstItem() {
    const visibleIds = this.getVisibleItemIds()
    if (visibleIds.length > 0 && visibleIds[0]) {
      // Don't set a cause - auto-highlight shouldn't trigger scroll
      this.update({ highlightedId: visibleIds[0], highlightSource: null })
    } else {
      this.update({ highlightedId: null, highlightSource: null })
    }
  }

  /**
   * Apply auto-highlight based on the current context.autoHighlightFirst value.
   * Called by Surface after updating the context to ensure correct value is used.
   */
  applyAutoHighlight() {
    if (!this.select('open')) return

    const autoHighlight = this.context.autoHighlightFirst
    this.#pendingAutoHighlight = null
    if (autoHighlight === true) {
      this.highlightFirstItem()
    } else if (typeof autoHighlight === 'string') {
      this.highlightItemByValue(autoHighlight)
      // Its row isn't there yet: highlight it once it arrives.
      if (this.state.highlightedId !== autoHighlight) {
        this.#pendingAutoHighlight = autoHighlight
      }
    }
    // If false, don't highlight anything
  }

  /**
   * A string `autoHighlightFirst` whose row wasn't there when it was
   * applied, while the highlight is still the automatic one: the user hasn't
   * moved it or searched since the menu opened. Cleared once applied, and on
   * close.
   */
  #pendingAutoHighlight: string | null = null
  /** Set while the pending row waits to be applied, or is being applied. */
  #holdingAutoHighlight = false

  /**
   * Highlights the pending `autoHighlightFirst` row once navigation reaches
   * it, after the store moved the highlight automatically: rows arriving
   * after the menu opened (a registration, new virtual items, a data list's
   * rows) put it on the first row until then.
   */
  #applyPendingAutoHighlight() {
    const target = this.#pendingAutoHighlight
    if (target === null || this.#holdingAutoHighlight) return
    if (!this.select('open') || this.context.autoHighlightFirst !== target) {
      this.#pendingAutoHighlight = null
      return
    }
    this.#holdingAutoHighlight = true
    try {
      // Whether navigation reaches it, in any order: no sort to read that.
      if (this.#current().navOrder.includes(target)) {
        this.#pendingAutoHighlight = null
        this.highlightItemByValue(target)
      }
    } finally {
      this.#holdingAutoHighlight = false
    }
  }

  /**
   * Highlight a specific item by its value.
   * If the item is not visible or doesn't exist, falls back to highlighting the first item.
   * Scrolls the highlighted item into view.
   */
  highlightItemByValue(value: string) {
    const visibleIds = this.getVisibleItemIds()
    let highlightedId: string | null = null

    if (visibleIds.includes(value)) {
      // Item exists and is visible - highlight it
      highlightedId = value
    } else if (visibleIds.length > 0 && visibleIds[0]) {
      // Fall back to first item if specified value not found
      highlightedId = visibleIds[0]
    }

    this.update({ highlightedId, highlightSource: null })

    // Scroll the highlighted item into view
    // This is important when opening a combobox with a pre-selected value
    // that may be far down the list
    if (highlightedId) {
      // Use requestAnimationFrame to ensure the DOM has updated
      requestAnimationFrame(() => {
        this.scrollItemIntoView(highlightedId)
      })
    }
  }

  // ============================================================================
  // Internal Helpers
  // ============================================================================

  /**
   * Returns whether filtering is disabled (consumer handles filtering externally).
   */
  isFilterDisabled(): boolean {
    return this.context.filter === false || this.#dataRows !== null
  }

  getVisibleItemIds(): string[] {
    this.flushPendingRegistrations()
    const ids = this.#navIds()
    if (this.#ordered) this.#warnUnregisteredOrderedItems(ids)
    return [...ids]
  }

  /**
   * The rows navigation visits, in order: the Collection's `navOrder`, which
   * the DOM adapter keeps in registration order and sorts by document
   * position here. Registration order drifts when a subset remounts (Fast
   * Refresh effects, Suspense retries, key changes), which made keyboard
   * navigation jump; it's the fallback for rows not in the document.
   */
  #navIds(): readonly string[] {
    const entries = this.#documentEntries()
    return entries
      ? entries.sort(compareByDomOrder).map((entry) => entry.id)
      : this.#collection.navOrder
  }

  /**
   * The DOM adapter's `navOrder` with each row's element, to order by
   * document position, or `null` when the Collection's order stands.
   */
  #documentEntries(): DomOrderEntry[] | null {
    const { navOrder } = this.#current()
    if (this.#adapter !== 'dom' || this.#ordered) return null
    return navOrder.map((id, index) => ({
      id,
      element: this.context.refs.itemRefs.get(id)?.current ?? null,
      index,
    }))
  }

  /**
   * Warns, in development, about `orderedItems` entries that never
   * registered, once some have: keyboard navigation skips them.
   */
  #warnUnregisteredOrderedItems(navOrder: readonly string[]) {
    // No item registered yet: they're likely still mounting, and register
    // shortly (`maybeAutoHighlightOnRegister`).
    if (process.env.NODE_ENV === 'production' || navOrder.length === 0) return
    for (const itemId of this.context.orderedItems) {
      if (this.context.items.has(itemId)) continue
      console.warn(
        `[ListboxStore] Item "${itemId}" is in orderedItems but not registered. ` +
          'This may cause keyboard navigation to skip this item. ' +
          'Make sure the render function passes the `id` prop: <Item {...props}>...</Item>',
      )
    }
  }

  /**
   * Get the index of an item in the visible items list.
   * Returns -1 if the item is not found or not visible.
   */
  getVisibleItemIndex(id: string): number {
    return this.getVisibleItemIds().indexOf(id)
  }

  /**
   * Get the index of an item in the virtualItems array.
   * This is used for virtualizer scrollToIndex which needs the raw array index,
   * not the filtered/visible index.
   * Returns -1 if not found or not in virtualized mode.
   */
  getVirtualItemIndex(value: string): number {
    if (!this.state.virtualized) return -1
    return this.context.virtualItems.findIndex((item) => item.value === value)
  }

  /**
   * Validates and updates the highlighted item.
   * This is the single source of truth for highlight management.
   *
   * @param options.forceFirst - Force highlight first item even if current is valid
   * @param options.newSearch - The search query the Collection was built for (to detect search cleared)
   */
  private validateHighlight(
    options: ValidateHighlightOptions = {},
  ): string | null {
    // Before reading defaults from state. A no-op when called from the flush.
    this.flushPendingRegistrations()
    const {
      forceFirst = false,
      newSearch,
      prevSearch: optionsPrevSearch,
    } = options

    // Determine if search changed (requires reset to first item)
    // Use prevSearch from options if provided (from observer), otherwise fall back to state
    const prevSearch =
      optionsPrevSearch !== undefined
        ? optionsPrevSearch
        : this.state.normalizedSearch
    const searchChanged = newSearch !== undefined && newSearch !== prevSearch

    // If not open or autoHighlightFirst disabled, don't change anything
    if (!this.select('open') || !this.context.autoHighlightFirst) {
      return this.state.highlightedId
    }

    const currentHighlight = this.state.highlightedId
    // If search changed, force reset to first item
    const shouldForceFirst = forceFirst || searchChanged
    const keep =
      currentHighlight !== null &&
      !shouldForceFirst &&
      this.#canKeepHighlight(currentHighlight)
    const next = keep ? currentHighlight : this.#firstNavigable()

    // Only update if highlight actually changed
    if (next !== currentHighlight) {
      this.update({
        highlightedId: next,
        highlightSource: null, // Auto-highlight shouldn't trigger scroll
      })
    }
    return next
  }

  /** Whether a highlighted item can keep the highlight. */
  #canKeepHighlight(id: string): boolean {
    // A data-first list's rows, virtualized or not: one navigation can still
    // reach. A row registered next to them always shows.
    const data = this.#dataRows
    if (data) {
      return (
        this.#isItemNavigable(id) &&
        (data.visible.has(id) || !data.rows.has(id))
      )
    }
    // With `filter={false}` the store never validates (the consumer moves
    // the highlight with `setOrderedItems`), so `orderedItems` mode needs no
    // rule of its own here.
    const collection = this.#current()
    if (this.#adapter === 'virtual') {
      // A virtualized list's item, shown, and enabled by its mounted row's
      // part when it has one, else by the item.
      const item = this.context.virtualItems.find((v) => v.value === id)
      const disabled =
        this.context.items.get(id)?.disabled ?? item?.disabled ?? false
      return item !== undefined && collection.visible.has(id) && !disabled
    }
    return collection.navOrder.includes(id)
  }

  /** The item an automatic highlight goes to: the first navigation visits. */
  #firstNavigable(): string | null {
    // A data-first list's own first row, before rows registered next to it.
    const data = this.#dataRows
    if (data) return this.#dataNavIds(data)[0] ?? null
    const entries = this.#documentEntries()
    if (!entries) return this.#collection.navOrder[0] ?? null
    // The first in document order, without sorting them all: a search asks
    // on every key.
    let first: DomOrderEntry | null = null
    for (const entry of entries) {
      if (first === null || compareByDomOrder(entry, first) < 0) first = entry
    }
    return first?.id ?? null
  }

  // ============================================================================
  // Static Factory
  // ============================================================================

  static useStore(
    externalStore: ListboxStore | undefined,
    initialState?: Partial<ListboxState>,
    context?: Partial<ListboxContext>,
  ): ListboxStore {
    const store = useRefWithInit(() => {
      return externalStore ?? new ListboxStore(initialState, context)
    }).current

    return store
  }
}

// ============================================================================
// Initial State Factory
// ============================================================================

function createInitialState(): ListboxState {
  return {
    open: false,
    openProp: undefined,
    openMethod: null,
    search: '',
    searchProp: undefined,
    normalizedSearch: '',
    highlightedId: null,
    highlightSource: null,
    hasInput: false,
    inputActive: false,
    pendingSearch: '',
    filteredItems: new Map(),
    visibleGroups: new Set(),
    filteredCount: 0,
    filterTrigger: 0,
    virtualized: false,
    virtualItemsCount: 0,
    orderedRows: [],
    registrationBatch: 0,
  }
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type { ListboxContext as Context, ListboxState as State }
