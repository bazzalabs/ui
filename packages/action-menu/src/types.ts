import type { Primitive } from '@radix-ui/react-primitive'
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual'
import type * as React from 'react'
import type { Drawer } from 'vaul'

/* ================================================================================================
 * Menu Model Types
 * ============================================================================================== */

export type MenuNodeKind = 'item' | 'group' | 'submenu'

export type BaseDef<K extends MenuNodeKind> = {
  /** The kind of node. */
  kind: K
  /** Unique id for this node. */
  id: string
  hidden?: boolean
}

export type Searchable = {
  /** A human-readable label for the searchable item. */
  label?: string
  /** A list of aliases for the node, used when searching/filtering. */
  keywords?: string[]
}

export type Iconish =
  | React.ReactNode
  | React.ReactElement
  | React.ElementType
  | React.ComponentType<{ className?: string }>

export type StateDescriptor<T> = {
  value: T
  onValueChange: React.Dispatch<React.SetStateAction<T>>
  defaultValue?: T
}

export type MenuState = {
  input?: StateDescriptor<string>
  open?: StateDescriptor<boolean>
  middleware?: import('./middleware/types.js').MenuMiddleware<any>
}

/**
 * Context provided to async node loader functions.
 */
export type AsyncNodeLoaderContext = {
  /** The current search query string. */
  query: string
  /** Whether the menu/submenu is currently open. */
  open: boolean
}

/**
 * Async node loader result interface compatible with TanStack Query and similar libraries.
 */
export type AsyncNodeLoaderResult<T = unknown> = {
  /** The loaded nodes (undefined while loading, array when loaded). */
  data?: NodeDef<T>[]
  /** Whether the initial load is in progress. */
  isLoading?: boolean
  /** Error object if loading failed. */
  error?: Error | null
  /** Whether an error occurred. */
  isError?: boolean
  /** Whether data is being refetched (after initial load). */
  isFetching?: boolean
}

/**
 * Async node loader interface compatible with TanStack Query and similar libraries.
 * Used to load menu nodes asynchronously.
 *
 * @typeParam T - The data type for each node
 * @typeParam TAdapterConfig - Optional type for adapter-specific configuration (e.g., UseQueryOptions)
 *
 * @example Native async function loader
 * ```tsx
 * loader: async ({ query }) => {
 *   const items = await fetchItems(query)
 *   return items // NodeDef[]
 * }
 * ```
 *
 * @example Static result loader
 * ```tsx
 * loader: {
 *   data: [...],
 *   isLoading: false
 * }
 * ```
 *
 * @example React Query adapter with function
 * ```tsx
 * loader: ({ query }) => ({
 *   queryKey: ['items', query],
 *   queryFn: () => fetchItems(query)
 * })
 * ```
 *
 * @example React Query adapter with static options
 * ```tsx
 * loader: {
 *   queryKey: ['items'],
 *   queryFn: () => fetchItems()
 * }
 * ```
 */
export type AsyncNodeLoader<T = unknown> =
  | AsyncNodeLoaderResult<T> // Static result
  | ((context: AsyncNodeLoaderContext) =>
      | AsyncNodeLoaderResult<T> // Function returning static result
      | Promise<NodeDef<T>[]> // Async function returning data
      | any) // Function returning adapter config (e.g., React Query options)
  | any // Static adapter config (e.g., React Query options)

/**
 * Loader adapter interface for pluggable async loading strategies.
 * Allows using different data fetching libraries (React Query, SWR, etc.) or custom implementations.
 */
export type LoaderAdapter = {
  /**
   * Execute a single async loader and return its result.
   * @param loader - The loader to execute (can be a function, static result, or adapter-specific config)
   * @param context - The loader context (query, open state)
   * @returns The loader result with loading states
   */
  useLoader<T>(
    loader: AsyncNodeLoader<T> | undefined,
    context: AsyncNodeLoaderContext,
  ): AsyncNodeLoaderResult<T> | undefined

  /**
   * Execute multiple async loaders in parallel (for deep search).
   * @param loaders - Array of loaders with their paths and contexts
   * @returns Map of path (joined by '.') to loader results
   */
  useLoaders<T>(
    loaders: Array<{
      path: string[]
      loader: AsyncNodeLoader<T>
      context: AsyncNodeLoaderContext
    }>,
  ): Map<string, AsyncNodeLoaderResult<T>>
}

/**
 * Metadata for an eager loader that will be executed in parallel.
 * @internal
 */
