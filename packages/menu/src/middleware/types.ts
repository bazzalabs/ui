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
export type SearchResult<T = unknown> = {
  type: 'item' | 'submenu'
  node: ItemNode<T> | Node<T>
  breadcrumbs: string[]
  breadcrumbIds: string[]
  score: number
}

/**
 * Core middleware interface with three transformation hooks
 */
export interface MenuMiddleware<T = unknown> {
  /**
   * Pre-filter hook: transform nodes before search/filter
   * Called before the collect() function runs
   */
  beforeFilter?: (context: BeforeFilterContext<T>) => Node<T>[]

  /**
   * Post-filter hook: transform search results after scoring
   * Called after collect() and sort, before flattening
   * Only runs in search mode
   */
  afterFilter?: (context: AfterFilterContext<T>) => SearchResult<T>[]

  /**
   * Transform hook: transform flattened nodes before rendering
   * Called after flattening, has access to both search and browse mode
   * This is the most commonly used hook
   */
  transformNodes?: (context: TransformNodesContext<T>) => Node<T>[]
}

/**
 * Context passed to beforeFilter middleware
 */
export interface BeforeFilterContext<T = unknown> {
  /** Original menu nodes before any filtering */
  nodes: Node<T>[]
  /** Current search query */
  query: string
  /** Reference to the menu instance */
  menu: Menu<T>
}

/**
 * Context passed to afterFilter middleware
 */
export interface AfterFilterContext<T = unknown> {
  /** Scored and sorted search results */
  results: SearchResult<T>[]
  /** Current search query */
  query: string
  /** Reference to the menu instance */
  menu: Menu<T>
}

/**
 * Context passed to transformNodes middleware
 */
export interface TransformNodesContext<T = unknown> {
  /** Flattened nodes ready for rendering (after filtering and group expansion) */
  nodes: Node<T>[]
  /** Current search query (empty string if not searching) */
  query: string
  /** Current mode: browsing or searching */
  mode: 'browse' | 'search'
  /** Original unfiltered menu nodes */
  allNodes: Node<T>[]
  /** Reference to the menu instance */
  menu: Menu<T>
  /** Helper: create a properly instantiated node */
  createNode: <U = T>(def: ItemDef<U>) => ItemNode<U>
  /** Helper: check if query exactly matches any node label */
  hasExactMatch: (query: string) => boolean
}

/**
 * Configuration for the createNew middleware
 */
export interface CreateNewConfig<T = unknown> {
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
    nodes: Node<T>[]
    allNodes: Node<T>[]
    mode: 'browse' | 'search'
    menu: Menu<T>
  }) => React.ReactNode

  /**
   * Callback when create item is selected
   * Receives the current query value
   */
  onCreate: (query: string) => void | Promise<void>
}
