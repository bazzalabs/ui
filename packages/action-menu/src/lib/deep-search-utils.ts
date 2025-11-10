import type {
  AggregatedLoaderState,
  AsyncNodeLoaderResult,
  EagerLoaderEntry,
  GroupDef,
  MenuDef,
  NodeDef,
  SubmenuDef,
} from '../types.js'

/**
 * Recursively collects all deep search loaders from a menu definition tree.
 * Returns an array of loader entries with their paths.
 */
export function collectDeepSearchLoaders(
  menuDef: MenuDef<any>,
  parentPath: string[] = [],
): EagerLoaderEntry[] {
  const entries: EagerLoaderEntry[] = []

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
function collectDeepSearchLoadersFromNode(
  submenu: SubmenuDef<any, any>,
  parentPath: string[],
  entries: EagerLoaderEntry[],
): void {
  const currentPath = [...parentPath, submenu.id]

  // If this submenu has deepSearch flag and a function loader, add it
  if (submenu.deepSearch && submenu.loader) {
    const loader = submenu.loader
    // Only add function loaders (not static loader results)
    if (typeof loader === 'function') {
      // Extract the factory from the loader (set by createLoader)
      const factory = (loader as any).__loaderFactory
      if (factory) {
        entries.push({
          path: currentPath,
          factory,
        })
      } else {
        console.warn(
          `Deep search loader at path ${currentPath.join('.')} does not have a factory. ` +
            'Make sure you are using createLoader() from @bazza-ui/action-menu/react-query',
        )
      }
    }
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
 */
export function aggregateLoaderResults(
  results: Map<string, AsyncNodeLoaderResult>,
  loaderEntries: EagerLoaderEntry[],
  menuDef: MenuDef<any>,
): AggregatedLoaderState {
  let isLoading = false
  let isError = false
  let isFetching = false
  const progress: import('../types.js').LoaderProgress[] = []

  for (const [pathKey, result] of results.entries()) {
    if (result.isLoading) isLoading = true
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
  }
}

/**
 * Builds human-readable breadcrumb labels by walking the menu tree.
 */
function buildBreadcrumbs(path: string[], menuDef: MenuDef<any>): string[] {
  const breadcrumbs: string[] = []
  let nodes = menuDef.nodes ?? []

  for (const id of path) {
    const node = nodes.find((n) => n.id === id)
    if (!node) break

    if (node.kind === 'submenu') {
      const submenu = node as SubmenuDef<any, any>
      breadcrumbs.push(submenu.label || submenu.title || submenu.id)
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
  const currentPath = [...parentPath, submenu.id]
  const pathKey = currentPath.join('.')

  // Check if we have a result for this submenu
  const result = deepSearchResults.get(pathKey)

  if (result && submenu.deepSearch) {
    // Preserve the original loader function so the submenu can reload
    // when opened independently. We attach the factory metadata to the static result.
    const originalLoader = submenu.loader

    // Create a static result object that includes the factory metadata
    const staticResultWithFactory = {
      ...result,
      // Preserve the factory from the original loader so the submenu can reload
      __loaderFactory:
        typeof originalLoader === 'function'
          ? (originalLoader as any).__loaderFactory
          : undefined,
    }

    const newSubmenu: SubmenuDef<any, any> = {
      ...submenu,
      // Use static result but preserve factory for future loads
      loader: staticResultWithFactory as any,
    }

    // Process children if they exist
    if (submenu.nodes) {
      newSubmenu.nodes = submenu.nodes.map((child: NodeDef<any>) =>
        injectLoaderResultsIntoNode(child, deepSearchResults, currentPath),
      ) as any
    }

    return newSubmenu
  }

  // No result for this submenu, but still process its children
  if (submenu.nodes) {
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
