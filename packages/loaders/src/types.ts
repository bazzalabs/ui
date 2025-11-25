/**
 * Context provided to loaders when they execute
 */
export type LoaderContext = {
  /** Search query (for searchable menus) */
  query?: string
  /** Whether the menu is currently open */
  isOpen?: boolean
  /** Path to this node in the menu tree */
  path?: string[]
}

/**
 * Result returned by a loader - consistent interface across all loader types
 */
export type LoaderResult<T = any> = {
  /** The loaded data */
  data: T | undefined
  /** Whether the loader is currently loading */
  isLoading: boolean
  /** Whether the loader encountered an error */
  isError: boolean
  /** Error if the load failed */
  error: Error | null
}

/**
 * A loader is a hook function that takes context and returns a result.
 * This is the core abstraction - all loaders follow this interface.
 *
 * @example
 * ```tsx
 * const myLoader: Loader<NodeDef[]> = (context) => {
 *   const { data, isLoading, isError, error } = useMyDataSource()
 *   return { data, isLoading, isError, error }
 * }
 * ```
 */
export type Loader<T = any> = (context: LoaderContext) => LoaderResult<T>
