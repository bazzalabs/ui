import type { AsyncNodeLoader } from '@bazza-ui/menu'
import { useLoader } from '@bazza-ui/menu'
import * as React from 'react'
import type { CommandMenuDef, CommandSubmenuDef } from '../types.js'

export interface UseMenuLoaderOptions {
  /** The menu definition containing the loader */
  menuDef: CommandMenuDef<any> | CommandSubmenuDef<any>
  /** Current query string */
  query: string
  /** Whether the menu is open */
  open: boolean
}

/**
 * Hook for orchestrating menu loaders.
 * Handles loader extraction, query determination, and execution.
 */
export function useMenuLoader<T>(options: UseMenuLoaderOptions) {
  const { menuDef, query, open } = options

  // Extract the loader from the menu
  const menuLoader = React.useMemo(() => {
    return 'loader' in menuDef ? menuDef.loader : undefined
  }, [menuDef]) as AsyncNodeLoader<T>

  // Determine if we should pass query to the loader
  const loaderQuery = React.useMemo(() => {
    const searchMode = menuDef.search?.mode ?? 'client'
    return searchMode === 'client' ? '' : query
  }, [menuDef.search?.mode, query])

  // Create loader context
  const loaderContext = React.useMemo(
    () => ({
      query: loaderQuery,
      open,
    }),
    [loaderQuery, open],
  )

  // Execute loader
  return useLoader<T>(menuLoader, loaderContext)
}
