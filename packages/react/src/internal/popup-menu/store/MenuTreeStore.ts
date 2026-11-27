import {
  type ControlledCell,
  createCell,
  ElementRegistry,
} from '@bazza-ui/menu-core'
import { ListboxStore } from '../../listbox/index.js'
import {
  attachOpenOwner,
  changeOpen,
  controlCell,
} from '../../listbox/store/ListboxStore.js'
import type {
  PopupMenuOpenChangeEventDetails,
  PopupMenuOpenChangeReason,
} from '../events.js'
import { FocusOwnerStore } from './FocusOwnerStore.js'
import { OpenChainStore } from './OpenChainStore.js'

// ============================================================================
// Types
// ============================================================================

export interface MenuTreeOptions {
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
 * focus owner, and the elements it renders. One per root, shared by its
 * submenus. The open cell's mirrors (`open`, `openProp`, `openMethod`) are the
 * root surface's `ListboxStore` state (`createRootStore`); each surface keeps
 * the rest in its own store.
 */
export class MenuTreeStore {
  static {
    elementsOf = (tree) => tree.#elements
  }

  /** The open submenu surfaces, outermost first. */
  readonly openChain: OpenChainStore
  /** The surface that owns focus. */
  readonly focusOwner: FocusOwnerStore

  readonly #elements: ElementRegistry
  readonly #onOpenChange: MenuTreeOptions['onOpenChange']

  // The root's controlled open. The root surface's store mirrors it, written
  // in the same update: by `setOpen` and `control`.
  readonly #cells: { open: ControlledCell<boolean> }

  #root: ListboxStore | undefined

  constructor(options: MenuTreeOptions = {}) {
    this.openChain = options.openChain ?? new OpenChainStore()
    this.focusOwner = options.focusOwner ?? new FocusOwnerStore()
    this.#elements = options.elements ?? new ElementRegistry()
    this.#onOpenChange = options.onOpenChange
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
    if (!this.#root) return
    changeOpen(this.#root, this.#cells, this.#onOpenChange, open, reason, event)
  }

  /** Syncs the root's controlled `open` prop into the cell. */
  control(open: boolean | undefined) {
    if (this.#root) controlCell(this.#root, this.#cells, 'open', open)
  }

  /** Clears the focus owner and the open chain: the tree closed. */
  clear() {
    this.focusOwner.clearOwner()
    this.openChain.clear()
  }
}
