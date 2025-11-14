import type {
  AggregatedLoaderState,
  AsyncNodeLoader,
  AsyncNodeLoaderResult,
  GroupDef,
  MenuDef,
  NodeDef,
  SubmenuDef,
} from '../types.js'
import { textToId } from './menu-utils.js'

/**
 * Metadata for a deep search loader that will be executed in parallel.
 */
export type DeepSearchLoaderEntry<T = unknown> = {
  /** Path to the submenu (array of submenu ids from root). */
  path: string[]
  /** The loader to execute */
  loader: AsyncNodeLoader<T>
  /** Search configuration from the submenu (for minLength, debounce, etc.) */
  searchConfig?: import('../types.js').SearchConfig
}

/**
 * Recursively collects all deep search loaders from a menu definition tree.
 * Returns an array of loader entries with their paths.
 */
export function collectDeepSearchLoaders<T = unknown>(
  menuDef: MenuDef<T>,
  parentPath: string[] = [],
): DeepSearchLoaderEntry<T>[] {
  const entries: DeepSearchLoaderEntry<T>[] = []

  // If this menu itself has a loader, we don't include it here
  // (it's handled separately by the Surface component)

  // Traverse nodes to find deep search submenus
  const nodes = menuDef.nodes || []
  for (const node of nodes) {
    if (node.kind === 'submenu') {
      collectDeepSearchLoadersFromNode(node, parentPath, entries)
    } else if (node.kind === 'group') {
      // Groups can contain submenus
      for (const child of node.nodes) {
        if (child.kind === 'submenu') {
          collectDeepSearchLoadersFromNode(child, parentPath, entries)
        }
      }
    }
  }

  return entries
}

/**
 * Helper to collect deep search loaders from a submenu node.
 */
function collectDeepSearchLoadersFromNode<T = unknown>(
  submenu: SubmenuDef<any, any>,
  parentPath: string[],
  entries: DeepSearchLoaderEntry<T>[],
): void {
  // Generate ID from label if not provided
  const id = submenu.id ?? (submenu.label ? textToId(submenu.label) : undefined)
  if (!id) {
    throw new Error(
      'Submenu must have either an "id" or "label" property to generate an ID',
    )
  }

  const currentPath = [...parentPath, id]

  // deepSearch defaults to true, so only exclude if explicitly set to false
  const isDeepSearchEnabled = submenu.deepSearch !== false

  // If deepSearch is disabled, stop here - don't include this submenu or its descendants
  if (!isDeepSearchEnabled) {
    return
  }

  // If this submenu has a loader, add it to deep search with its search config
  if (submenu.loader) {
    entries.push({
      path: currentPath,
      loader: submenu.loader,
      searchConfig: submenu.search,
    })
  }

  // Recursively search this submenu's children for more deep search loaders
  const nodes = submenu.nodes || []
  for (const node of nodes) {
    if (node.kind === 'submenu') {
      collectDeepSearchLoadersFromNode(node, currentPath, entries)
    } else if (node.kind === 'group') {
      for (const child of node.nodes) {
        if (child.kind === 'submenu') {
          collectDeepSearchLoadersFromNode(child, currentPath, entries)
        }
      }
    }
  }
}

/**
 * Aggregates multiple loader results into a single state.
 * Returns combined loading state where:
 * - isLoading = true if ANY loader is loading
 * - isError = true if ANY loader has an error (but we fail silently)
 * - isFetching = true if ANY loader is fetching
 * - completedPaths = set of paths for loaders that have completed
 * - inProgressPaths = set of paths for loaders that are still loading
 */