export type EagerLoaderEntry = {
  /** Path to the submenu (array of submenu ids from root). */
  path: string[]
  /** The loader factory function (extracted from createLoader). */
  factory: any
}

/**
 * Progress information for a single loader during deep search.
 */
export type LoaderProgress = {
  /** Path to the submenu (e.g., ['settings', 'advanced']) */
  path: string[]
  /** Human-readable path (e.g., ['Settings', 'Advanced']) */
  breadcrumbs: string[]
  /** Loading state for this specific loader */
  isLoading: boolean
  /** Whether data is being refetched */
  isFetching: boolean
  /** Error if this loader failed */
  error?: Error | null
}

/**
 * Aggregated state of multiple deep search loaders.
 * @internal
 */
export type AggregatedLoaderState = {
  /** True if ANY loader is still loading. */
  isLoading: boolean
  /** True if ANY loader has an error. */
  isError: boolean
  /** True if ANY loader is fetching. */
  isFetching: boolean
  /** Map of path (joined by '.') to loader result. */
  results: Map<string, AsyncNodeLoaderResult>
  /** Progress details for each loader (useful for Loading slot) */
  progress: LoaderProgress[]
}

/**
 * Configuration for virtualizing large lists.
 */
export type VirtualizationConfig = {
  /** Number of items to render outside the visible area. Default: 12 */
  overscan?: number
  /** Estimated height of each item in pixels. Default: 32 */
  estimateSize?: number
}

/**
 * Search mode for filtering results.
 * - 'client': Search is performed locally on the client (default)
 * - 'server': Search is delegated to the server via async loaders
 * - 'hybrid': Both client-side filtering AND server-side search
 */
export type SearchMode = 'client' | 'server' | 'hybrid'

/**
 * Configuration for search behavior.
 */
export type SearchConfig = {
  /** Search mode. Default: 'client' */
  mode?: SearchMode
  /** Debounce delay in milliseconds. Default: 0 (no debounce) */
  debounce?: number
  /** Minimum query length before search activates. Default: 0 */
  minLength?: number
}

export type MenuDef<T = unknown> = MenuState & {
  id: string
  title?: string
  inputPlaceholder?: string
  hideSearchUntilActive?: boolean
  /** Static nodes (sync mode). Mutually exclusive with `loader`. */
  nodes?: NodeDef<T>[]
  /** Async node loader (async mode). Mutually exclusive with `nodes`. */
  loader?: AsyncNodeLoader<T>
  defaults?: MenuNodeDefaults<T>
  /** Virtualization configuration for the list. */
  virtualization?: VirtualizationConfig
  /** Search configuration for filtering behavior. */
  search?: SearchConfig
  ui?: {
    slots?: Partial<ActionMenuSlots<T>>
    slotProps?: Partial<ActionMenuSlotProps>
    classNames?: Partial<ActionMenuClassNames>
  }
}

export type ItemVariant = 'button' | 'checkbox' | 'radio'

// biome-ignore lint/suspicious/noEmptyInterface: to be extended
export interface ItemExtendedProperties {}

export type BaseItemDef<T = unknown> = BaseDef<'item'> &
  Searchable & {
    icon?: Iconish
    data?: T
    disabled?: boolean
    onSelect?: (args: {
      node: Omit<ItemNode<T>, 'onSelect'>
      search?: SearchContext
    }) => void
    closeOnSelect?: boolean
    render?: (args: {
      node: ItemNode<T>
      search?: SearchContext
      mode: Omit<ResponsiveMode, 'auto'>
      bind: RowBindAPI
    }) => React.ReactNode
  } & ItemExtendedProperties

export type ButtonItemDef<T = unknown> = BaseItemDef<T> & {
  /** The visual/behavioral variant of this item. Defaults to 'button'. */
  variant?: 'button'
  value?: never
}

export type CheckboxItemDef<T = unknown> = BaseItemDef<T> & {
  /** The visual/behavioral variant of this item. */
  variant: 'checkbox'
  /** Controlled checked state. */
  checked: boolean
  /** Callback when checked state changes. */
  onCheckedChange: (checked: boolean) => void
}

export type RadioItemDef<T = unknown> = BaseItemDef<T> & {
  /** The visual/behavioral variant of this item. */
  variant: 'radio'
  /** Value for this radio item. Falls back to id if not provided. */
  value?: string
}

export type ItemDef<T = unknown> =
  | ButtonItemDef<T>
  | CheckboxItemDef<T>
  | RadioItemDef<T>

