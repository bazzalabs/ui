import { ReactStore } from '@base-ui/utils/store'
import {
  type CellRequestResult,
  createCell,
  ElementRegistry,
  EMPTY_LOADER_SCOPE_SNAPSHOT,
  LoaderManager,
  type LoaderScopeSnapshot,
  type OpenRequestResult,
} from '@bazza-ui/menu-core'
import { ListboxStore } from '../../listbox/index.js'
import {
  attachOpenOwner,
  type CloseCause,
  changeOpen,
  controlOpenCell,
  getOpenOwner,
  type OpenCell,
  type OpenRequest,
  requestStoreOpen,
} from '../../listbox/store/ListboxStore.js'
import type { PopupMenuDebugContextValue } from '../contexts/popup-menu-debug-context.js'
import type { RootRevealState } from '../data-first/async-coordinator.js'
import type {
  DataSurfaceContextValue,
  ResolvedNodesSlot,
} from '../data-first/context.js'
import type {
  AsyncLoaderConfig,
  AsyncLoaderResult,
  NodeDef,
} from '../data-first/types.js'
import type {
  PopupMenuOpenChangeEventDetails,
  PopupMenuOpenChangeReason,
} from '../events.js'
import type { MenuTreeResolver } from '../menu-tree/resolver.js'
import { FocusOwnerStore } from './FocusOwnerStore.js'
import { OpenChainStore } from './OpenChainStore.js'

// ============================================================================
// Types
// ============================================================================

/** The menu tree's loaders: every data surface's, by scope. */
export type TreeLoaderManager = LoaderManager<
  NodeDef[],
  AsyncLoaderResult<NodeDef[]>,
  AsyncLoaderConfig
>

/** One data surface's loaders, as the tree's `LoaderManager` holds them. */
export type LoaderScopeLoaders = LoaderScopeSnapshot<
  NodeDef[],
  AsyncLoaderResult<NodeDef[]>,
  AsyncLoaderConfig
>

/** What a graft reads of a data surface's loaders: their results and errors. */
export type LoaderResults = LoaderScopeLoaders['results']

/**
 * One data surface's loaders: what its coordinator
 * (`useAsyncMenuCoordinator`) reads. Replaced, never changed, on each update.
 */
export interface LoaderScope {
  /** Its loaders: the tree's `LoaderManager`'s snapshot of the scope. */
  loaders: LoaderScopeLoaders
  /**
   * The root content's reveal as its list last published it: whether the
   * root loader had settled once the list showed its rows (so `Empty` never
   * reads a settle before the rows it brings), and whether the surface holds
   * its rows back until then (`asyncContentReveal: 'block'`).
   */
  reveal: RootRevealState
}

/**
 * Applies a loader scope's results to the resolved tree; returns whether any
 * node's children changed. Registered by the scope's data list.
 */
export type Grafter = (results: LoaderResults) => boolean

export const EMPTY_LOADER_SCOPE: LoaderScope = {
  loaders: EMPTY_LOADER_SCOPE_SNAPSHOT,
  reveal: { settled: true, settledOnce: false, block: false },
}

/**
 * What a popup's data-first subpages come from, besides the tree's nodes
 * (`DataPopupContext` is derived from it). Kept until the popup unmounts.
 */
export interface PopupData {
  /** The popup's root data surface, while one is mounted. */
  surface?: DataSurfaceContextValue | null
  /** The content the popup's root list last resolved. */
  content?: NodeDef[]
  /** The root loader's rows the root list last resolved with it. */
  loaded?: readonly NodeDef[]
  /** The `asyncContent` config those rows came from. */
  loadedBy?: AsyncLoaderConfig
  /** A slot a consumer set with `setResolvedNodes`, in place of the tree's. */
  slot?: ResolvedNodesSlot | null
}

const EMPTY_POPUP: PopupData = {}

/** `object` with `changes`, or `object` itself when they change nothing. */
export function patch<T extends object>(object: T, changes: Partial<T>): T {
  for (const key in changes) {
    if (changes[key] !== object[key]) return { ...object, ...changes }
  }
  return object
}

export interface MenuTreeState {
  /**
   * The root's debug flags (development tools), synced from its `debug`
   * prop; `null` until its providers first sync them, which the tree tier's
   * `initialDebug` stands for until then (`usePopupMenuDebug`).
   */
  debug: PopupMenuDebugContextValue | null
  /** The root's `disabled` prop. */
  disabledProp: boolean
  /** Whether the root's actions disabled it (`setDisabled`). */
  disabledByActions: boolean
  /** Each data surface's loaders, by its scope id. */
  loaders: Readonly<Record<string, LoaderScope>>
  /** Each popup's data, by the popup's surface id. */
  popups: Readonly<Record<string, PopupData>>
  /**
   * The resolved tree's version: it changes, in the same update, with every
   * graft or content change that alters a node's children.
   */
  version: number
}

