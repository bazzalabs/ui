import type { Primitive } from '@radix-ui/react-primitive'
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual'
import type * as React from 'react'
import type { MenuControl } from './control.js'
import type { MenuMiddleware } from './middleware/types.js'

/* ================================================================================================
 * Base Contracts & Type Utilities
 * ============================================================================================== */

/**
 * Base node kinds available in the core menu system.
 */
export type MenuNodeKind =
  | 'menu'
  | 'item'
  | 'group'
  | 'submenu'
  | 'separator'
  | 'loading'

/**
 * Base definition contract that all node definitions must extend.
 */
export type BaseNodeDef<K extends MenuNodeKind = MenuNodeKind> = {
  /** The kind of node. */
  kind: K
  /** Unique id for this node. Optional if the node has a label property. */
  id?: string
  hidden?: boolean
}

/**
 * Base runtime node contract that all runtime nodes must extend.
 *
 * Note: The parent type uses a forward reference to Menu which is defined later.
 * This is intentional as Menu is a union of RootMenuNode | SubmenuNode.
 */
export type BaseNode<
  K extends MenuNodeKind = MenuNodeKind,
  D extends BaseNodeDef<K> = BaseNodeDef<K>,
> = {
  /** The kind of node. */
  kind: K
  /** Unique id for this node (required at runtime). */
  id: string
  hidden?: boolean
  /** Owning menu surface at runtime (RootMenuNode or SubmenuNode). */
  parent: Menu<any>
  /** Original author definition for this node. */
  def: D
}

/**
 * Base menu contract that all menu types must extend.
 */
export type BaseMenu = {
  kind: 'menu' | 'submenu'
  id: string
  surfaceId: string
  depth: number
  nodes: any[]
}

/**
 * Extract the node definition type from a node type.
 */
export type ExtractNodeDef<TNode> = TNode extends BaseNode<any, infer D>
  ? D
  : never

/**
 * Extract the data type from a node that has a data property.
 */
export type ExtractDataType<TNode> = TNode extends { data?: infer TData }
  ? TData
  : never

/**
 * Type guard to check if a node is of a specific kind.
 */