export type BaseGroupDef<T = unknown> = BaseDef<'group'> & {
  nodes: (ItemDef<T> | SubmenuDef<any, any>)[]
  heading?: string
}

export type DefaultGroupDef<T = unknown> = BaseGroupDef<T> & {
  /** The variant of this group. Defaults to 'default'. */
  variant?: 'default'
  value?: never
  onValueChange?: never
}

export type RadioGroupDef<T = unknown> = BaseGroupDef<T> & {
  /** The variant of this group. Use 'radio' to create a radio group. */
  variant: 'radio'
  /** Controlled value for radio groups (the selected radio item's value). */
  value: string
  /** Callback when radio group value changes. */
  onValueChange: (value: string) => void
}

export type GroupDef<T = unknown> = DefaultGroupDef<T> | RadioGroupDef<T>

export type SubmenuDef<T = unknown, TChild = unknown> = BaseDef<'submenu'> &
  Searchable &
  MenuState & {
    /** Static nodes (sync mode). Mutually exclusive with `loader`. */
    nodes?: NodeDef<TChild>[]
    /** Async node loader (async mode). Mutually exclusive with `nodes`. */
    loader?: AsyncNodeLoader<TChild>
    /**
     * When true, this submenu's children are searchable from ancestor menus (deep search).
     * - For async loaders: Triggers parallel loading during search
     * - For static nodes: Children are always searchable (deep search is implicit)
     *
     * Set to `false` to make this submenu's nodes only browsable/searchable from within the submenu itself,
     * not from any ancestor menus. When `false`, descendant submenus are also excluded from deep search.
     * @default true
     */
    deepSearch?: boolean
    data?: T
    disabled?: boolean
    icon?: Iconish
    title?: string
    inputPlaceholder?: string
    hideSearchUntilActive?: boolean
    defaults?: MenuNodeDefaults<T>
    /** Virtualization configuration for the submenu's list. */
    virtualization?: VirtualizationConfig
    /** Search configuration for filtering behavior. */
    search?: SearchConfig
    ui?: {
      slots?: Partial<ActionMenuSlots<TChild>>
      slotProps?: Partial<ActionMenuSlotProps>
      classNames?: Partial<ActionMenuClassNames>
    }
    render?: () => React.ReactNode
  }

export type Menu<T = unknown> = Omit<MenuDef<T>, 'nodes'> & {
  nodes: Node<T>[]
  surfaceId: string
  depth: number
  /** Loading state metadata (present when menu is in async mode). */
  loadingState?: {
    isLoading?: boolean
    isError?: boolean
    error?: Error | null
    isFetching?: boolean
    /** Progress details for deep search loaders */
    progress?: LoaderProgress[]
  }
}

/** Additional context passed to item/submenu renderers during search. */
export type SearchContext = {
  query: string
  isDeep: boolean
  score: number
  breadcrumbs: string[]
  breadcrumbIds: string[]
}

/* ================================================================================================
 * Runtime Node Types
 * ============================================================================================== */

/** Group membership metadata for items/submenus rendered within groups. */
export type GroupedNode<T = unknown> = {
  /** Reference to the row's belonging group, if applicable. */
  group?: GroupNode<T>
  /** Position within the group: 'first', 'middle', 'last', or 'only'. */
  groupPosition?: 'first' | 'middle' | 'last' | 'only'
  /** Zero-based index within the group. */
  groupIndex?: number
  /** Total number of items/submenus in the group. */
  groupSize?: number
}

/** Runtime node (instance) */
export type BaseNode<K extends MenuNodeKind, D extends BaseDef<K>> = {
  /** The kind of node. */
  kind: K
  /** Unique id for this node. */
  id: string
  hidden?: boolean
  /** Owning menu surface at runtime. */
  parent: Menu<any>
  /** Original author definition for this node. */
  def: D
}

export type BaseItemNode<T = unknown> = BaseNode<'item', ItemDef<T>> &
  Omit<BaseItemDef<T>, 'kind' | 'hidden'> &
  GroupedNode<T> & {
    search?: SearchContext
  }

export type ButtonItemNode<T = unknown> = BaseItemNode<T> & {
  variant: 'button'
  value?: never
}

export type CheckboxItemNode<T = unknown> = BaseItemNode<T> & {
  variant: 'checkbox'
  /** Controlled checked state. */
  checked: boolean
  /** Callback when checked state changes. */
  onCheckedChange: (checked: boolean) => void
}

