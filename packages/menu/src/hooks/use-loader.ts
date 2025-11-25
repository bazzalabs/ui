import type { Loader, LoaderContext, LoaderResult } from '@bazza-ui/loaders'
import { nativeLoader } from '@bazza-ui/loaders'
import * as React from 'react'
import type {
  AsyncNodeLoader,
  AsyncNodeLoaderContext,
  AsyncNodeLoaderResult,
  NodeDef,
} from '../types.js'

/**
 * Convert menu-specific loader context to base loader context
 */
function contextToLoaderContext(
  context: AsyncNodeLoaderContext,
): LoaderContext {
  return {
    query: context.query,
    isOpen: context.open,
    path: [], // Path will be set by the caller if needed
  }
}

/**
 * Convert LoaderResult to menu-specific AsyncNodeLoaderResult
 * This is a pass-through since they're already compatible
 */
function loaderResultToAsyncNodeResult<T>(
  result: AsyncNodeLoaderResult<T>,
): AsyncNodeLoaderResult<T> {
  return result
}

/**
 * Hook to execute a single async loader.
 * Loaders are just hook functions - we call them and return the result.
 *
 * IMPORTANT: The loader prop must remain stable (either always defined or always undefined)
 * for a given component instance to avoid hooks order violations.
 *
 * @internal
 */
export function useLoader<T>(
  loader: AsyncNodeLoader<T> | undefined,
  context: AsyncNodeLoaderContext,
): AsyncNodeLoaderResult<T> | undefined {
  const loaderContext = React.useMemo(
    () => contextToLoaderContext(context),
    [context.query, context.open],
  )

  // Simply call the loader if provided, otherwise return undefined
  // The loader must remain stable (defined or undefined) for the component lifetime
  if (loader === undefined) {
    return undefined
  }

  const result = loader(loaderContext)
  return loaderResultToAsyncNodeResult<T>(result)
}

/**
 * Hook to execute multiple async loaders in parallel.
 * Each loader is a hook function that manages its own state.
 *
 * IMPORTANT: The loaders array must be stable (same length and types) for
 * a given component instance to avoid hooks order violations.
 *
 * @internal
 */
export function useLoaders<T>(
  loaders: Array<{
    path: string[]
    loader: AsyncNodeLoader<T>
    context: AsyncNodeLoaderContext
  }>,
): Map<string, AsyncNodeLoaderResult<T>> {
  // Convert contexts to loader contexts
  const loaderContexts = React.useMemo(
    () => loaders.map(({ context }) => contextToLoaderContext(context)),
    [loaders],
  )

  // Call each loader with its context
  // The loaders array must be stable for this to work correctly
  const results = loaders.map(({ loader }, index) => {
    const context = loaderContexts[index]
    if (!context) {
      throw new Error(`Missing context for loader at index ${index}`)
    }
    return loader(context)
  })

  // Build result map
  return React.useMemo(() => {
    const resultMap = new Map<string, AsyncNodeLoaderResult<T>>()

    for (let i = 0; i < loaders.length; i++) {
      const entry = loaders[i]
      if (!entry) continue

      const pathKey = entry.path.join('.')
      const result = results[i]

      if (result) {
        resultMap.set(pathKey, loaderResultToAsyncNodeResult<T>(result))
      }
    }

    return resultMap
  }, [loaders, results])
}