export function aggregateLoaderResults(
  results: Map<string, AsyncNodeLoaderResult>,
  menuDef: MenuDef<any>,
): AggregatedLoaderState {
  let isLoading = false
  let isError = false
  let isFetching = false
  const progress: import('../types.js').LoaderProgress[] = []
  const completedPaths = new Set<string>()
  const inProgressPaths = new Set<string>()

  for (const [pathKey, result] of results.entries()) {
    if (result.isLoading) {
      isLoading = true
      inProgressPaths.add(pathKey)
    } else if (result.data !== undefined) {
      // Loader has completed (has data and not loading)
      completedPaths.add(pathKey)
    }

    if (result.isError) isError = true
    if (result.isFetching) isFetching = true

    // Build progress entry for this loader
    const path = pathKey.split('.')
    const breadcrumbs = buildBreadcrumbs(path, menuDef)

    progress.push({
      path,
      breadcrumbs,
      isLoading: result.isLoading ?? false,
      isFetching: result.isFetching ?? false,
      error: result.error,
    })
  }

  return {
    isLoading,
    isError,
    isFetching,
    results,
    progress,
    completedPaths,
    inProgressPaths,
  }
}

/**
 * Builds human-readable breadcrumb labels by walking the menu tree.
 */
function buildBreadcrumbs(path: string[], menuDef: MenuDef<any>): string[] {
  const breadcrumbs: string[] = []
  let nodes = menuDef.nodes ?? []

  for (const id of path) {
    const node = nodes.find((n) => {
      const nodeId =
        n.id ??
        (n.kind === 'submenu' && n.label ? textToId(n.label) : undefined)
      return nodeId === id
    })
    if (!node) break

    if (node.kind === 'submenu') {
      const submenu = node as SubmenuDef<any, any>
      const submenuId =
        submenu.id ?? (submenu.label ? textToId(submenu.label) : '')
      breadcrumbs.push(submenu.label || submenu.title || submenuId)
      nodes = submenu.nodes ?? []
    } else if (node.kind === 'group') {
      // For groups, continue searching in group's children
      const group = node as GroupDef<any>
      nodes = group.nodes as any
    }
  }

  return breadcrumbs
}

/**
 * Checks if streaming mode should be enabled for the given menu definition.
 * Streaming is enabled when:
 * 1. Streaming is configured (boolean true or StreamingConfig with enabled: true)
 * 2. At least one loader in the menu tree uses 'server' or 'hybrid' search mode
 */
export function shouldEnableStreaming<T = unknown>(
  menuDef: MenuDef<T>,
): boolean {
  // Check if streaming is configured
  const searchConfig = menuDef.search
  if (!searchConfig?.streaming) {
    return false
  }

  const streamingEnabled =
    typeof searchConfig.streaming === 'boolean'
      ? searchConfig.streaming
      : searchConfig.streaming.enabled

  if (!streamingEnabled) {
    return false
  }

  // Check if at least one loader uses 'server' or 'hybrid' mode
  const hasServerLoader = checkForServerLoader(menuDef)
  return hasServerLoader
}

/**
 * Recursively checks if any loader in the menu tree uses 'server' or 'hybrid' mode.
 */
function checkForServerLoader<T = unknown>(menuDef: MenuDef<T>): boolean {
  // Check root menu's own loader (if in server/hybrid mode)
  if (menuDef.loader && menuDef.search?.mode !== 'client') {
    return true
  }

  // Check submenus
  const nodes = menuDef.nodes || []
  for (const node of nodes) {
    if (node.kind === 'submenu') {
      const submenu = node as SubmenuDef<any, any>
      // Only check if deepSearch is not explicitly disabled
      if (submenu.deepSearch !== false) {
        if (submenu.loader && submenu.search?.mode !== 'client') {
          return true
        }
        // Recursively check children
        if (checkForServerLoaderInNodes(submenu.nodes || [])) {
          return true
        }
      }
    } else if (node.kind === 'group') {
      const group = node as GroupDef<any>
      if (checkForServerLoaderInNodes(group.nodes as any)) {
        return true
      }
    }
  }

  return false
}

/**
 * Helper to check for server loaders in a list of nodes.
 */
