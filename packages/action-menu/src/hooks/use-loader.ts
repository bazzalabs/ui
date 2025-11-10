import * as React from 'react'
import type {
  AsyncNodeLoader,
  AsyncNodeLoaderContext,
  AsyncNodeLoaderResult,
  LoaderAdapter,
  NodeDef,
} from '../types.js'

/**
 * Internal hook for native async loader execution.
 * DO NOT use this directly - use the NativeLoaderAdapter instead.
 *
 * @internal
 */
function useLoaderInternal<T>(
  loader: AsyncNodeLoader<T> | undefined,
  context: AsyncNodeLoaderContext,
): AsyncNodeLoaderResult<T> | undefined {
  const [data, setData] = React.useState<NodeDef<T>[] | undefined>(undefined)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const [isError, setIsError] = React.useState(false)

  // Track the abort controller for cleanup
  const abortControllerRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    // No loader provided
    if (!loader) {
      setData(undefined)
      setIsLoading(false)
      setIsFetching(false)
      setError(null)
      setIsError(false)
      return
    }

    // Static result (already resolved)
    if (typeof loader === 'object' && 'data' in loader) {
      setData(loader.data)
      setIsLoading(loader.isLoading ?? false)
      setIsFetching(loader.isFetching ?? false)
      setError(loader.error ?? null)
      setIsError(loader.isError ?? false)
      return
    }

    // Function loader - execute it
    if (typeof loader === 'function') {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      // Call the loader function to get the result
      const loaderResult = loader(context)

      // If the loader returns a static result (not a promise), use it directly
      if (
        loaderResult &&
        typeof loaderResult === 'object' &&
        'data' in loaderResult
      ) {
        if (!abortController.signal.aborted) {
          setData(loaderResult.data)
          setIsLoading(loaderResult.isLoading ?? false)
          setIsFetching(loaderResult.isFetching ?? false)
          setError(loaderResult.error ?? null)
          setIsError(loaderResult.isError ?? false)
        }
        return
      }

      // If the loader function returns a Promise directly (async function returning data)
      const maybePromise = loaderResult as any
      if (maybePromise && typeof maybePromise.then === 'function') {
        const isFirstLoad = data === undefined
        setIsLoading(isFirstLoad)
        setIsFetching(true)
        setIsError(false)
        setError(null)

        maybePromise
          .then((result: NodeDef<T>[]) => {
            if (!abortController.signal.aborted) {
              setData(result)
              setIsLoading(false)
              setIsFetching(false)
              setError(null)
              setIsError(false)
            }
          })
          .catch((err: Error) => {
            if (!abortController.signal.aborted) {
              setData(undefined)
              setIsLoading(false)
              setIsFetching(false)
              setError(err)
              setIsError(true)
            }
          })

        return
      }

      // Unknown loader type - warn in development
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[action-menu] Loader function returned unexpected type. Expected AsyncNodeLoaderResult or Promise<NodeDef[]>.',
          loaderResult,
        )
      }
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [loader, context.query, context.open])

  // Return undefined if no loader
  if (!loader) {
    return undefined
  }

  return {
    data,
    isLoading,
    isFetching,
    error,
    isError,
  }
}

/**
 * Internal hook for loading multiple loaders in parallel (deep search).
 * DO NOT use this directly - use the NativeLoaderAdapter instead.
 *
 * @internal
 */
