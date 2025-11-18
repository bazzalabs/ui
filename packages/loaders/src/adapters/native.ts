import * as React from 'react'
import type { Loader, LoaderContext, LoaderResult } from '../types.js'

/**
 * Native async loader creator function.
 * Creates a loader hook that uses basic React primitives (useState + useEffect).
 *
 * Features:
 * - No external dependencies
 * - No caching or deduplication
 * - Simple state management
 * - Automatic cancellation on unmount
 *
 * @example
 * ```tsx
 * import { nativeLoader } from '@bazza-ui/loaders'
 *
 * const usersLoader = nativeLoader(async (context) => {
 *   const response = await fetch(`/api/users?q=${context.query}`)
 *   return response.json()
 * })
 * ```
 */
export function nativeLoader<T>(
  fetchFn: (context: LoaderContext) => Promise<T>,
): Loader<T> {
  // Return a hook function that follows the Loader interface
  return (context: LoaderContext): LoaderResult<T> => {
    const [data, setData] = React.useState<T | undefined>(undefined)
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<Error | null>(null)

    // Track the abort controller for cleanup
    const abortControllerRef = React.useRef<AbortController | null>(null)

    React.useEffect(() => {
      // Don't run loader when menu is closed
      if (!context.isOpen) {
        setIsLoading(false)
        return
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      // Reset error state and start loading
      setIsLoading(true)
      setError(null)

      // Execute loader
      const loadData = async () => {
        try {
          const result = await fetchFn(context)

          if (!abortController.signal.aborted) {
            setData(result)
            setIsLoading(false)
          }
        } catch (err) {
          if (!abortController.signal.aborted) {
            setError(err as Error)
            setIsLoading(false)
          }
        }
      }

      loadData()

      // Cleanup function
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
          abortControllerRef.current = null
        }
      }
    }, [context.query, context.isOpen])

    return {
      data,
      isLoading,
      isError: !!error,
      error,
    }
  }
}
