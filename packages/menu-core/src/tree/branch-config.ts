// How a Branch (a submenu or subpage) loads its children and joins deep
// search. A loader is framework code, so the loader configs take its type as
// `TLoader`; packages/react fills it with a React component.

/**
 * Controls how submenu content participates in ancestor deep search results.
 * - `true`: include submenu trigger and descendants
 * - `'trigger-only'`: include submenu trigger only
 * - `false`: exclude submenu trigger and descendants
 */
export type IncludeInDeepSearch = true | 'trigger-only' | false

/**
 * Controls query-loader behavior before users type an active query.
 */
export interface InitialQueryBehavior {
  /**
   * Query value used before user input reaches minQueryLength.
   * Defaults to '' (top/default results).
   * @default ''
   */
  value?: string
  /**
   * When the initial query should load.
   * - 'needed': when submenu is explicitly opened or needed for deep-search execution
   * - 'parent-open': eagerly when direct parent opens
   * @default 'needed'
   */
  loadWhen?: 'needed' | 'parent-open'
}

/**
 * The fields of a static loader config, with the loader's type left to the
 * framework. Loads data once, then filters client-side.
 */
export interface StaticLoaderConfigBase<TLoader = unknown> {
  type: 'static'
  /**
   * Component that calls hooks and provides loader state.
   * This component pattern allows hooks to be called legally within React's rules.
   */
  Loader: TLoader
  /**
   * When to trigger the loader:
   * - 'eager': Load when menu opens (good for deep search)
   * - 'lazy': Load when submenu opens (default)
   * @default 'lazy'
   */
  loadStrategy?: 'eager' | 'lazy'
}

/**
 * The fields of a query loader config, with the loader's type and the node
 * defs it shows left to the framework. Refetches based on search query -
 * server does the filtering.
 */
export interface QueryLoaderConfigBase<TLoader = unknown, TNodeDef = unknown> {
  type: 'query'
  /**
   * Milliseconds to wait after the search stops changing before passing it to
   * the loader. While waiting, the loader counts as fetching, so the menu
   * doesn't show "no results" or treat the search as finished too early.
   * @default 0
   */
  debounce?: number
  /**
   * Component that calls hooks and provides loader state.
   * Receives the current search query as a prop.
   */
  Loader: TLoader
  /**
   * Minimum query length before fetching.
   * @default 1
   */
  minQueryLength?: number
  /**
   * Defines behavior before user query reaches minQueryLength.
   * - object: executes query loader with the configured initial value (default behavior)
   * - false: disables initial fetch until query reaches minQueryLength
   * @default { value: '', loadWhen: 'needed' }
   */
  initialQueryBehavior?: InitialQueryBehavior | false
  /**
   * @deprecated Use `initialQueryBehavior` instead.
   */
  initialQuery?: string
  /**
   * When to trigger the loader:
   * - 'eager': Load when root menu opens (good for deep search)
   * - 'lazy': Load when submenu opens (default)
   * @default 'lazy'
   */
  loadStrategy?: 'eager' | 'lazy'
  /**
   * What to show when query is below minQueryLength.
   * - 'empty': Show nothing
   * - 'placeholder': Show placeholderNodes
   * @default 'empty'
   */
  belowMinBehavior?: 'empty' | 'placeholder'
  /**
   * Placeholder nodes shown when query is below minQueryLength.
   */
  placeholderNodes?: TNodeDef[]
}

/**
 * A branch's async child nodes config: a static or a query loader config.
 */
export type AsyncNodesConfigBase<TLoader = unknown, TNodeDef = unknown> =
  | StaticLoaderConfigBase<TLoader>
  | QueryLoaderConfigBase<TLoader, TNodeDef>