function useLoadersInternal<T>(
  loaders: Array<{
    path: string[]
    loader: AsyncNodeLoader<T>
    context: AsyncNodeLoaderContext
  }>,
): Map<string, AsyncNodeLoaderResult<T>> {
  const [resultsMap, setResultsMap] = React.useState<
    Map<string, AsyncNodeLoaderResult<T>>
  >(() => new Map())

  // Create stable serialized key from all loader paths
  const loadersKey = React.useMemo(
    () => loaders.map((l) => l.path.join('.')).join('|'),
    [loaders],
  )

  // Track individual loader states
  const loaderStates = React.useRef<
    Map<
      string,
      {
        data?: NodeDef<T>[]
        isLoading: boolean
        isFetching: boolean
        error: Error | null
        isError: boolean
      }
    >
  >(new Map())

  const abortControllersRef = React.useRef<Map<string, AbortController>>(
    new Map(),
  )

  React.useEffect(() => {
    if (loaders.length === 0) {
      setResultsMap(new Map())
      return
    }

    const newStates = new Map(loaderStates.current)

    // Execute each loader
    loaders.forEach(({ path, loader, context }) => {
      const key = path.join('.')

      // Cancel previous request for this key
      const prevController = abortControllersRef.current.get(key)
      if (prevController) {
        prevController.abort()
      }

      // Create new abort controller
      const abortController = new AbortController()
      abortControllersRef.current.set(key, abortController)

      // Static result
      if (typeof loader === 'object' && 'data' in loader) {
        newStates.set(key, {
          data: loader.data,
          isLoading: loader.isLoading ?? false,
          isFetching: loader.isFetching ?? false,
          error: loader.error ?? null,
          isError: loader.isError ?? false,
        })
        return
      }

      // Function loader
      if (typeof loader === 'function') {
        const loaderResult = loader(context)

        // Static result from function
        if (
          loaderResult &&
          typeof loaderResult === 'object' &&
          'data' in loaderResult
        ) {
          if (!abortController.signal.aborted) {
            newStates.set(key, {
              data: loaderResult.data,
              isLoading: loaderResult.isLoading ?? false,
              isFetching: loaderResult.isFetching ?? false,
              error: loaderResult.error ?? null,
              isError: loaderResult.isError ?? false,
            })
          }
          return
        }

        // Promise result
        const maybePromise = loaderResult as any
        if (maybePromise && typeof maybePromise.then === 'function') {
          const currentState = newStates.get(key)
          const isFirstLoad = !currentState || currentState.data === undefined

          newStates.set(key, {
            data: currentState?.data,
            isLoading: isFirstLoad,
            isFetching: true,
            error: null,
            isError: false,
          })

          maybePromise
            .then((result: NodeDef<T>[]) => {
              if (!abortController.signal.aborted) {
                setResultsMap((prev) => {
                  const next = new Map(prev)
                  next.set(key, {
                    data: result,
                    isLoading: false,
                    isFetching: false,
                    error: null,
                    isError: false,
                  })
                  return next
                })
                loaderStates.current.set(key, {
                  data: result,
                  isLoading: false,
                  isFetching: false,
                  error: null,
                  isError: false,
                })
              }
            })
            .catch((err: Error) => {
              if (!abortController.signal.aborted) {
                setResultsMap((prev) => {
                  const next = new Map(prev)
                  next.set(key, {
                    data: undefined,
                    isLoading: false,
                    isFetching: false,
                    error: err,
                    isError: true,
                  })
                  return next
                })
                loaderStates.current.set(key, {
                  data: undefined,
                  isLoading: false,
                  isFetching: false,
                  error: err,
                  isError: true,
                })
              }
            })
        }
      }
    })

    // Update the map with new states (synchronous updates)
    setResultsMap(new Map(newStates))
    loaderStates.current = newStates

    // Cleanup
    return () => {
      abortControllersRef.current.forEach((controller) => {
        controller.abort()
      })
      abortControllersRef.current.clear()
    }
  }, [loadersKey])

  return resultsMap
}

/**
 * Native loader adapter that uses basic React primitives (no external dependencies).
 * This is the default adapter used when no custom adapter is provided.
 *
 * Features:
 * - Uses useState + useEffect for async state management
 * - No caching or deduplication
 * - Supports async functions returning Promise<NodeDef[]>
 * - Supports functions returning AsyncNodeLoaderResult
 * - Supports static AsyncNodeLoaderResult objects
 */
export const NativeLoaderAdapter: LoaderAdapter = {
  useLoader<T>(
    loader: AsyncNodeLoader<T> | undefined,
    context: AsyncNodeLoaderContext,
  ): AsyncNodeLoaderResult<T> | undefined {
    return useLoaderInternal(loader, context)
  },

  useLoaders<T>(
    loaders: Array<{
      path: string[]
      loader: AsyncNodeLoader<T>
      context: AsyncNodeLoaderContext
    }>,
  ): Map<string, AsyncNodeLoaderResult<T>> {
    return useLoadersInternal(loaders)
  },
}