export type RadioItemNode<T = unknown> = BaseItemNode<T> & {
  variant: 'radio'
  /** Value for this radio item. Required at runtime (uses id as fallback). */
  value: string
}

export type ItemNode<T = unknown> =
  | ButtonItemNode<T>
  | CheckboxItemNode<T>
  | RadioItemNode<T>

export type BaseGroupNode<T = unknown> = BaseNode<'group', GroupDef<T>> & {
  heading?: string
  nodes: (ItemNode<T> | SubmenuNode<any>)[]
}

export type DefaultGroupNode<T = unknown> = BaseGroupNode<T> & {
  variant: 'default'
  value?: never
  onValueChange?: never
}

export type RadioGroupNode<T = unknown> = BaseGroupNode<T> & {
  variant: 'radio'
  value: string
  onValueChange: (value: string) => void
}

export type GroupNode<T = unknown> = DefaultGroupNode<T> | RadioGroupNode<T>

/** NOTE: Submenu node exposes its runtime child menu as `child` */
export type SubmenuNode<T = unknown, TChild = unknown> = BaseNode<
  'submenu',
  SubmenuDef<T, TChild>
> &
  Omit<SubmenuDef<T, TChild>, 'kind' | 'hidden' | 'nodes' | 'search'> &
  GroupedNode<T> & {
    child: Menu<TChild>
    nodes: Node<TChild>[]
    search?: SearchContext
  }

export type Node<T = unknown> = ItemNode<T> | GroupNode<T> | SubmenuNode<T, any>

export type NodeDef<T = unknown> = ItemDef<T> | GroupDef<T> | SubmenuDef<T, any>

/* ================================================================================================
 * Bind API Types
 * ============================================================================================== */

export type DivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>
export type ButtonProps = React.ComponentPropsWithoutRef<
  typeof Primitive.button
>
export type Children = Pick<DivProps, 'children'>

/** Row interaction & wiring helpers provided to slot renderers. */
export type RowBindAPI = {
  focused: boolean
  disabled: boolean
  getRowProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    ref: React.Ref<any>
    id: string
    role: 'option' | 'menuitemcheckbox'
    tabIndex: -1
    'data-action-menu-item-id': string
    'data-focused'?: 'true'
    'data-variant'?: 'button' | 'checkbox' | 'radio'
    'data-checked'?: boolean
    'data-group-position'?: 'first' | 'middle' | 'last' | 'only'
    'data-group-index'?: number
    'data-group-size'?: number
    'aria-selected'?: boolean
    'aria-checked'?: boolean
    'aria-disabled'?: boolean
  }
}

/** Content/surface wiring helpers provided to slot renderers. */
export type ContentBindAPI = {
  getContentProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    ref: React.Ref<any>
    role: 'menu'
    tabIndex: -1
    'data-slot': 'action-menu-content'
    'data-state': 'open' | 'closed'
    'data-action-menu-surface': true
    'data-surface-id': string
  }
}

/** Search input wiring helpers provided to slot renderers. */
export type InputBindAPI = {
  getInputProps: <T extends React.InputHTMLAttributes<HTMLInputElement>>(
    overrides?: T,
  ) => T & {
    ref: React.Ref<any>
    role: 'combobox'
    'data-slot': 'action-menu-input'
    'data-action-menu-input': true
    'aria-autocomplete': 'list'
    'aria-expanded': true
    'aria-controls'?: string
    'aria-activedescendant'?: string
  }
}

/** List wiring helpers provided to slot renderers. */
export type ListBindAPI = {
  getListProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    ref: React.Ref<any>
    role: 'listbox'
    id: string
    tabIndex: number
    'data-slot': 'action-menu-list'
    'data-action-menu-list': true
    'aria-activedescendant'?: string
  }
  getItemOrder: () => string[]
  getActiveId: () => string | null
}

/** Group heading wiring helpers provided to slot renderers. */
export type GroupHeadingBindAPI = {
  getGroupHeadingProps: <T extends React.HTMLAttributes<HTMLElement>>(
    overrides?: T,
  ) => T & {
    className?: string
    'data-group-size'?: number
  }
}

/* ================================================================================================
 * ClassNames & SlotProps Types
 * ============================================================================================== */

/** ClassNames that style the *shell* (overlay / drawer container / trigger). */
export type ShellClassNames = {
  drawerOverlay?: string
  drawerContent?: string
  drawerContentInner?: string
  drawerHandle?: string
  trigger?: string
}

