import * as React from 'react'
import { useFilteredNodes } from '../hooks/use-filtered-nodes.js'
import { useInputActivation } from '../hooks/use-input-activation.js'
import { useLoader } from '../hooks/use-loader.js'
import { useMenu } from '../hooks/use-menu.js'
import type {
  AsyncNodeLoader,
  AsyncNodeLoaderContext,
  RootMenuDef,
  SubmenuDef,
} from '../types.js'
import type { MenuPipelineConfig, MenuPipelineResult } from './types.js'

/**
 * Unified menu pipeline hook that composes all menu state management.
 *
 * This hook orchestrates the complete menu rendering pipeline:
 * 1. Input state management (query, inputActive)
 * 2. Root loader execution
 * 3. Deep search loader orchestration
 * 4. Menu instantiation with result injection
 * 5. Node filtering and scoring
 *
 * @example Basic usage
 * ```tsx
 * function MyMenu({ menuDef, open }) {
 *   const pipeline = useMenuPipeline({
 *     menuDef,
 *     open,
 *   })
 *
 *   return (
 *     <div>
 *       <input
 *         value={pipeline.query}
 *         onChange={(e) => pipeline.setQuery(e.target.value)}
 *       />
 *       <ul>
 *         {pipeline.displayNodes.map(node => (
 *           <li key={node.id}>{node.label}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example Controlled query
 * ```tsx
 * function MyMenu({ menuDef, open }) {
 *   const [query, setQuery] = useState('')
 *
 *   const pipeline = useMenuPipeline({
 *     menuDef,
 *     open,
 *     query,           // Controlled
 *     onQueryChange: setQuery,
 *   })
 *
 *   // pipeline.query === query (controlled)
 * }
 * ```
 */
export function useMenuPipeline<T = unknown>(
  config: MenuPipelineConfig<T>,
): MenuPipelineResult<T> {
  const {
    menuDef,
    open,
    surfaceId: surfaceIdProp = 'root',
    isSubmenu = false,
    defaults,
    control,
    query: queryProp,
    onQueryChange,
    filterMode: filterModeProp,
  } = config

  // Surface ID is stable for the lifetime of this pipeline
  const surfaceId = React.useMemo(() => surfaceIdProp, [surfaceIdProp])

  // ============================================================================
  // PHASE 1: Input State
  // ============================================================================
  const hideSearchUntilActive = menuDef.hideSearchUntilActive ?? false
  const {
    inputActive,
    query: internalQuery,
    setQuery: setInternalQuery,
    setInputActive,
  } = useInputActivation(hideSearchUntilActive)

  // Support controlled query mode
  const query = queryProp ?? internalQuery
  const setQuery = React.useCallback(
    (newQuery: string) => {
      if (onQueryChange) {
        onQueryChange(newQuery)
      } else {
        setInternalQuery(newQuery)
      }
    },
    [onQueryChange, setInternalQuery],
  )

  // ============================================================================
  // PHASE 2: Root Loader Execution
  // ============================================================================
  const menuLoader = React.useMemo(() => {
    return 'loader' in menuDef ? menuDef.loader : undefined
  }, [menuDef]) as AsyncNodeLoader<T> | undefined

  // Determine query to pass to loader based on search mode
  const loaderQuery = React.useMemo(() => {
    const searchMode = menuDef.search?.mode ?? 'client'
    return searchMode === 'client' ? '' : query
  }, [menuDef.search?.mode, query])

  const loaderContext = React.useMemo<AsyncNodeLoaderContext>(
    () => ({
      query: loaderQuery,
      open,
    }),
    [loaderQuery, open],
  )

  const rootLoaderResult = useLoader(menuLoader, loaderContext)

  // ============================================================================
  // PHASE 3-4: Deep Search & Menu Instantiation (via useMenu)
  // ============================================================================
  const { menu, aggregatedState, streamingEnabled, completionOrder } =
    useMenu<T>({
      menuDef: menuDef as RootMenuDef<T> | SubmenuDef<T>,
      query,
      open,
      surfaceId,
      isSubmenu,
      rootLoaderResult,
      defaults,
    })

  // ============================================================================
  // PHASE 5: Filtering
  // ============================================================================
  // Determine filter mode
  const filterMode = React.useMemo(() => {
    if (typeof filterModeProp === 'function') {
      return filterModeProp(query)
    }
    if (filterModeProp) {
      return filterModeProp
    }
    // Default: deep when searching, shallow when browsing
    return query.length > 0 ? 'deep' : 'shallow'
  }, [filterModeProp, query])

  const { filteredNodes, displayNodes } = useFilteredNodes(menu, query, {
    mode: filterMode,
    streamingEnabled,
    completionOrder,
    control,
  })

  // ============================================================================
  // Return Pipeline Result
  // ============================================================================
  return {
    // Input state
    inputActive,
    setInputActive,
    query,
    setQuery,

    // Menu state
    menu,
    displayNodes,
    filteredNodes,

    // Loading state
    streamingEnabled,
    aggregatedState,
    completionOrder,

    // Metadata
    surfaceId,
    isSubmenu,
  }
}