function checkForServerLoaderInNodes(nodes: NodeDef<any>[]): boolean {
  for (const node of nodes) {
    if (node.kind === 'submenu') {
      const submenu = node as SubmenuDef<any, any>
      if (submenu.deepSearch !== false) {
        if (submenu.loader && submenu.search?.mode !== 'client') {
          return true
        }
        if (checkForServerLoaderInNodes(submenu.nodes || [])) {
          return true
        }
      }
    } else if (node.kind === 'group') {
      const group = node as GroupDef<any>
      if (checkForServerLoaderInNodes(group.nodes as any)) {
        return true
      }
    }
  }
  return false
}

/**
 * Injects deep search loader results back into a menu definition.
 * Creates a new menu definition with loader results replaced by static data.
 */
export function injectLoaderResults<T = unknown>(
  menuDef: MenuDef<T>,
  deepSearchResults: Map<string, AsyncNodeLoaderResult>,
  parentPath: string[] = [],
): MenuDef<T> {
  // Clone the menu def
  const newMenuDef: MenuDef<T> = { ...menuDef }

  // Process nodes
  if (menuDef.nodes) {
    newMenuDef.nodes = menuDef.nodes.map((node: NodeDef<any>) =>
      injectLoaderResultsIntoNode(node, deepSearchResults, parentPath),
    ) as NodeDef<T>[]
  }

  return newMenuDef
}

/**
 * Injects only completed loader results for streaming mode.
 * Only replaces loaders that have finished loading (have data).
 * In-progress loaders are left as-is.
 */
export function injectCompletedLoaderResults<T = unknown>(
  menuDef: MenuDef<T>,
  completedResults: Map<string, AsyncNodeLoaderResult>,
  parentPath: string[] = [],
): MenuDef<T> {
  // Clone the menu def
  const newMenuDef: MenuDef<T> = { ...menuDef }

  // Process nodes
  if (menuDef.nodes) {
    newMenuDef.nodes = menuDef.nodes.map((node: NodeDef<any>) =>
      injectCompletedLoaderResultsIntoNode(node, completedResults, parentPath),
    ) as NodeDef<T>[]
  }

  return newMenuDef
}

/**
 * Inject only completed results into a single node (streaming mode).
 */
function injectCompletedLoaderResultsIntoNode<T = unknown>(
  node: NodeDef<T>,
  completedResults: Map<string, AsyncNodeLoaderResult>,
  parentPath: string[],
): NodeDef<any> {
  if (node.kind === 'submenu') {
    return injectCompletedLoaderResultsIntoSubmenu(
      node,
      completedResults,
      parentPath,
    )
  }

  if (node.kind === 'group') {
    return injectCompletedLoaderResultsIntoGroup(
      node,
      completedResults,
      parentPath,
    )
  }

  // Items don't need processing
  return node
}

/**
 * Inject completed results into a submenu node (streaming mode).
 */
function injectCompletedLoaderResultsIntoSubmenu(
  submenu: SubmenuDef<any, any>,
  completedResults: Map<string, AsyncNodeLoaderResult>,
  parentPath: string[],
): SubmenuDef<any, any> {
  // Generate ID from label if not provided
  const id = submenu.id ?? (submenu.label ? textToId(submenu.label) : undefined)
  if (!id) {
    throw new Error(
      'Submenu must have either an "id" or "label" property to generate an ID',
    )
  }

  const currentPath = [...parentPath, id]
  const pathKey = currentPath.join('.')

  // deepSearch defaults to true, so only exclude if explicitly set to false
  const isDeepSearchEnabled = submenu.deepSearch !== false

  // Check if we have a COMPLETED result for this submenu
  const result = completedResults.get(pathKey)

  // Only inject if the result has data (is completed)
  if (result && result.data !== undefined && isDeepSearchEnabled) {
    // Store both the original loader and the injected result
    const newSubmenu: SubmenuDef<any, any> = {
      ...submenu,
      loader: result as any,
      // Store the original loader in a special property
      __originalLoader: submenu.loader,
    } as any

    // Process children if they exist
    if (submenu.nodes) {
      newSubmenu.nodes = submenu.nodes.map((child: NodeDef<any>) =>
        injectCompletedLoaderResultsIntoNode(
          child,
          completedResults,
          currentPath,
        ),
      ) as any
    }

    return newSubmenu
  }

  // No completed result for this submenu, but still process its children if deepSearch is enabled
  if (submenu.nodes && isDeepSearchEnabled) {
    const newSubmenu: SubmenuDef<any, any> = {
      ...submenu,
      nodes: submenu.nodes.map((child: NodeDef<any>) =>
        injectCompletedLoaderResultsIntoNode(
          child,
          completedResults,
          currentPath,
        ),
      ) as any,
    }
    return newSubmenu
  }

  return submenu
}

