import type { Virtualizer } from '@tanstack/react-virtual'
import type * as React from 'react'
import type {
  ActivationCause,
  LoaderProgress,
  LoadMode,
  Menu,
  Node,
  RootMenuDef,
  RowRecord,
} from '../types.js'

/**
 * Minimal constraint for menu definitions.
 * Any object with an `id` property satisfies this.
 */
export type MenuDefLike = { id: string }

/**
 * Minimal constraint for runtime menus.
 * Must have `kind`, `id`, and `nodes` array.
 */
export type MenuLike = { kind: string; id: string; nodes: any[] }

/**
 * Minimal constraint for runtime nodes.
 * Must have `kind` and `id`.
 */
export type NodeLike = { kind: string; id: string }

/**
 * DOM refs for a surface. Created once on registration and reused.
 */
export type SurfaceRefs = {
  /** Search input element */
  inputRef: React.RefObject<HTMLInputElement | null>
  /** List container element */
  listRef: React.RefObject<HTMLDivElement | null>
  /** TanStack Virtual virtualizer instance */
  virtualizerRef: React.RefObject<Virtualizer<HTMLDivElement, Element> | null>
  /** Flag to ignore pointer events during keyboard navigation */
  ignorePointerRef: React.MutableRefObject<boolean>
}

/**
 * State slice for a single menu surface (root or submenu).
 * Fully generic over data type and specific menu/node types.
 *
 * Note: Named MenuSurfaceSlice to avoid conflict with legacy SurfaceState in types.ts
 */
export type MenuSurfaceSlice<
  TData = unknown,
  TMenuDef extends MenuDefLike = RootMenuDef<TData>,
  TMenu extends MenuLike = Menu<TData>,
  TNode extends NodeLike = Node<TData>,
> = {
  /** Unique surface identifier */
  id: string
  /** Depth in menu tree (0 = root) */
  depth: number
  /** Parent surface ID (null for root) */
  parentId: string | null
  /** Whether surface is open/visible */
  open: boolean
  /** Current search query */
  query: string
  /** Currently active/focused item ID */
  activeId: string | null
  /** Whether search input is focused */
  inputActive: boolean

  // ─────────────────────────────────────────────────────────────────
  // DOM Refs (created once on registration)
  // ─────────────────────────────────────────────────────────────────

  /** DOM refs for this surface */
  refs: SurfaceRefs

  // ─────────────────────────────────────────────────────────────────
  // Row Registry (for keyboard navigation)
  // ─────────────────────────────────────────────────────────────────

  /** Registered rows with their metadata */
  rows: Map<string, RowRecord>
  /** Map from row ID to virtual index (for virtualized lists) */
  rowIdToVirtualIndex: Map<string, number>
  /** Ordered list of navigable row IDs */
  order: string[]

  // ─────────────────────────────────────────────────────────────────
  // Node State
  // ─────────────────────────────────────────────────────────────────

  /** Original menu definition (may be undefined until set by Surface) */
  menuDef: TMenuDef | undefined
  /** Instantiated menu with runtime nodes */
  menu: TMenu | null
  /** Nodes after search/filter */
  filteredNodes: TNode[]
  /** Nodes after middleware (render-ready) */
  displayNodes: TNode[]

  // ─────────────────────────────────────────────────────────────────
  // Loading State
  // ─────────────────────────────────────────────────────────────────

  /** Whether async loader is fetching */
  isLoading: boolean
  /** Loader error if any */
  error: Error | null
  /** Loading progress for streaming mode */
  loadingProgress: {
    mode: LoadMode
    completedPaths: string[]
    inProgressPaths: string[]
    progress: LoaderProgress[]
  } | null
}

/**
 * Base menu store state - generic over all type parameters.
 */
export type BaseMenuStoreState<
  TData = unknown,
  TMenuDef extends MenuDefLike = RootMenuDef<TData>,
  TMenu extends MenuLike = Menu<TData>,
  TNode extends NodeLike = Node<TData>,
> = {
  /** Root-level state */
  root: {
    scopeId: string
    open: boolean
    disabled: boolean
  }
  /** Surface registry (keyed by surface ID) */
  surfaces: Map<string, MenuSurfaceSlice<TData, TMenuDef, TMenu, TNode>>
  /** Focus ownership */
  focus: {
    ownerId: string | null
  }
  /** Keyboard configuration */
  keyboard: {
    dir: 'ltr' | 'rtl'
    vimBindings: boolean
  }
}