export function isNodeKind<K extends MenuNodeKind>(
  node: BaseNode<any, any>,
  kind: K,
): node is BaseNode<K, any> {
  return node.kind === kind
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

export type StateDescriptor<TData> = {
  value: TData
  onValueChange: React.Dispatch<React.SetStateAction<TData>>
  defaultValue?: TData
}

export type MenuState = {
  input?: StateDescriptor<string>
  open?: StateDescriptor<boolean>
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
export type AsyncNodeLoaderResult<TData = unknown> = {
  /** The loaded nodes (undefined while loading, array when loaded). */
  data?: NodeDef<TData>[]
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
 * Async node loader - a hook function that loads menu nodes.
 *
 * Use loader creator functions from @bazza-ui/loaders:
 * - query() for React Query
 * - native() for simple async functions
 * - swr() for SWR (coming soon)
 *
 * This is compatible with the Loader type from @bazza-ui/loaders.
 *
 * @typeParam TData - The data type for each node
 *
 * @example With query() from @bazza-ui/loaders
 * ```tsx
 * import { query } from '@bazza-ui/loaders'
 *
 * const myLoader = query({
 *   key: ['items'],
 *   fn: () => fetchItems(),
 *   select: (data) => data.map(item => ({
 *     kind: 'item',
 *     id: item.id,
 *     label: item.name
 *   }))
 * })
 * ```
 *
 * @example With native() from @bazza-ui/loaders
 * ```tsx
 * import { native } from '@bazza-ui/loaders'
 *
 * const myLoader = native(async (context) => {
 *   const items = await fetchItems(context.query)
 *   return items.map(item => ({
 *     kind: 'item',
 *     id: item.id,
 *     label: item.name
 *   }))
 * })
 * ```
 */
export type AsyncNodeLoader<TData = unknown> = (context: {
  query?: string
  isOpen?: boolean
  path?: string[]
}) => AsyncNodeLoaderResult<TData>

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
  /** Set of paths for loaders that have completed (for streaming) */
  completedPaths?: Set<string>
  /** Set of paths for loaders that are still in progress (for streaming) */
  inProgressPaths?: Set<string>
}

/**
 * Configuration for virtualizing large lists.
 */
export type VirtualizationConfig<TData = unknown> = {
  /**
   * Enable or disable virtualization.
   * - `boolean`: Explicitly enable/disable virtualization
   * - `function`: Callback to conditionally enable based on nodes
   * - `undefined`: Auto-enable when 50+ items (default behavior)
   */
  enabled?:
    | boolean
    | ((context: {
        nodes: NodeDef<TData>[]
        count: number
        menu: RootMenuDef<TData>
      }) => boolean)

  /**
   * Estimated height of each item in pixels.
   * - `number`: Fixed estimate for all items (default: 40)
   * - `function`: Dynamic estimate per item index
   */
  estimateSize?: number | ((index: number) => number)

  /** Number of items to render outside the visible area. Default: 5 */
  overscan?: number

  /** Enable horizontal virtualization instead of vertical. Default: false */
  horizontal?: boolean

  /** Padding at the start of the scroll container in pixels */
  paddingStart?: number

  /** Padding at the end of the scroll container in pixels */
  paddingEnd?: number

  /** Scroll padding at the start in pixels */
  scrollPaddingStart?: number

  /** Scroll padding at the end in pixels */
  scrollPaddingEnd?: number

  /** Gap between items in pixels */
  gap?: number

  /** Initial scroll offset in pixels or function returning offset */
  initialOffset?: number | (() => number)

  /** Scroll margin in pixels */
  scrollMargin?: number

  /** Number of lanes for masonry-style layouts. Default: 1 */
  lanes?: number

  /** Enable right-to-left mode. Default: false */
  isRtl?: boolean

  /** Enable debug mode for development. Default: false */
  debug?: boolean
}

/**
 * Search mode for filtering results.
 * - 'client': Search is performed locally on the client (default)
 * - 'server': Search is delegated to the server via async loaders
 * - 'hybrid': Both client-side filtering AND server-side search
 */
export type SearchMode = 'client' | 'server' | 'hybrid'

/**
 * Configuration for streaming search results.
 */
export type StreamingConfig = {
  /** Enable streaming mode. Default: false */
  enabled: boolean
  /**
   * Whether to re-sort the entire results list when a new batch arrives.
   * - false (default): Each batch is sorted internally, then appended to end
   * - true: Re-sort the entire results list on each batch (may cause visual jumping)
   */
  resortOnBatch?: boolean
}

/**
 * Configuration for search behavior.
 */
export type SearchConfig = {
  /** Search mode. Default: 'client' */
  mode?: SearchMode
  /** Debounce delay in milliseconds. Default: 0 (no debounce) */
  debounce?: number
  /**
   * Minimum query length before search activates.
   * - number: Applies to deep search only (local search is immediate). Default: 0
   * - object: Specify separate thresholds for local and deep search
   */
  minLength?: number | { local?: number; deep?: number }
  /**
   * Streaming configuration for showing results as they load.
   * - boolean: Enable/disable streaming with default config
   * - object: Granular control over streaming behavior
   *
   * Note: Streaming only activates when at least one loader uses 'server' or 'hybrid' mode.
   */
  streaming?: boolean | StreamingConfig
}

export type RootMenuDef<
  TData = unknown,
  TSlots = MenuSlots<TData>,
  TSlotProps = MenuSlotProps,
  TClassNames = MenuClassNames,
  TControl extends MenuControl<TData> = MenuControl<TData>,
> = {
  id: string
  title?: string
  inputPlaceholder?: string
  hideSearchUntilActive?: boolean
  /** Static nodes (sync mode). Mutually exclusive with `loader`. */
  nodes?: NodeDef<TData>[]
  /** Async node loader (async mode). Mutually exclusive with `loader`. */
  loader?: AsyncNodeLoader<TData>
  defaults?: MenuNodeDefaults<TData>
  /** Virtualization configuration for the list. */
  virtualization?: VirtualizationConfig<TData>
  /** Search configuration for filtering behavior. */
  search?: SearchConfig
  /** Middleware for programmatic control and event handling. */
  middleware?: MenuMiddleware<TData, any>
  ui?: MenuThemeDef<TData, TSlots, TSlotProps, TClassNames>
  /** Custom render function for the menu content. */
  render?: () => React.ReactNode
} & MenuState

/**
 * @deprecated Use RootMenuDef instead
 */
export type MenuDef<
  TData = unknown,
  TSlots = MenuSlots<TData>,
  TSlotProps = MenuSlotProps,
  TClassNames = MenuClassNames,
  TControl extends MenuControl<TData> = MenuControl<TData>,
> = RootMenuDef<TData, TSlots, TSlotProps, TClassNames, TControl>

export interface ItemVariantMap {
  button: true
  checkbox: true
  radio: true
}

// biome-ignore lint/suspicious/noEmptyInterface: to be extended
export interface ExtendedItemVariantMap {}

export type ItemVariant = keyof ItemVariantMap | keyof ExtendedItemVariantMap

// biome-ignore lint/suspicious/noEmptyInterface: to be extended
export interface ExtendedItemVariant {}

// biome-ignore lint/suspicious/noEmptyInterface: to be extended
export interface ItemExtendedProperties {}

export type BaseItemDef<TData = unknown> = BaseNodeDef<'item'> &
  Searchable & {
    /**
     * The visual/behavioral variant of this item. Defaults to 'button'.
     * @default 'button'
     */
    variant?: ItemVariant
    icon?: Iconish
    data?: TData
    /**
     * @default false
     */
    disabled?: boolean
    onSelect?: (args: {
      node: Omit<ItemNode<TData>, 'onSelect'>
      search?: SearchContext
    }) => void
    closeOnSelect?: boolean
    render?: (args: {
      node: ItemNode<TData>
      search?: SearchContext
      bind: RowBindAPI
    }) => React.ReactNode
  } & ItemExtendedProperties

export type ButtonItemDef<TData = unknown> = BaseItemDef<TData> & {
  variant?: 'button'
  // value?: never // TODO: Remove this property in the next major version
}

export type CheckboxItemDef<TData = unknown> = BaseItemDef<TData> & {
  /** The visual/behavioral variant of this item. */
  variant: 'checkbox'
  /** Controlled checked state. */
  checked: boolean
  /** Callback when checked state changes. */
  onCheckedChange: (checked: boolean) => void
}

export type RadioItemDef<TData = unknown> = BaseItemDef<TData> & {
  /** The visual/behavioral variant of this item. */
  variant: 'radio'
  /** Value for this radio item. Falls back to `id` if not provided. */
  value?: string
}

export type ItemDef<TData = unknown> =
  | ButtonItemDef<TData>
  | CheckboxItemDef<TData>
  | RadioItemDef<TData>

export type BaseGroupDef<TData = unknown> = BaseNodeDef<'group'> & {
  /**
   * Variant for this group.
   * @default 'default'
   */
  variant?: 'default' | 'radio'
  /** Unique identifier for this group. */
  id: string
  nodes: (ItemDef<TData> | SubmenuDef<any, any>)[]
  /** Heading for this group. */
  heading?: string
}

export type DefaultGroupDef<TData = unknown> = BaseGroupDef<TData> & {
  /** The variant of this group. Defaults to 'default'. */
  variant?: 'default'
  value?: never
  onValueChange?: never
}

export type RadioGroupDef<TData = unknown> = BaseGroupDef<TData> & {
  variant: 'radio'
  /** Controlled value for radio groups (the selected radio item's value). */
  value: string
  /** Callback when radio group value changes. */
  onValueChange: (value: string) => void
}

export type GroupDef<TData = unknown> =
  | DefaultGroupDef<TData>
  | RadioGroupDef<TData>

export type SeparatorDef = BaseNodeDef<'separator'> & {
  /** Optional label for the separator (can be used for section headers). */
  label?: string
}

export type LoadingDef = BaseNodeDef<'loading'> & {
  /** Unique id for this loading node (required - loading nodes don't have labels to auto-generate from). */
  id: string
  /** Progress information for in-progress loaders */
  progress?: LoaderProgress[]
  /** Paths of loaders that are still loading */
  inProgressPaths?: string[]
  /** Paths of loaders that have completed */
  completedPaths?: string[]
}

export type SubmenuDef<
  TData = unknown,
  TChild = unknown,
  TSlots = MenuSlots<TChild>,
  TSlotProps = MenuSlotProps,
  TClassNames = MenuClassNames,
  TControl extends MenuControl<TChild> = MenuControl<TChild>,
> = BaseNodeDef<'submenu'> &
  Searchable &
  MenuState & {
    /** Static nodes (sync mode). Mutually exclusive with `loader`. */
    nodes?: NodeDef<TChild>[]
    /** Async node loader (async mode). Mutually exclusive with `loader`. */
    loader?: AsyncNodeLoader<TChild>
    /**
     * When true, this submenu's children are searchable from ancestor menus (deep search).
     *
     * - For async loaders: Triggers parallel loading during search
     * - For static nodes: Children are always searchable (deep search is implicit)
     *
     * Set to `false` to make this submenu's nodes only browsable/searchable from within the submenu itself,
     * not from any ancestor menus. When `false`, descendant submenus are also excluded from deep search.
     * @default true
     */
    deepSearch?: boolean
    data?: TData
    disabled?: boolean
    icon?: Iconish
    title?: string
    inputPlaceholder?: string
    hideSearchUntilActive?: boolean
    defaults?: MenuNodeDefaults<TChild>
    /** Virtualization configuration for the submenu's list. */
    virtualization?: VirtualizationConfig<TChild>
    /** Search configuration for filtering behavior. */
    search?: SearchConfig
    /** Middleware for programmatic control and event handling. */
    middleware?: MenuMiddleware<TChild, any>
    ui?: MenuThemeDef<TChild, TSlots, TSlotProps, TClassNames>
    render?: () => React.ReactNode
  }

export type LoadMode = 'blocking' | 'streaming'

/**
 * Root menu runtime node type.
 * Represents the instantiated runtime state of a root menu.
 */
export type RootMenuNode<TData = unknown> = Omit<
  RootMenuDef<TData>,
  'kind' | 'nodes'
> & {
  kind: 'menu'
  nodes: Node<TData>[]
  surfaceId: string
  depth: 0
  /** Base defaults (factory + instance only) passed down from parent, used for submenu inheritance */
  baseDefaults?: MenuNodeDefaults<TData>
  /** Loading state metadata (present when menu is in async mode). */
  loadingState?: {
    isLoading?: boolean
    isError?: boolean
    error?: Error | null
    isFetching?: boolean
    /** Progress details for deep search loaders */
    progress?: LoaderProgress[]
    /** Load mode: 'blocking' (wait for all) or 'streaming' (show as they arrive) */
    loadMode?: LoadMode
    /** Paths of completed loaders (streaming mode) */
    completedPaths?: Set<string>
    /** Paths of in-progress loaders (streaming mode) */
    inProgressPaths?: Set<string>
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

/**
 * Intermediate data structure used during node scoring/filtering.
 * Contains a node along with its computed score and breadcrumb trail.
 * @internal
 */
export type ScoredNode<TData = unknown> = {
  node: Node<TData>
  score: number
  breadcrumbs: string[]
  breadcrumbIds: string[]
}

/* ================================================================================================
 * Runtime Node Types
 * ============================================================================================== */

/** Group membership metadata for items/submenus rendered within groups. */
export type GroupedNode<TData = unknown> = {
  /** Reference to the row's belonging group, if applicable. */
  group?: GroupNode<TData>
  /** Position within the group: 'first', 'middle', 'last', or 'only'. */
  groupPosition?: 'first' | 'middle' | 'last' | 'only'
  /** Zero-based index within the group. */
  groupIndex?: number
  /** Total number of items/submenus in the group. */
  groupSize?: number
}

export type BaseItemNode<TData = unknown> = BaseNode<'item', ItemDef<TData>> &
  Omit<BaseItemDef<TData>, 'kind' | 'hidden'> &
  GroupedNode<TData> & {
    search?: SearchContext
  }

export type ButtonItemNode<TData = unknown> = BaseItemNode<TData> & {
  variant: 'button'
  value?: never
}

export type CheckboxItemNode<TData = unknown> = BaseItemNode<TData> & {
  variant: 'checkbox'
  /** Controlled checked state. */
  checked: boolean
  /** Callback when checked state changes. */
  onCheckedChange: (checked: boolean) => void
}

export type RadioItemNode<TData = unknown> = BaseItemNode<TData> & {
  variant: 'radio'
  /** Value for this radio item. Required at runtime (uses id as fallback). */
  value: string
}

export type ItemNode<TData = unknown> =
  | ButtonItemNode<TData>
  | CheckboxItemNode<TData>
  | RadioItemNode<TData>

export type BaseGroupNode<TData = unknown> = BaseNode<
  'group',
  GroupDef<TData>
> & {
  heading?: string
  nodes: (ItemNode<TData> | SubmenuNode<any>)[]
}

export type DefaultGroupNode<TData = unknown> = BaseGroupNode<TData> & {
  variant: 'default'
  value?: never
  onValueChange?: never
}

export type RadioGroupNode<TData = unknown> = BaseGroupNode<TData> & {
  variant: 'radio'
  value: string
  onValueChange: (value: string) => void
}

export type GroupNode<TData = unknown> =
  | DefaultGroupNode<TData>
  | RadioGroupNode<TData>

export type SeparatorNode = BaseNode<'separator', SeparatorDef> & {
  /** Optional label for the separator (can be used for section headers). */
  label?: string
}

export type LoadingNode = BaseNode<'loading', LoadingDef> & {
  /** Progress information for in-progress loaders */
  progress?: LoaderProgress[]
  /** Paths of loaders that are still loading */
  inProgressPaths?: string[]
  /** Paths of loaders that have completed */
  completedPaths?: string[]
}

/**
 * Submenu runtime node type.
 * The submenu node IS the menu itself (no separate child property).
 * Combines submenu properties with menu runtime properties.
 */
export type SubmenuNode<TData = unknown, TChild = unknown> = BaseNode<
  'submenu',
  SubmenuDef<TData, TChild>
> &
  Omit<SubmenuDef<TData, TChild>, 'kind' | 'hidden' | 'search' | 'nodes'> &
  GroupedNode<TData> & {
    // Menu runtime properties
    nodes: Node<TChild>[]
    surfaceId: string
    depth: number
    /** Base defaults (factory + instance only) passed down from parent, used for submenu inheritance */
    baseDefaults?: MenuNodeDefaults<TChild>
    /** Loading state metadata (present when menu is in async mode). */
    loadingState?: {
      isLoading?: boolean
      isError?: boolean
      error?: Error | null
      isFetching?: boolean
      /** Progress details for deep search loaders */
      progress?: LoaderProgress[]
      /** Load mode: 'blocking' (wait for all) or 'streaming' (show as they arrive) */
      loadMode?: LoadMode
      /** Paths of completed loaders (streaming mode) */
      completedPaths?: Set<string>
      /** Paths of in-progress loaders (streaming mode) */
      inProgressPaths?: Set<string>
    }
    search?: SearchContext
  }

/**
 * Union type for any menu (root or submenu).
 * Used for typing the parent property on nodes.
 */
export type Menu<TData = unknown> =
  | RootMenuNode<TData>
  | SubmenuNode<TData, any>

export type Node<TData = unknown> =
  | ItemNode<TData>
  | GroupNode<TData>
  | SubmenuNode<TData, any>
  | SeparatorNode
  | LoadingNode

export type NodeDef<TData = unknown> =
  | ItemDef<TData>
  | GroupDef<TData>
  | SubmenuDef<TData, any>
  | SeparatorDef
  | LoadingDef

/* ================================================================================================
 * Standard Node Implementation Aliases
 *
 * The types above (ItemDef, ItemNode, MenuDef, Menu, etc.) ARE the "Standard" implementation.
 * These aliases provide explicit "Standard" naming for clarity and consistency with
 * other menu packages (CommandNode, PopupNode, etc.).
 * ============================================================================================== */

/**
 * Standard node definition - union of all standard node definition types.
 * Alias for NodeDef<TData>.
 */
export type StandardNodeDef<TData = unknown> = NodeDef<TData>

/**
 * Standard runtime node - union of all standard runtime node types.
 * Alias for Node<TData>.
 */
export type StandardNode<TData = unknown> = Node<TData>

/**
 * Standard item definition - alias for ItemDef<TData>.
 */
export type StandardItemDef<TData = unknown> = ItemDef<TData>

/**
 * Standard item runtime node - alias for ItemNode<TData>.
 */
export type StandardItemNode<TData = unknown> = ItemNode<TData>

/**
 * Standard group definition - alias for GroupDef<TData>.
 */
export type StandardGroupDef<TData = unknown> = GroupDef<TData>

/**
 * Standard group runtime node - alias for GroupNode<TData>.
 */
export type StandardGroupNode<TData = unknown> = GroupNode<TData>

/**
 * Standard separator definition - alias for SeparatorDef.
 */
export type StandardSeparatorDef = SeparatorDef

/**
 * Standard separator runtime node - alias for SeparatorNode.
 */
export type StandardSeparatorNode = SeparatorNode

/**
 * Standard loading definition - alias for LoadingDef.
 */
export type StandardLoadingDef = LoadingDef

/**
 * Standard loading runtime node - alias for LoadingNode.
 */
export type StandardLoadingNode = LoadingNode

/**
 * Standard submenu definition - alias for SubmenuDef<TData, TChild>.
 */
export type StandardSubmenuDef<TData = unknown, TChild = unknown> = SubmenuDef<
  TData,
  TChild
>

/**
 * Standard submenu runtime node - alias for SubmenuNode<TData, TChild>.
 */
export type StandardSubmenuNode<
  TData = unknown,
  TChild = unknown,
> = SubmenuNode<TData, TChild>

/**
 * Standard menu definition - alias for RootMenuDef<TData>.
 */
export type StandardMenuDef<TData = unknown> = RootMenuDef<TData>

/**
 * Standard menu runtime type - alias for Menu<TData>.
 */
export type StandardMenu<TData = unknown> = Menu<TData>

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
    'data-menu-item-id': string
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
    'data-slot': 'menu-content'
    'data-state': 'open' | 'closed'
    'data-menu-surface': true
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
    'data-slot': 'menu-input'
    'data-menu-input': true
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
    'data-slot': 'menu-list'
    'data-menu-list': true
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
 * Theme System Types
 * ============================================================================================== */

/**
 * Search state information provided to the Input slot.
 */
export interface InputSearchState {
  /** Current query string */
  query: string
  /** Whether any loader is currently loading */
  isLoading?: boolean
  /** Whether any loader is currently fetching */
  isFetching?: boolean
  /** Whether any loader has an error */
  isError?: boolean
  /** Error from the loader (if any) */
  error?: Error | null
  /** Load mode: 'blocking' or 'streaming' */
  loadMode?: LoadMode
  /** Deep search progress (which submenus are being searched) */
  progress?: LoaderProgress[]
  /** Paths of completed loaders (streaming mode) */
  completedPaths?: Set<string>
  /** Paths of in-progress loaders (streaming mode) */
  inProgressPaths?: Set<string>
}

export interface ItemSlotProps<TData = unknown> {
  node: ItemNode<TData>
  search?: SearchContext
  bind: RowBindAPI
}

export interface ListSlotProps<TData = unknown> {
  query?: string
  nodes: Node<TData>[]
  children: React.ReactNode
  bind: ListBindAPI
}

/** Slot renderers to customize visuals. */
export type MenuSlots<TData = unknown> = {
  Content: (args: {
    menu: Menu<TData>
    children: React.ReactNode
    bind: ContentBindAPI
  }) => React.ReactNode
  Header?: (args: {
    menu: Menu<TData>
    /** Load mode: 'blocking' or 'streaming' */
    loadMode?: LoadMode
  }) => React.ReactNode
  Input: (args: {
    value: string
    onChange: (v: string) => void
    bind: InputBindAPI
    search: InputSearchState
  }) => React.ReactNode
  List: (args: ListSlotProps<TData>) => React.ReactNode
  /** Shown when no nodes are available after loading completes. */
  Empty?: (args: { query: string }) => React.ReactNode
  /** Shown during initial async load (when isLoading && !data). */
  Loading?: (args: {
    menu: Menu<TData>
    /** Whether any loader is currently fetching */
    isFetching?: boolean
    /** Deep search progress (which submenus are being searched) */
    progress?: LoaderProgress[]
    /** Query that triggered the search (if deep search is active) */
    query?: string
    /** Load mode: 'blocking' or 'streaming' */
    loadMode?: LoadMode
  }) => React.ReactNode
  /**
   * Shown inline at the end of the list during streaming mode.
   * Renders as a node in the list while loaders are still in progress.
   */
  InlineLoading?: (args: {
    /** Progress information for in-progress loaders */
    progress?: LoaderProgress[]
    /** Paths of loaders still loading */
    inProgressPaths?: string[]
    /** Paths of loaders that have completed */
    completedPaths?: string[]
    /** Query that triggered the search */
    query?: string
  }) => React.ReactNode
  /** Shown when async load fails (when isError). */
  Error?: (args: { menu: Menu<TData>; error?: Error }) => React.ReactNode
  Item: (args: ItemSlotProps<TData>) => React.ReactNode
  SubmenuTrigger: (args: {
    node: SubmenuNode<TData>
    search?: SearchContext
    bind: RowBindAPI
  }) => React.ReactNode
  GroupHeading?: (args: {
    node: GroupNode<TData>
    bind: GroupHeadingBindAPI
  }) => React.ReactNode
  Separator?: (args: { node: SeparatorNode }) => React.ReactNode
  Footer?: (args: { menu: Menu<TData> }) => React.ReactNode
}

/** ClassNames that style the menu surface (content/list/items/etc.). */
export type MenuClassNames = {
  content?: string
  input?: string
  list?: string
  itemWrapper?: string
  item?: string
  subtriggerWrapper?: string
  subtrigger?: string
  groupHeading?: string
  separator?: string
}

/** Slot props forwarded to menu surface slots (Input/List/Content/Header/Footer). */
export type MenuSlotProps = {
  content?: React.HTMLAttributes<HTMLElement>
  header?: React.HTMLAttributes<HTMLElement>
  input?: React.InputHTMLAttributes<HTMLInputElement>
  list?: React.HTMLAttributes<HTMLElement>
  footer?: React.HTMLAttributes<HTMLElement>
}

export type MenuThemeDef<
  TData = unknown,
  TSlots = MenuSlots<TData>,
  TSlotProps = MenuSlotProps,
  TClassNames = MenuClassNames,
> = {
  slots?: Partial<TSlots>
  slotProps?: Partial<TSlotProps>
  classNames?: Partial<TClassNames>
}

export type MenuTheme<
  TData = unknown,
  TSlots = MenuSlots<TData>,
  TSlotProps = MenuSlotProps,
  TClassNames = MenuClassNames,
> = {
  slots: Required<TSlots>
  slotProps?: Partial<TSlotProps>
  classNames?: Partial<TClassNames>
}

/* ================================================================================================
 * Menu Surface Props
 * ============================================================================================== */

export type Direction = 'ltr' | 'rtl'

/** Defaulted parts of nodes for convenience. */
export type MenuNodeDefaults<TData = unknown> = {
  surface?: Pick<
    MenuSurfaceProps<TData>,
    'vimBindings' | 'dir' | 'onOpenAutoFocus' | 'onCloseAutoClear'
  >
  item?: Pick<BaseItemDef<TData>, 'onSelect' | 'closeOnSelect'>
  /** Default virtualization configuration applied to all menus/submenus */
  virtualization?: VirtualizationConfig<TData>
}

export interface MenuSurfaceProps<TData = unknown>
  extends Omit<DivProps, 'dir' | 'children'> {
  menu: RootMenuDef<TData> | SubmenuDef<TData, any> | Menu<TData>
  render?: () => React.ReactNode
  vimBindings?: boolean
  dir?: Direction
  defaults?: Partial<MenuNodeDefaults<TData>>
  onOpenAutoFocus?: boolean
  onCloseAutoClear?: boolean | number
  /** @internal Forced surface id; used by submenus. */
  surfaceIdProp?: string
  /** @internal Suppress hover-open until first pointer move; used by submenus opened via keyboard. */
  suppressHoverOpenOnMount?: boolean
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

export type SurfaceStore<TData> = {
  subscribe(cb: () => void): () => void
  snapshot(): SurfaceState
  set<K extends keyof SurfaceState>(k: K, v: SurfaceState[K]): void

  getNodes(): Node<TData>[]
  setNodes(nodes: Node<TData>[]): void

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
  readonly ignorePointerRef: React.MutableRefObject<boolean>
}

export type KeyboardOptions = { dir: Direction; vimBindings: boolean }

export type RadioGroupContextValue = {
  value: string
  onValueChange: (value: string) => void
}
