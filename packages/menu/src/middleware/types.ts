import type { MenuControl } from '../control.js'
import type {
  Iconish,
  ItemDef,
  ItemNode,
  Menu,
  Node,
  RowBindAPI,
} from '../types.js'

/**
 * Search result wrapper with score and breadcrumb metadata
 */
export type SearchResult<TData = unknown> = {
  type: 'item' | 'submenu'
  node: ItemNode<TData> | Node<TData>
  breadcrumbs: string[]
  breadcrumbIds: string[]
  score: number
}

/**
 * Core middleware interface with three transformation hooks
 *
 * @typeParam TData - The data type for menu nodes
 * @typeParam TControl - The control API type (defaults to MenuControl<TData>)
 */
export interface MenuMiddleware<
  TData = unknown,
  TControl extends MenuControl<TData> = MenuControl<TData>,
> {
  /**
   * Pre-filter hook: transform nodes before search/filter
   * Called before the collect() function runs
   */
  beforeFilter?: (
    context: BeforeFilterContext<TData, TControl>,
  ) => Node<TData>[]

  /**
   * Post-filter hook: transform search results after scoring
   * Called after collect() and sort, before flattening
   * Only runs in search mode
   */
  afterFilter?: (
    context: AfterFilterContext<TData, TControl>,
  ) => SearchResult<TData>[]

  /**
   * Transform hook: transform flattened nodes before rendering
   * Called after flattening, has access to both search and browse mode
   * This is the most commonly used hook
   */
  transformNodes?: (
    context: TransformNodesContext<TData, TControl>,
  ) => Node<TData>[]
}

/**
 * Context passed to beforeFilter middleware
 */
export interface BeforeFilterContext<
  TData = unknown,
  TControl extends MenuControl<TData> = MenuControl<TData>,
> {
  /** Original menu nodes before any filtering */
  nodes: Node<TData>[]
  /** Current search query */
  query: string
  /** Reference to the menu instance */
  menu: Menu<TData>
  /** Menu control API for programmatic manipulation (optional, depends on implementation) */
  control?: TControl
}

/**
 * Context passed to afterFilter middleware
 */
export interface AfterFilterContext<
  TData = unknown,
  TControl extends MenuControl<TData> = MenuControl<TData>,
> {
  /** Scored and sorted search results */
  results: SearchResult<TData>[]
  /** Current search query */
  query: string
  /** Reference to the menu instance */
  menu: Menu<TData>
  /** Menu control API for programmatic manipulation (optional, depends on implementation) */
  control?: TControl
}

/**
 * Context passed to transformNodes middleware
 */
export interface TransformNodesContext<
  TData = unknown,
  TControl extends MenuControl<TData> = MenuControl<TData>,
> {
  /** Flattened nodes ready for rendering (after filtering and group expansion) */
  nodes: Node<TData>[]
  /** Current search query (empty string if not searching) */
  query: string
  /** Current mode: browsing or searching */
  mode: 'browse' | 'search'
  /** Original unfiltered menu nodes */
  allNodes: Node<TData>[]
  /** Reference to the menu instance */
  menu: Menu<TData>
  /** Helper: create a properly instantiated node */
  createNode: <U = TData>(def: ItemDef<U>) => ItemNode<U>
  /** Helper: check if query exactly matches any node label */
  hasExactMatch: (query: string) => boolean
  /** Menu control API for programmatic manipulation (optional, depends on implementation) */
  control?: TControl
  /** Whether the menu is currently disabled (e.g., during async operations) */
  disabled?: boolean
}

/**
 * Configuration for the createNew middleware
 *
 * @typeParam TData - The data type for menu nodes
 * @typeParam TControl - The control API type (defaults to MenuControl<TData>)
 */
export interface CreateNewConfig<
  TData = unknown,
  TControl extends MenuControl<TData> = MenuControl<TData>,
> {
  /**
   * Condition for showing the create item:
   * - 'always': Always show (when query exists)
   * - 'no-results': Only when no results found
   * - 'has-query': When query meets minimum length
   * - 'no-exact-match': When query doesn't exactly match any item (recommended)
   */
  showWhen: 'always' | 'no-results' | 'has-query' | 'no-exact-match'

  /**
   * Position of the create item in the list
   * @default 'bottom'
   */
  position?: 'top' | 'bottom'

  /**
   * Label for the create item
   * Can be a string or function that receives the query
   * @default `Create: ${query}`
   */
  label?: string | ((query: string) => string)

  /**
   * Icon to display before the label
   */
  icon?: Iconish

  /**
   * Custom ID for the create item node
   * @default `__create-new-${query}`
   */
  id?: string

  /**
   * Minimum query length before showing create item
   * Only applies when showWhen is 'has-query'
   * @default 1
   */
  minQueryLength?: number

  /**
   * Whether to close the menu after selecting create item
   * @default false
   */
  closeOnSelect?: boolean

  /**
   * Custom render function for the create item
   * Overrides label and icon if provided
   *
   * @param args - Render context with rich information
   * @param args.query - The current search query
   * @param args.bind - Row binding API for event handlers and props
   * @param args.nodes - The filtered nodes being displayed (before create item is added)
   * @param args.allNodes - All nodes in the menu (unfiltered)
   * @param args.mode - Current display mode (browse or search)
   * @param args.menu - Reference to the menu instance
   */
  render?: (args: {
    query: string
    bind: RowBindAPI
    nodes: Node<TData>[]
    allNodes: Node<TData>[]
    mode: 'browse' | 'search'
    menu: Menu<TData>
  }) => React.ReactNode

  /**
   * Callback when create item is selected.
   * Receives an object with query and optional control API.
   *
   * @example Simple usage
   * ```tsx
   * onCreate: async ({ query }) => {
   *   await api.createLabel({ name: query })
   * }
   * ```
   *
   * @example With control API
   * ```tsx
   * onCreate: async ({ query, control }) => {
   *   control?.setLoading(true)
   *   try {
   *     await api.createLabel({ name: query })
   *     control?.close?.() // Type-safe: only available on menus with close()
   *   } finally {
   *     control?.setLoading(false)
   *   }
   * }
   * ```
   */
  onCreate: (args: {
    /** The search query (text to create) */
    query: string
    /** Optional menu control API for programmatic manipulation */
    control?: TControl
  }) => void | Promise<void>
}