/**
 * Base menu store actions - generic over all type parameters.
 */
export type BaseMenuStoreActions<
  TData = unknown,
  TMenuDef extends MenuDefLike = RootMenuDef<TData>,
  TMenu extends MenuLike = Menu<TData>,
  TNode extends NodeLike = Node<TData>,
> = {
  // Root actions
  setOpen: (open: boolean) => void
  setDisabled: (disabled: boolean) => void
  setKeyboard: (
    opts: Partial<{ dir: 'ltr' | 'rtl'; vimBindings: boolean }>,
  ) => void

  // Surface lifecycle
  registerSurface: (
    id: string,
    opts: { depth: number; parentId?: string | null; menuDef?: TMenuDef },
  ) => void
  unregisterSurface: (id: string) => void

  // Surface state updates
  setSurfaceOpen: (surfaceId: string, open: boolean) => void
  setSurfaceQuery: (surfaceId: string, query: string) => void
  setSurfaceActiveId: (
    surfaceId: string,
    id: string | null,
    cause?: ActivationCause,
  ) => void
  setSurfaceInputActive: (surfaceId: string, active: boolean) => void

  // Row registry (for keyboard navigation)
  registerRow: (surfaceId: string, rowId: string, rec: RowRecord) => void
  unregisterRow: (surfaceId: string, rowId: string) => void
  resetOrder: (surfaceId: string, ids: string[]) => void
  resetVirtualIndexMap: (surfaceId: string, map: Map<string, number>) => void

  // Navigation actions
  first: (surfaceId: string, cause?: ActivationCause) => void
  last: (surfaceId: string, cause?: ActivationCause) => void
  next: (surfaceId: string, cause?: ActivationCause) => void
  prev: (surfaceId: string, cause?: ActivationCause) => void

  // Node updates
  setSurfaceMenu: (surfaceId: string, menu: TMenu) => void
  setSurfaceFilteredNodes: (surfaceId: string, nodes: TNode[]) => void
  setSurfaceDisplayNodes: (surfaceId: string, nodes: TNode[]) => void
  updateSurfaceMenuDef: (surfaceId: string, menuDef: TMenuDef) => void

  // Loading state
  setSurfaceLoading: (surfaceId: string, isLoading: boolean) => void
  setSurfaceError: (surfaceId: string, error: Error | null) => void
  setSurfaceLoadingProgress: (
    surfaceId: string,
    progress: MenuSurfaceSlice<
      TData,
      TMenuDef,
      TMenu,
      TNode
    >['loadingProgress'],
  ) => void

  // Focus
  setFocusOwner: (surfaceId: string | null) => void

  // Bulk actions
  closeAllSurfaces: () => void
  closeSurfacesFromDepth: (depth: number) => void

  // Surface refs accessor (returns refs for a surface)
  getSurfaceRefs: (surfaceId: string) => SurfaceRefs | undefined
}

/**
 * Complete base menu store type.
 */
export type BaseMenuStore<
  TData = unknown,
  TMenuDef extends MenuDefLike = RootMenuDef<TData>,
  TMenu extends MenuLike = Menu<TData>,
  TNode extends NodeLike = Node<TData>,
> = BaseMenuStoreState<TData, TMenuDef, TMenu, TNode> &
  BaseMenuStoreActions<TData, TMenuDef, TMenu, TNode>

/**
 * Options for creating a base menu store.
 */
export interface CreateBaseMenuStoreOptions {
  scopeId: string
  dir?: 'ltr' | 'rtl'
  vimBindings?: boolean
}

/**
 * Extension function signature for store extensions.
 * Consumer packages use this to add their own state and actions.
 */
export type StoreExtension<
  TData,
  TMenuDef extends MenuDefLike,
  TMenu extends MenuLike,
  TNode extends NodeLike,
  TExtension,
> = (
  set: (
    partial:
      | Partial<BaseMenuStore<TData, TMenuDef, TMenu, TNode> & TExtension>
      | ((
          state: BaseMenuStore<TData, TMenuDef, TMenu, TNode> & TExtension,
        ) => Partial<
          BaseMenuStore<TData, TMenuDef, TMenu, TNode> & TExtension
        >),
  ) => void,
  get: () => BaseMenuStore<TData, TMenuDef, TMenu, TNode> & TExtension,
) => TExtension