/** ClassNames that style the *surface* (content/list/items/etc.). */
export type SurfaceClassNames = {
  content?: string
  input?: string
  list?: string
  itemWrapper?: string
  item?: string
  subtriggerWrapper?: string
  subtrigger?: string
  groupHeading?: string
}

export type ActionMenuClassNames = ShellClassNames & SurfaceClassNames

/** Slot props forwarded to the *shell* (Vaul). */
export type ShellSlotProps = {
  positioner?: Partial<Omit<ActionMenuPositionerProps, 'children'>>
  drawerRoot?: Partial<React.ComponentProps<typeof Drawer.Root>>
  drawerOverlay?: React.ComponentPropsWithoutRef<typeof Drawer.Overlay>
  drawerContent?: React.ComponentPropsWithoutRef<typeof Drawer.Content>
}

/** Slot props forwarded to *surface* slots (Input/List/Content/Header/Footer). */
export type SurfaceSlotProps = {
  content?: React.HTMLAttributes<HTMLElement>
  header?: React.HTMLAttributes<HTMLElement>
  input?: React.InputHTMLAttributes<HTMLInputElement>
  list?: React.HTMLAttributes<HTMLElement>
  footer?: React.HTMLAttributes<HTMLElement>
}

export type ActionMenuSlotProps = ShellSlotProps & SurfaceSlotProps

export interface ItemSlotProps<T = unknown> {
  node: ItemNode<T>
  search?: SearchContext
  mode: Omit<ResponsiveMode, 'auto'>
  bind: RowBindAPI
}

export interface ListSlotProps<T = unknown> {
  query?: string
  nodes: Node<T>[]
  children: React.ReactNode
  bind: ListBindAPI
}

/** Slot renderers to customize visuals. */
export type SurfaceSlots<T = unknown> = {
  Content: (args: {
    menu: Menu<T>
    children: React.ReactNode
    bind: ContentBindAPI
  }) => React.ReactNode
  Header?: (args: { menu: Menu<T> }) => React.ReactNode
  Input: (args: {
    value: string
    onChange: (v: string) => void
    bind: InputBindAPI
  }) => React.ReactNode
  List: (args: ListSlotProps<T>) => React.ReactNode
  /** Shown when no nodes are available after loading completes. */
  Empty?: (args: { query: string }) => React.ReactNode
  /** Shown during initial async load (when isLoading && !data). */
  Loading?: (args: {
    menu: Menu<T>
    /** Whether any loader is currently fetching */
    isFetching?: boolean
    /** Deep search progress (which submenus are being searched) */
    progress?: LoaderProgress[]
    /** Query that triggered the search (if deep search is active) */
    query?: string
  }) => React.ReactNode
  /** Shown when async load fails (when isError). */
  Error?: (args: { menu: Menu<T>; error?: Error }) => React.ReactNode
  Item: (args: ItemSlotProps<T>) => React.ReactNode
  SubmenuTrigger: (args: {
    node: SubmenuNode<T>
    search?: SearchContext
    bind: RowBindAPI
  }) => React.ReactNode
  GroupHeading?: (args: {
    node: GroupNode<T>
    bind: GroupHeadingBindAPI
  }) => React.ReactNode
  Footer?: (args: { menu: Menu<T> }) => React.ReactNode
}

export type ActionMenuSlots<T = unknown> = SurfaceSlots<T>

/* ================================================================================================
 * Theme Types
 * ============================================================================================== */

export type ActionMenuThemeDef<T = unknown> = {
  slots?: Partial<ActionMenuSlots<T>>
  slotProps?: Partial<ActionMenuSlotProps>
  classNames?: Partial<ActionMenuClassNames>
}

export type ActionMenuTheme<T = unknown> = {
  slots: Required<ActionMenuSlots<T>>
  slotProps?: Partial<ActionMenuSlotProps>
  classNames?: Partial<ActionMenuClassNames>
}

/* ================================================================================================
 * Component Props Types
 * ============================================================================================== */

export type ResponsiveMode = 'auto' | 'drawer' | 'dropdown'
export type ResponsiveConfig = { mode: ResponsiveMode; query: string }

export type Direction = 'ltr' | 'rtl'

export interface ActionMenuPositionerProps {
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  collisionPadding?:
    | number
    | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  alignToFirstItem?: false | 'on-open' | 'always'
}

