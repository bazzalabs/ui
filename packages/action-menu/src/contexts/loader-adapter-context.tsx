import * as React from 'react'
import { NativeLoaderAdapter } from '../hooks/use-loader.js'
import type { LoaderAdapter } from '../types.js'

/**
 * Context for providing a custom loader adapter to all surfaces.
 * Defaults to NativeLoaderAdapter when no custom adapter is provided.
 */
const LoaderAdapterContext =
  React.createContext<LoaderAdapter>(NativeLoaderAdapter)

/**
 * Hook to access the current loader adapter.
 * Always returns a LoaderAdapter (defaults to NativeLoaderAdapter).
 */
export function useLoaderAdapter(): LoaderAdapter {
  return React.useContext(LoaderAdapterContext)
}

/**
 * Provider component for setting a custom loader adapter.
 * Use this to opt-in to React Query or other data fetching libraries.
 *
 * @example
 * ```tsx
 * import { ReactQueryLoaderAdapter } from '@bazzalabs/action-menu/react-query'
 *
 * <LoaderAdapterProvider adapter={ReactQueryLoaderAdapter}>
 *   <ActionMenu.Root>
 *     {/* All surfaces will use React Query for loaders *\/}
 *   </ActionMenu.Root>
 * </LoaderAdapterProvider>
 * ```
 */
export function LoaderAdapterProvider({
  adapter,
  children,
}: {
  adapter: LoaderAdapter
  children: React.ReactNode
}) {
  return (
    <LoaderAdapterContext.Provider value={adapter}>
      {children}
    </LoaderAdapterContext.Provider>
  )
}
