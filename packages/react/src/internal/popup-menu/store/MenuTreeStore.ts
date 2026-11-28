import { ReactStore } from '@base-ui/utils/store'
import {
  type ControlledCell,
  createCell,
  ElementRegistry,
} from '@bazza-ui/menu-core'
import { ListboxStore } from '../../listbox/index.js'
import {
  attachOpenOwner,
  type CloseCause,
  changeOpen,
  controlOpenCell,
} from '../../listbox/store/ListboxStore.js'
import type {
  AsyncMenuState,
  RootAsyncMenuState,
  RootRevealState,
} from '../data-first/async-coordinator.js'
import type {
  DataSurfaceContextValue,
  ResolvedNodesSlot,
} from '../data-first/context.js'
import type { AsyncLoaderConfig, NodeDef } from '../data-first/types.js'
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

/**
 * One data surface's loaders: what its coordinator
 * (`useAsyncMenuCoordinator`) reads. Replaced, never changed, on each update.
 */
export interface LoaderScope {
  /** Branch loaders, by the branch's Resolved ID. */
  loaders: Map<string, AsyncMenuState>
  erroredLoaders: Map<string, Error>
  /** The surface's own `asyncContent` loader. */
  root: RootAsyncMenuState | null
  rootError: Error | null
  rootReveal: RootRevealState
}

/**
 * Applies a loader scope's results to the resolved tree; returns whether any
 * node's children changed. Registered by the scope's data list.
 */
export type Grafter = (scope: LoaderScope) => boolean

export const EMPTY_LOADER_SCOPE: LoaderScope = {
  loaders: new Map(),
  erroredLoaders: new Map(),
  root: null,
  rootError: null,
  rootReveal: { settled: true, settledOnce: false, block: false },
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

const selectors = {
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
  /** The consumer's root `onOpenChange`; it may cancel the change. */
  onOpenChange?: (
    open: boolean,
    eventDetails: PopupMenuOpenChangeEventDetails,
  ) => void
  /**
   * Closes the whole tree through the root's gate (`closeTree`). Kept for
   * the tree's lifetime, so pass one that stays the same and calls the latest.
   */
  closeTree?: MenuTreeStore['closeTree']
}

// ============================================================================
// Store
// ============================================================================

let elementsOf: (tree: MenuTreeStore) => ElementRegistry

/**
 * The elements the menu tree renders (see "Tree membership" in
 * packages/react/AGENTS.md). Its root sets the exempt elements.
 */
export function getElementRegistry(tree: MenuTreeStore): ElementRegistry {
  return elementsOf(tree)
}

/**
 * What one menu tree shares: the root's open cell, its open submenu chain and
 * focus owner, the elements it renders, its resolver and its loaders' results.
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
  static {
    elementsOf = (tree) => tree.#elements
  }

  /** The open submenu surfaces, outermost first. */
  readonly openChain: OpenChainStore
  /** The surface that owns focus. */
  readonly focusOwner: FocusOwnerStore
  /** The single resolved node tree of this root. */
  readonly resolver: MenuTreeResolver

  readonly #elements: ElementRegistry
  readonly #onOpenChange: MenuTreeOptions['onOpenChange']
  readonly #grafters = new Map<string, Grafter>()

  // The root's controlled open. The root surface's store mirrors it, written
  // in the same update: by `setOpen` and `control`.
  readonly #cells: { open: ControlledCell<boolean> }

  #root: ListboxStore | undefined

  constructor(options: MenuTreeOptions) {
    super({ loaders: {}, popups: {}, version: 0 }, {}, selectors)
    this.resolver = options.resolver
    this.openChain = options.openChain ?? new OpenChainStore()
    this.focusOwner = options.focusOwner ?? new FocusOwnerStore()
    this.#elements = options.elements ?? new ElementRegistry()
    this.#onOpenChange = options.onOpenChange
    this.closeTree = options.closeTree
    this.#cells = { open: createCell(options.open ?? false) }
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
   * `setOpen`, returning the details the consumer saw. `cause` is what the
   * root's submenus are told when the root closes (`getCloseCause`); the
   * request's reason and event when left out.
   */
  requestOpen(
    open: boolean,
    reason?: PopupMenuOpenChangeReason,
    event?: Event,
    cause?: CloseCause,
  ): PopupMenuOpenChangeEventDetails | null {
    if (!this.#root) return null
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
   * Closes the whole tree through the root's gate, as a close the engine
   * makes, reported to the root's consumer with `reason` and `event`;
   * `cause` is what its submenus are told. Set when the root makes the tree
   * (`usePopupMenuRoot`); unset on a tree made around stores a root was
   * given.
   */
  readonly closeTree:
    | ((
        reason: PopupMenuOpenChangeReason,
        event?: Event,
        cause?: CloseCause,
      ) => void)
    | undefined

  /** Syncs the root's controlled `open` prop into the cell. */
  control(open: boolean | undefined) {
    if (this.#root) controlOpenCell(this.#root, this.#cells, open)
  }

  /** Clears the focus owner and the open chain: the tree closed. */
  clear() {
    this.focusOwner.clearOwner()
    this.openChain.clear()
  }

  /**
   * Updates one data surface's loaders with `recipe`, which returns the scope
   * unchanged when nothing changes. The scope's grafter applies the new
   * results to the tree in the same update.
   */
  updateLoaders(scopeId: string, recipe: (scope: LoaderScope) => LoaderScope) {
    const current = this.select('loaders', scopeId)
    const next = recipe(current)
    if (next === current) return
    const { version } = this.state
    this.update({
      loaders: { ...this.state.loaders, [scopeId]: next },
      version: this.#grafters.get(scopeId)?.(next) ? version + 1 : version,
    })
  }

  /** Forgets a data surface's loaders: its surface unmounted. */
  dropLoaders(scopeId: string) {
    const { [scopeId]: dropped, ...loaders } = this.state.loaders
    if (dropped) this.set('loaders', loaders)
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