export interface ActionMenuSurfaceProps<T = unknown>
  extends Omit<DivProps, 'dir' | 'children'> {
  menu: MenuDef<T> | Menu<T>
  render?: () => React.ReactNode
  vimBindings?: boolean
  dir?: Direction
  defaults?: Partial<MenuNodeDefaults<T>>
  onOpenAutoFocus?: boolean
  onCloseAutoClear?: boolean | number
  /** @internal Forced surface id; used by submenus. */
  surfaceIdProp?: string
  /** @internal Suppress hover-open until first pointer move; used by submenus opened via keyboard. */
  suppressHoverOpenOnMount?: boolean
}

/** Defaulted parts of nodes for convenience. */
export type MenuNodeDefaults<T = unknown> = {
  surface?: Pick<
    ActionMenuSurfaceProps<T>,
    'vimBindings' | 'dir' | 'onOpenAutoFocus' | 'onCloseAutoClear'
  >
  item?: Pick<ItemNode<T>, 'onSelect' | 'closeOnSelect'>
}

/* ================================================================================================
 * Internal Types
 * ============================================================================================== */

export type SurfaceState = {
  activeId: string | null
  hasInput: boolean
  listId: string | null
}

export type RowRecord = {
  ref: React.RefObject<HTMLElement>
  virtualItem?: VirtualItem
  disabled?: boolean
  kind: 'item' | 'submenu'
  openSub?: () => void
  closeSub?: () => void
}

export type ActivationCause = 'keyboard' | 'pointer' | 'programmatic'

export type SurfaceStore<T> = {
  subscribe(cb: () => void): () => void
  snapshot(): SurfaceState
  set<K extends keyof SurfaceState>(k: K, v: SurfaceState[K]): void

  getNodes(): Node<T>[]
  setNodes(nodes: Node<T>[]): void

  registerRow(id: string, rec: RowRecord): void
  unregisterRow(id: string): void
  getOrder(): string[]
  resetOrder(ids: string[]): void
  resetVirtualIndexMap(map: Map<string, number>): void

  setActiveId(id: string | null, cause?: ActivationCause): void
  setActiveByIndex(idx: number, cause?: ActivationCause): void
  first(cause?: ActivationCause): void
  last(cause?: ActivationCause): void
  next(cause?: ActivationCause): void
  prev(cause?: ActivationCause): void

  readonly rows: Map<string, RowRecord>
  readonly rowIdToVirtualIndex: Map<string, number>
  readonly inputRef: React.RefObject<HTMLInputElement | null>
  readonly listRef: React.RefObject<HTMLDivElement | null>
  readonly virtualizerRef: React.RefObject<Virtualizer<
    HTMLDivElement,
    Element
  > | null>
}

export type HoverPolicy = {
  suppressHoverOpen: boolean
  clearSuppression: () => void
  aimGuardActive: boolean
  guardedTriggerId: string | null
  activateAimGuard: (triggerId: string, timeoutMs?: number) => void
  clearAimGuard: () => void
  aimGuardActiveRef: React.RefObject<boolean | null>
  guardedTriggerIdRef: React.RefObject<string | null>
  isGuardBlocking: (rowId: string) => boolean
}

export type AnchorSide = 'left' | 'right'

export type KeyboardOptions = { dir: Direction; vimBindings: boolean }

export type RadioGroupContextValue = {
  value: string
  onValueChange: (value: string) => void
}

export type RootContextValue = {
  scopeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
  modal: boolean
  anchorRef: React.RefObject<HTMLElement | null>
  debug: boolean
  responsive: ResponsiveConfig
  slotProps?: Partial<ActionMenuSlotProps>
  classNames?: Partial<ActionMenuClassNames>
  openSurfaceIds: React.RefObject<Map<string, number>>
  registerSurface: (surfaceId: string, depth: number) => void
  unregisterSurface: (surfaceId: string) => void
  closeAllSurfaces: () => void
  onCloseAutoFocus?: (event: Event) => void
}

export type MenuDisplayMode = Omit<ResponsiveMode, 'auto'>

export type SubContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
  triggerRef: React.RefObject<HTMLDivElement | HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  def: SubmenuDef
  parentSurfaceId: string
  triggerItemId: string | null
  setTriggerItemId: (id: string | null) => void
  parentSetActiveId: (id: string | null, cause?: ActivationCause) => void
  childSurfaceId: string
  pendingOpenModalityRef: React.RefObject<'keyboard' | 'pointer' | null>
  intentZoneActiveRef: React.RefObject<boolean>
  parentSub: SubContextValue | null
}

export type FocusOwnerCtxValue = {
  ownerId: string | null
  setOwnerId: (id: string | null) => void
}