/** A data surface's loaders, by its scope id. */
export const selectLoaders = (
  state: Pick<MenuTreeState, 'loaders'>,
  scopeId: string,
): LoaderScope => state.loaders[scopeId] ?? EMPTY_LOADER_SCOPE

/** Whether the root ignores user interaction: its prop, or its actions. */
export const selectDisabled = (
  state: Pick<MenuTreeState, 'disabledProp' | 'disabledByActions'>,
) => state.disabledProp || state.disabledByActions

const selectors = {
  debug: (state: MenuTreeState) => state.debug,
  disabled: selectDisabled,
  disabledByActions: (state: MenuTreeState) => state.disabledByActions,
  loaders: selectLoaders,
  popup: (state: MenuTreeState, popupId: string) =>
    state.popups[popupId] ?? EMPTY_POPUP,
  version: (state: MenuTreeState) => state.version,
}

export interface MenuTreeOptions {
  /** The tree's resolver. */
  resolver: MenuTreeResolver
  /** The tree's open submenu chain. A new one when left out. */
  openChain?: OpenChainStore
  /** The tree's focus owner. A new one when left out. */
  focusOwner?: FocusOwnerStore
  /** The elements the tree renders, when another tree shares them. */
  elements?: ElementRegistry
  /** Whether the root starts open. */
  open?: boolean
  /** The root's first `disabled` prop. */
  disabled?: boolean
  /** Whether the root starts disabled by its actions (`defaultDisabled`). */
  defaultDisabled?: boolean
  /** The consumer's root `onOpenChange`; it may cancel the change. */
  onOpenChange?: (
    open: boolean,
    eventDetails: PopupMenuOpenChangeEventDetails,
  ) => void
  /**
   * Asks the root to open or close through its gate (`ask`). Kept for the
   * tree's lifetime, so pass one that stays the same and calls the latest.
   */
  ask?: MenuTreeStore['ask']
}

/** How `MenuTreeStore.ask` asks: see there. */
export interface RootAskOptions {
  /**
   * A close the engine makes (`closeAll`, a Combobox closing itself), which
   * goes through while the menu is disabled.
   */
  readonly engine?: boolean
  /** What the root's submenus are told when the root closes. */
  readonly cause?: CloseCause
}

/** How a surface the root closes with it is closed (`registerSurface`). */
export type TreeSurfaceSetOpen = (
  open: boolean,
  reason?: PopupMenuOpenChangeReason,
  event?: Event,
) => void

// ============================================================================
// Store
// ============================================================================

/**
 * What one menu tree shares: the root's open cell, its open submenu chain and
 * focus owner, the elements it renders, its resolver and its loaders' results,
 * and the root's settings (its debug flags and `disabled`) and own surfaces.
 * One per root, shared by its submenus. The open cell's mirrors (`open`,
 * `openProp`, `openMethod`) are the root surface's `ListboxStore` state
 * (`createRootStore`); each surface keeps the rest in its own store.
 *
 * A loader result reaches the resolved tree in the update that records it
 * (`updateLoaders`): the scope's grafter applies it, and `version` changes
 * with it, so every reader renders the new tree in one commit.
 */
export class MenuTreeStore extends ReactStore<
  MenuTreeState,
  Record<string, never>,
  typeof selectors