/**
 * Inject completed results into a group node (streaming mode).
 */
function injectCompletedLoaderResultsIntoGroup<T = unknown>(
  group: GroupDef<T>,
  completedResults: Map<string, AsyncNodeLoaderResult>,
  parentPath: string[],
): GroupDef<any> {
  return {
    ...group,
    nodes: group.nodes.map((child: NodeDef<any>) =>
      injectCompletedLoaderResultsIntoNode(child, completedResults, parentPath),
    ) as any,
  }
}

/**
 * Inject loader results into a single node.
 */
function injectLoaderResultsIntoNode<T = unknown>(
  node: NodeDef<T>,
  deepSearchResults: Map<string, AsyncNodeLoaderResult>,
  parentPath: string[],
): NodeDef<any> {
  if (node.kind === 'submenu') {
    return injectLoaderResultsIntoSubmenu(node, deepSearchResults, parentPath)
  }

  if (node.kind === 'group') {
    return injectLoaderResultsIntoGroup(node, deepSearchResults, parentPath)
  }

  // Items don't need processing
  return node
}

/**
 * Inject loader results into a submenu node.
 */
function injectLoaderResultsIntoSubmenu(
  submenu: SubmenuDef<any, any>,
  deepSearchResults: Map<string, AsyncNodeLoaderResult>,
  parentPath: string[],
): SubmenuDef<any, any> {
  // Generate ID from label if not provided
  const id = submenu.id ?? (submenu.label ? textToId(submenu.label) : undefined)
  if (!id) {
    throw new Error(
      'Submenu must have either an "id" or "label" property to generate an ID',
    )
  }

  const currentPath = [...parentPath, id]
  const pathKey = currentPath.join('.')

  // deepSearch defaults to true, so only exclude if explicitly set to false
  const isDeepSearchEnabled = submenu.deepSearch !== false

  // Check if we have a result for this submenu
  const result = deepSearchResults.get(pathKey)

  if (result && isDeepSearchEnabled) {
    // Store both the original loader and the injected result
    // The Surface component will use the original loader for submenus
    const newSubmenu: SubmenuDef<any, any> = {
      ...submenu,
      loader: result as any,
      // Store the original loader in a special property
      __originalLoader: submenu.loader,
    } as any

    // Process children if they exist
    if (submenu.nodes) {
      newSubmenu.nodes = submenu.nodes.map((child: NodeDef<any>) =>
        injectLoaderResultsIntoNode(child, deepSearchResults, currentPath),
      ) as any
    }

    return newSubmenu
  }

  // No result for this submenu, but still process its children if deepSearch is enabled
  if (submenu.nodes && isDeepSearchEnabled) {
    const newSubmenu: SubmenuDef<any, any> = {
      ...submenu,
      nodes: submenu.nodes.map((child: NodeDef<any>) =>
        injectLoaderResultsIntoNode(child, deepSearchResults, currentPath),
      ) as any,
    }
    return newSubmenu
  }

  return submenu
}

/**
 * Inject loader results into a group node.
 */
function injectLoaderResultsIntoGroup<T = unknown>(
  group: GroupDef<T>,
  deepSearchResults: Map<string, AsyncNodeLoaderResult>,
  parentPath: string[],
): GroupDef<any> {
  return {
    ...group,
    nodes: group.nodes.map((child: NodeDef<any>) =>
      injectLoaderResultsIntoNode(child, deepSearchResults, parentPath),
    ) as any,
  }
}