> {
  /** The open submenu surfaces, outermost first. */
  readonly openChain: OpenChainStore
  /** The surface that owns focus. */
  readonly focusOwner: FocusOwnerStore
  /** The single resolved node tree of this root. */
  readonly resolver: MenuTreeResolver
  /**
   * The elements the menu tree renders (see "Tree membership" in
   * packages/react/AGENTS.md). Its root sets the exempt elements.
   */
  readonly elements: ElementRegistry

  // The root's own submenus and subpages, closed when it closes
  // (`closeSurfaces`); each submenu closes its own.
  readonly #surfaces = new Set<{ depth: number; setOpen: TreeSurfaceSetOpen }>()
  readonly #onOpenChange: MenuTreeOptions['onOpenChange']
  readonly #grafters = new Map<string, Grafter>()
  #loaderManager: TreeLoaderManager | undefined

  // The root's controlled open. The root surface's store mirrors it, written
  // in the same update: by `setOpen` and `control`.
  readonly #cells: { open: OpenCell }

  #root: ListboxStore | undefined

  constructor(options: MenuTreeOptions) {
    super(
      {
        debug: null,
        disabledProp: options.disabled ?? false,
        disabledByActions: options.defaultDisabled ?? false,
        loaders: {},
        popups: {},
        version: 0,
      },
      {},
      selectors,
    )
    this.resolver = options.resolver
    this.openChain = options.openChain ?? new OpenChainStore()
    this.focusOwner = options.focusOwner ?? new FocusOwnerStore()
    this.elements = options.elements ?? new ElementRegistry()
    this.#onOpenChange = options.onOpenChange
    this.ask = options.ask
    this.#cells = {
      open: createCell<boolean, OpenRequest>(options.open ?? false),
    }
  }

  /**
   * The root surface's `ListboxStore`: its `setOpen` and `openProp` sync come
   * here, and its `open`, `openProp` and `openMethod` mirror this tree's cell.
   */
  createRootStore(): ListboxStore {
    const store = new ListboxStore({ open: this.#cells.open.internal })
    attachOpenOwner(store, this)
    this.#root = store
    return store
  }

  /**
   * Requests the root's open state. The consumer's `onOpenChange` runs first;
   * a canceled change, or one to a controlled value, leaves it as it is.
   */
  setOpen(open: boolean, reason?: PopupMenuOpenChangeReason, event?: Event) {
    this.requestOpen(open, reason, event)
  }

  /**
   * `setOpen`, past no gate, returning what became of it (`changeOpen`).
   * `cause` is what the root's submenus are told when the root closes
   * (`getCloseCause`); the request's reason and event when left out.
   */
  requestOpen(
    open: boolean,
    reason?: PopupMenuOpenChangeReason,
    event?: Event,
    cause?: CloseCause,
  ): CellRequestResult {
    if (!this.#root) return 'noop'
    return changeOpen(
      this.#root,
      this.#cells,
      this.#onOpenChange,
      open,
      reason,
      event,
      cause,
    )
  }

  /**
   * Asks the root to open or close through its gate (the close policy, then
   * `requestOpen`), and returns what became of it: what a root adapter
   * mirrors to Base UI's details. Set when the root makes the tree
   * (`usePopupMenuRoot`); unset on a tree made around stores a root was
   * given.
   */
  readonly ask:
    | ((
        open: boolean,
        reason: PopupMenuOpenChangeReason,
        event?: Event,
        options?: RootAskOptions,
      ) => OpenRequestResult)
    | undefined

  /** The root's open cell, with its pending request. */
  get openCell(): OpenCell {
    return this.#cells.open
  }

  /** Syncs the root's controlled `open` prop into the cell. */
  control(open: boolean | undefined) {
    if (this.#root) controlOpenCell(this.#root, this.#cells, open)
  }

  /** Clears the focus owner and the open chain: the tree closed. */
  clear() {
    this.focusOwner.clearOwner()
    this.openChain.clear()
  }

  /** Disables or enables the root, as its actions' `setDisabled` does. */
  setDisabled(disabled: boolean) {
    this.set('disabledByActions', disabled)
  }

  /**
   * Registers one of the root's own submenus or subpages, which close when
   * the root does (`closeSurfaces`). Returns its removal. Stable: it's handed
   * on as the root's `registerSurface`.
   */
  readonly registerSurface = (
    depth: number,
    setOpen: TreeSurfaceSetOpen,
  ): (() => void) => {
    const surface = { depth, setOpen }
    this.#surfaces.add(surface)
    return () => {
      this.#surfaces.delete(surface)
    }
  }

  /** Closes the root's own surfaces: the root closed, with `reason`. */
  closeSurfaces(reason: PopupMenuOpenChangeReason, event?: Event) {
    for (const surface of [...this.#surfaces]) {
      surface.setOpen(false, reason, event)
    }
  }

  /**
   * The tree's loaders, made when the first data surface starts one. Each
   * change to a scope reaches the tree's state in one update, with the graft
   * of its results (`updateLoaders`).
   */
  loaderManager(): TreeLoaderManager {
    if (!this.#loaderManager) {
      const manager: TreeLoaderManager = new LoaderManager()
      manager.subscribe((scopeId) => {
        const scope = this.state.loaders[scopeId]
        const loaders = manager.scope(scopeId)
        if (!scope && loaders === EMPTY_LOADER_SCOPE_SNAPSHOT) return
        this.updateLoaders(scopeId, (current) => patch(current, { loaders }))
      })
      this.#loaderManager = manager
    }
    return this.#loaderManager
  }

  /** A data surface's search changed: its loaders, if any, follow it. */
  setLoaderSearch(scopeId: string, search: string) {
    this.#loaderManager?.setSearch(scopeId, search)
  }

  /**
   * Updates one data surface's loaders with `recipe`, which returns the scope
   * unchanged when nothing changes. The scope's grafter applies new results
   * to the tree in the same update.
   */
  updateLoaders(scopeId: string, recipe: (scope: LoaderScope) => LoaderScope) {
    const current = this.select('loaders', scopeId)
    const next = recipe(current)
    if (next === current) return
    const { version } = this.state
    const grafted =
      next.loaders.results !== current.loaders.results &&
      this.#grafters.get(scopeId)?.(next.loaders.results)
    this.update({
      loaders: { ...this.state.loaders, [scopeId]: next },
      version: grafted ? version + 1 : version,
    })
  }

  /** Forgets a data surface's loaders: its surface unmounted. */
  dropLoaders(scopeId: string) {
    const { [scopeId]: dropped, ...loaders } = this.state.loaders
    if (dropped) this.set('loaders', loaders)
    this.#loaderManager?.drop(scopeId)
  }

  /** Sets how a data surface's results reach the tree; returns its removal. */
  setGrafter(scopeId: string, grafter: Grafter): () => void {
    this.#grafters.set(scopeId, grafter)
    return () => {
      if (this.#grafters.get(scopeId) === grafter)
        this.#grafters.delete(scopeId)
    }
  }

  /** Updates a popup's data, or forgets it (`null`): the popup unmounted. */
  updatePopup(popupId: string, changes: PopupData | null) {
    const { [popupId]: current = EMPTY_POPUP, ...popups } = this.state.popups
    const next = changes && patch(current, changes)
    // A popup with nothing set needs no entry (a surface unregistering after
    // its popup forgot it).
    if (
      next === current ||
      (current === EMPTY_POPUP && !Object.values(next ?? {}).some(Boolean))
    ) {
      return
    }
    this.set('popups', next ? { ...popups, [popupId]: next } : popups)
  }

  /**
   * Tells the tree's readers that a list changed it while rendering (its
   * content resolved synchronously, ADR-0002).
   */
  publishResolved() {
    this.set('version', this.state.version + 1)
  }
}

/**
 * Asks the menu root whose surface store is `store` to open or close
 * through its gate (`MenuTreeStore.ask`), and returns what became of it. A
 * store with no menu tree around it is asked itself.
 */
export function askRootOpen(
  store: ListboxStore,
  open: boolean,
  reason: PopupMenuOpenChangeReason,
  event?: Event,
  options?: RootAskOptions,
): OpenRequestResult {
  const owner = getOpenOwner(store)
  if (owner instanceof MenuTreeStore && owner.ask) {
    return owner.ask(open, reason, event, options)
  }
  return requestStoreOpen(store, open, reason, event, options?.cause)
}

/** Base UI's details of an open change it started (a popover's, a dialog's). */
export interface BaseUIOpenChangeDetails {
  readonly reason: string
  readonly event: Event | undefined
  cancel(): void
}

/**
 * Cancels Base UI's details of a change it started that didn't go through:
 * the consumer canceled it, the close policy refused it, or the adapter
 * kept it from being asked (`null`). Base UI then skips what it does with
 * the change (its dismissal's side effects, such as `preventDefault()` on
 * Escape). A `noop` (nothing to change) and a change taken stay as they are.
 * The one rule for what Base UI is told: every adapter applies it, through
 * `askFromBaseUI` or, with a request of its own, directly.
 */
export function mirrorToBaseUI(
  result: OpenRequestResult | null,
  details: { cancel(): void },
): void {
  if (result === 'canceled' || result === 'refused' || result === null) {
    details.cancel()
  }
}

/**
 * A root adapter's Base UI `onOpenChange`: asks the root whose surface store
 * is `store` (`askRootOpen`), and tells Base UI what became of it
 * (`mirrorToBaseUI`).
 */
export function askFromBaseUI(
  store: ListboxStore,
  open: boolean,
  details: BaseUIOpenChangeDetails,
): void {
  mirrorToBaseUI(
    askRootOpen(
      store,
      open,
      details.reason as PopupMenuOpenChangeReason,
      details.event,
    ),
    details,
  )
}
