import type {
  AsyncNodeLoaderResult,
  GroupDef,
  GroupNode,
  ItemDef,
  ItemNode,
  LoadingDef,
  LoadingNode,
  Menu,
  MenuNodeDefaults,
  Node,
  NodeDef,
  RootMenuDef,
  RootMenuNode,
  SeparatorDef,
  SeparatorNode,
  SubmenuDef,
  SubmenuNode,
} from '../types.js'
import { mergeDefaults } from '../utils/defaults.js'

/* ================================================================================================
 * Utility Functions
 * ============================================================================================== */

/**
 * Converts a label string into a valid ID.
 * - Converts to lowercase
 * - Removes non-alphanumeric characters (except spaces and hyphens)
 * - Replaces spaces with hyphens
 * - Trims leading/trailing hyphens
 *
 * @param label - The label string to convert
 * @returns A valid ID string
 *
 * @example
 * labelToId('Hello World') // 'hello-world'
 * labelToId('My Item #1') // 'my-item-1'
 * labelToId('  Spaced  ') // 'spaced'
 */
export function textToId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric (keep spaces and hyphens)
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
}

/**
 * Normalizes a MenuDef by injecting inferred IDs into all nodes.
 * This ensures that DEFs have the same IDs as their corresponding NODEs,
 * preventing mismatches when searching for nodes by ID.
 *
 * @param menuDef - The menu definition to normalize
 * @returns A new MenuDef with all inferred IDs injected
 */
export function normalizeMenuDef<T>(menuDef: RootMenuDef<T>): RootMenuDef<T> {
  return {
    ...menuDef,
    nodes: menuDef.nodes?.map((node) => normalizeNodeDef(node)) as NodeDef<T>[],
  }
}

/**
 * Normalizes a NodeDef by injecting inferred IDs.
 * Recursively processes child nodes and submenus.
 */
function normalizeNodeDef<T>(nodeDef: NodeDef<T>): NodeDef<T> {
  if (nodeDef.kind === 'item') {
    // Inject inferred ID if not present
    const id =
      nodeDef.id ?? (nodeDef.label ? textToId(nodeDef.label) : undefined)
    if (!id) {
      throw new Error(
        'Item must have either an "id" or "label" property to generate an ID',
      )
    }
    return { ...nodeDef, id }
  }

  if (nodeDef.kind === 'group') {
    // Recursively normalize child nodes
    const nodes = nodeDef.nodes?.map((child) => normalizeNodeDef(child))
    return { ...nodeDef, nodes } as NodeDef<T>
  }

  if (nodeDef.kind === 'submenu') {
    const subDef = nodeDef as SubmenuDef<any, any>

    // Inject inferred ID if not present
    const id =
      subDef.id ??
      (subDef.label
        ? textToId(subDef.label)
        : subDef.title
          ? textToId(subDef.title)
          : undefined)

    if (!id) {
      throw new Error(
        'Submenu must have either an "id", "label", or "title" property to generate an ID',
      )
    }

    // Recursively normalize child nodes if they exist
    const nodes = subDef.nodes?.map((child) =>
      normalizeNodeDef(child as NodeDef<any>),
    )

    return { ...subDef, id, nodes } as NodeDef<T>
  }

  if (nodeDef.kind === 'separator') {
    // Separators can optionally have IDs
    const id =
      nodeDef.id ?? (nodeDef.label ? textToId(nodeDef.label) : undefined)
    return id ? { ...nodeDef, id } : nodeDef
  }

  if (nodeDef.kind === 'loading') {
    return nodeDef
  }

  return nodeDef
}

/* ================================================================================================
 * Menu Instantiation Functions
 * ============================================================================================== */

/**
 * Instantiates a single node definition into a runtime node.
 * Used internally by instantiateMenuFromDef and exposed for middleware use.
 *
 * @param def - The node definition to instantiate
 * @param parent - The parent menu this node belongs to
 * @param computedDefaults - Pre-computed defaults from the defaults cascade (factory → instance → surface)
 * @returns The instantiated runtime node with defaults baked in
 */
export function instantiateSingleNode<T>(
  def: NodeDef<T>,
  parent: Menu<T>,
  computedDefaults?: MenuNodeDefaults<T>,
): Node<T> {
  if (def.kind === 'item') {
    const itemDef = def as ItemDef<T>
    const variant = itemDef.variant ?? 'button'

    // Generate ID from label if not provided
    const id = def.id ?? (def.label ? textToId(def.label) : undefined)
    if (!id) {
      throw new Error(
        'Item must have either an "id" or "label" property to generate an ID',
      )
    }

    // Augment with computed defaults - node's explicit values take precedence
    const onSelect = itemDef.onSelect ?? computedDefaults?.item?.onSelect
    const closeOnSelect =
      itemDef.closeOnSelect ?? computedDefaults?.item?.closeOnSelect

    const node: ItemNode<T> = {
      ...itemDef,
      id,
      variant,
      kind: 'item',
      parent,
      def: itemDef,
      // Bake in defaults
      onSelect,
      closeOnSelect,
      ...(variant === 'radio'
        ? {
            value: itemDef.variant === 'radio' ? (itemDef.value ?? id) : id,
          }
        : {}),
    } as ItemNode<T>

    return node
  }

  if (def.kind === 'group') {
    const groupDef = def as GroupDef<T>
    const children = (def.nodes ?? []).map((c) =>
      instantiateSingleNode<any>(c as NodeDef<any>, parent, computedDefaults),
    )

    const variant = groupDef.variant ?? 'default'

    const node: GroupNode<T> = {
      id: def.id,
      kind: 'group',
      hidden: def.hidden,
      parent,
      def: groupDef,
      heading: groupDef.heading,
      nodes: children as (ItemNode<T> | SubmenuNode<any>)[],
      variant,
      ...(variant === 'radio'
        ? {
            value: groupDef.variant === 'radio' ? groupDef.value : '',
            onValueChange:
              groupDef.variant === 'radio' ? groupDef.onValueChange : () => {},
          }
        : {}),
    } as GroupNode<T>

    // For groups, set group reference on all child nodes
    for (const child of node.nodes) {
      child.group = node
    }

    return node
  }

  if (def.kind === 'separator') {
    const separatorDef = def as SeparatorDef

    // Generate ID from label if not provided
    const id =
      def.id ?? (separatorDef.label ? textToId(separatorDef.label) : undefined)
    if (!id) {
      throw new Error(
        'Separator must have either an "id" or "label" property to generate an ID',
      )
    }

    const node: SeparatorNode = {
      kind: 'separator',
      id,
      hidden: def.hidden,
      parent,
      def: separatorDef,
      label: separatorDef.label,
    }
    return node as Node<T>
  }

  if (def.kind === 'loading') {
    const loadingDef = def as LoadingDef
    const node: LoadingNode = {
      kind: 'loading',
      id: def.id,
      hidden: def.hidden,
      parent,
      def: loadingDef,
      progress: loadingDef.progress,
      inProgressPaths: loadingDef.inProgressPaths,
      completedPaths: loadingDef.completedPaths,
    }
    return node as Node<T>
  }

  if (def.kind === 'submenu') {
    // submenu
    const subDef = {
      ...def,
      deepSearch: def.deepSearch === undefined ? true : def.deepSearch,
    } as SubmenuDef<any, any>

    // Generate ID from label/title if not provided
    const id =
      def.id ??
      (subDef.label
        ? textToId(subDef.label)
        : subDef.title
          ? textToId(subDef.title)
          : undefined)

    if (!id) {
      throw new Error(
        'Submenu must have either an "id" or "label" property to generate an ID',
      )
    }

    const childSurfaceId = `${parent.surfaceId}::${id}`

    // Compute defaults for submenu (merge parent base defaults with submenu's own defaults)
    const submenuDefaults = mergeDefaults(parent.baseDefaults, subDef.defaults)

    // Merge virtualization defaults with submenu-specific virtualization
    const mergedVirtualization = submenuDefaults.virtualization
      ? { ...submenuDefaults.virtualization, ...subDef.virtualization }
      : subDef.virtualization

    // Resolve loader if it's already a result object (not a function)
    const resolvedLoader =
      subDef.loader && typeof subDef.loader !== 'function'
        ? (subDef.loader as AsyncNodeLoaderResult<any>)
        : undefined

    // Merge static nodes and loader data
    const staticNodes = subDef.nodes ?? []
    const loaderNodes = resolvedLoader?.data ?? []
    const sourceNodes = [...staticNodes, ...loaderNodes]

    const loadingState = resolvedLoader
      ? {
          isLoading: resolvedLoader.isLoading,
          isError: resolvedLoader.isError,
          error: resolvedLoader.error,
          isFetching: resolvedLoader.isFetching,
        }
      : undefined

    // Destructure to exclude properties that shouldn't be on the node
    const {
      nodes: _nodes,
      virtualization: _virtualization,
      ...subDefRest
    } = subDef as SubmenuDef<any, any>

    // Create submenu node shell (without children yet - we need the node to pass as parent to children)
    const node: SubmenuNode<any, any> = {
      ...subDefRest,
      id,
      kind: 'submenu',
      parent,
      def,
      surfaceId: childSurfaceId,
      depth: parent.depth + 1,
      nodes: [], // Temporary - will be filled below
      defaults: submenuDefaults,
      baseDefaults: parent.baseDefaults,
      virtualization: mergedVirtualization,
      loadingState,
    } as any

    // Now instantiate children with the submenu node as their parent
    node.nodes = (sourceNodes ?? []).map((childDef: any) =>
      instantiateSingleNode(childDef as any, node, submenuDefaults),
    ) as any

    return node as Node<T>
  }

  // Invalid node `kind` -- throw error
  throw new Error('Invalid definition')
}

export function instantiateMenuFromDef<T>(
  def: RootMenuDef<T> | SubmenuDef<T, any>,
  surfaceId: string,
  depth: number,
  parentDefaults?: MenuNodeDefaults<T>,
): Menu<T> {
  // Compute home defaults by merging parent defaults with this menu's defaults
  // This creates the three-level cascade: factory → instance → surface (home menu)
  const homeDefaults = mergeDefaults(parentDefaults, def.defaults)

  // Only resolve loader if it's NOT a function
  // Function loaders should already be resolved by Surface component
  const resolvedLoader =
    def.loader && typeof def.loader !== 'function'
      ? (def.loader as AsyncNodeLoaderResult<T>)
      : undefined

  // Merge both static nodes AND loader data (if both exist)
  const staticNodes = def.nodes ?? []
  const loaderNodes = resolvedLoader?.data ?? []
  const sourceNodes = [...staticNodes, ...loaderNodes]

  const loadingState = resolvedLoader
    ? {
        isLoading: resolvedLoader.isLoading,
        isError: resolvedLoader.isError,
        error: resolvedLoader.error,
        isFetching: resolvedLoader.isFetching,
      }
    : undefined

  // Merge virtualization defaults with menu-specific virtualization
  const mergedVirtualization = homeDefaults.virtualization
    ? { ...homeDefaults.virtualization, ...def.virtualization }
    : def.virtualization

  // Check if this is a root menu or submenu based on kind property or depth
  const isSubmenu = ('kind' in def && def.kind === 'submenu') || depth > 0

  // Create the appropriate menu type
  const menu: Menu<T> = isSubmenu
    ? // SubmenuNode (should rarely happen - submenus are usually created via instantiateSingleNode)
      ({
        kind: 'submenu',
        id: def.id!,
        label: (def as SubmenuDef<T, any>).label,
        title: def.title,
        icon: (def as SubmenuDef<T, any>).icon,
        inputPlaceholder: def.inputPlaceholder,
        hideSearchUntilActive: def.hideSearchUntilActive,
        defaults: homeDefaults,
        baseDefaults: parentDefaults,
        virtualization: mergedVirtualization,
        ui: def.ui,
        nodes: [] as Node<T>[],
        surfaceId,
        depth,
        input: def.input,
        open: def.open,
        loader: def.loader,
        loadingState,
        middleware: def.middleware,
        data: (def as SubmenuDef<T, any>).data,
        disabled: (def as SubmenuDef<T, any>).disabled,
        deepSearch: (def as SubmenuDef<T, any>).deepSearch,
        keywords: (def as SubmenuDef<T, any>).keywords,
        render: def.render,
        def: def as SubmenuDef<T, any>,
        parent: null as any, // Will be set by caller if needed
      } as any)
    : // RootMenuNode
      ({
        kind: 'menu',
        id: def.id!,
        title: def.title,
        inputPlaceholder: def.inputPlaceholder,
        hideSearchUntilActive: def.hideSearchUntilActive,
        defaults: homeDefaults,
        baseDefaults: parentDefaults,
        virtualization: mergedVirtualization,
        ui: def.ui,
        nodes: [] as Node<T>[],
        surfaceId,
        depth: 0,
        input: def.input,
        open: def.open,
        loader: def.loader,
        loadingState,
        middleware: def.middleware,
        search: def.search,
      } as RootMenuNode<T>)

  // Use the extracted instantiateSingleNode function, passing computed defaults
  menu.nodes = (sourceNodes ?? []).map((n: any) =>
    instantiateSingleNode(n as any, menu, homeDefaults),
  ) as any

  return menu
}

/**
 * Type helper to extract the node type from a menu/submenu/node definition or array.
 * Preserves the specific node type (e.g., ContextNodeDef, CommandNodeDef) instead of widening to base NodeDef.
 */
type ExtractNodeType<T> = T extends { nodes?: readonly (infer N)[] }
  ? N
  : T extends ReadonlyArray<infer N>
    ? N
    : T extends { kind: string }
      ? T
      : never

// Overload signatures for flatten function
// Overload for menu/submenu definitions - preserves specific node type
export function flatten<M extends { nodes?: readonly any[] }>(
  input: M,
  options?: { deep?: boolean },
): Array<ExtractNodeType<M>>

// Overload for single node definition - preserves specific node type
export function flatten<N extends { kind: string }>(
  input: N,
  options?: { deep?: boolean },
): N[]

// Overload for array of node definitions - preserves specific node type
export function flatten<N extends { kind: string }>(
  input: readonly N[],
  options?: { deep?: boolean },
): N[]

// Overload for runtime Menu objects
export function flatten<T>(
  input: Menu<T>,
  options?: { deep?: boolean },
): Node<T>[]

// Overload for runtime Node objects
export function flatten<T>(
  input: Node<T>,
  options?: { deep?: boolean },
): Node<T>[]

// Overload for runtime Node arrays
export function flatten<T>(
  input: Node<T>[],
  options?: { deep?: boolean },
): Node<T>[]

/**
 * Flattens a menu, node, array of nodes, or their definitions into an array of nodes/node definitions.
 *
 * @param input - A Menu, Node, Node[], MenuDef, NodeDef, or NodeDef[] to flatten
 * @param options - Configuration options
 * @param options.deep - If true, recursively flattens all descendants. If false (default), only flattens one level.
 *
 * @returns
 * - For Menu input: array of descendant nodes (excluding the Menu object itself)
 * - For Node input: array containing the node itself plus its descendants
 * - For Node[] input: array containing all nodes plus their descendants
 * - For MenuDef input: array of descendant node definitions (excluding the MenuDef wrapper)
 * - For NodeDef input: array containing the definition itself plus its descendants
 * - For NodeDef[] input: array containing all definitions plus their descendants
 *
 * @example
 * // Shallow flatten (default)
 * const shallowNodes = flatten(menu) // Returns first-level nodes, groups + their children, submenus without their children
 *
 * // Deep flatten
 * const allNodes = flatten(menu, { deep: true }) // Returns all descendant nodes recursively
 *
 * // Flatten a specific node
 * const nodeAndDescendants = flatten(groupNode, { deep: true })
 *
 * // Flatten an array of nodes
 * const flattened = flatten([node1, node2, node3], { deep: true })
 *
 * // Flatten definitions
 * const defNodes = flatten(menuDef, { deep: true })
 */
// Implementation signature (handles all cases)
export function flatten<T>(
  input:
    | Menu<T>
    | Node<T>
    | Menu<T>[]
    | Node<T>[]
    | RootMenuDef<T>
    | NodeDef<T>
    | NodeDef<T>[]
    | any,
  options?: { deep?: boolean },
): Node<T>[] | NodeDef<T>[] | any[] {
  const deep = options?.deep ?? false

  // Handle array inputs
  if (Array.isArray(input)) {
    if (input.length === 0) {
      return []
    }

    // Determine if array contains runtime nodes or definitions by checking first element
    const firstElement = input[0]
    if (!firstElement) {
      return []
    }

    const isRuntimeArray = 'parent' in firstElement

    const result: any[] = []
    for (const item of input) {
      if (isRuntimeArray) {
        result.push(...flattenRuntime(item as Node<T>, deep))
      } else {
        result.push(...flattenDef(item as NodeDef<T>, deep))
      }
    }
    return result
  }

  // Determine if input is runtime (Menu/Node) or definition (MenuDef/NodeDef)
  // Runtime objects have 'surfaceId' (Menu) or 'parent' (Node)
  const isRuntime = 'surfaceId' in input || 'parent' in input

  if (isRuntime) {
    return flattenRuntime(input as Menu<T> | Node<T>, deep)
  }
  return flattenDef(input as RootMenuDef<T> | NodeDef<T>, deep)
}

function flattenRuntime<T>(input: Menu<T> | Node<T>, deep: boolean): Node<T>[] {
  const result: Node<T>[] = []

  // Check if input is a Menu first (has 'surfaceId'), then check if it's a Node
  // This is critical because Menu objects for submenus also have 'kind' property
  if ('surfaceId' in input) {
    // Input is a Menu - process its nodes array
    const menu = input as Menu<T>
    const nodes = menu.nodes ?? []

    for (const node of nodes) {
      if (node.kind === 'item') {
        result.push(node as ItemNode<T>)
      } else if (node.kind === 'group') {
        const groupNode = node as GroupNode<T>
        result.push(groupNode)
        if (deep) {
          // Deep: recursively flatten each child
          for (const child of groupNode.nodes) {
            result.push(...flattenRuntime(child, deep))
          }
        } else {
          // Shallow: add direct children only
          result.push(...groupNode.nodes)
        }
      } else if (node.kind === 'submenu') {
        const submenuNode = node as SubmenuNode<any, any>
        result.push(submenuNode)
        if (deep) {
          // Deep: recursively flatten the submenu (which IS the menu)
          result.push(...flattenRuntime(submenuNode, deep))
        }
        // Shallow: don't add submenu children
      }
    }

    return result
  }

  // Input is a Node (has 'kind' but not 'surfaceId')
  if ('kind' in input) {
    const node = input as Node<T>

    // Always include the node itself
    result.push(node)

    if (node.kind === 'item') {
      // Items have no children
      return result
    }
    if (node.kind === 'group') {
      const groupNode = node as GroupNode<T>
      if (deep) {
        // Deep: recursively flatten each child
        for (const child of groupNode.nodes) {
          result.push(...flattenRuntime(child, deep))
        }
      } else {
        // Shallow: add direct children only
        result.push(...groupNode.nodes)
      }
      return result
    }
    if (node.kind === 'submenu') {
      const submenuNode = node as SubmenuNode<any, any>
      if (deep) {
        // Deep: recursively flatten the submenu (which IS the menu)
        result.push(...flattenRuntime(submenuNode, deep))
      }
      // Shallow: don't add submenu children
      return result
    }
  }

  return result
}

function flattenDef<T>(
  input: RootMenuDef<T> | NodeDef<T>,
  deep: boolean,
): NodeDef<T>[] {
  const result: NodeDef<T>[] = []

  // Check if input is a NodeDef (has 'kind') or MenuDef
  if ('kind' in input) {
    const nodeDef = input as NodeDef<T>

    // Always include the node definition itself
    result.push(nodeDef)

    if (nodeDef.kind === 'item') {
      // Items have no children
      return result
    }
    if (nodeDef.kind === 'group') {
      const groupDef = nodeDef as GroupDef<T>
      const children = groupDef.nodes ?? []
      if (deep) {
        // Deep: recursively flatten each child
        for (const child of children) {
          result.push(...flattenDef(child, deep))
        }
      } else {
        // Shallow: add direct children only
        result.push(...children)
      }
      return result
    }
    if (nodeDef.kind === 'submenu') {
      const submenuDef = nodeDef as SubmenuDef<any, any>
      const children = submenuDef.nodes ?? []
      if (deep) {
        // Deep: recursively flatten children
        for (const child of children) {
          result.push(...flattenDef(child, deep))
        }
      }
      // Shallow: don't add submenu children
      return result
    }
  }

  // Input is a RootMenuDef - process its nodes array
  const menuDef = input as RootMenuDef<T>
  const nodes = menuDef.nodes ?? []

  for (const nodeDef of nodes) {
    if (nodeDef.kind === 'item') {
      result.push(nodeDef)
    } else if (nodeDef.kind === 'group') {
      const groupDef = nodeDef as GroupDef<T>
      result.push(groupDef)
      const children = groupDef.nodes ?? []
      if (deep) {
        // Deep: recursively flatten each child
        for (const child of children) {
          result.push(...flattenDef(child, deep))
        }
      } else {
        // Shallow: add direct children only
        result.push(...children)
      }
    } else if (nodeDef.kind === 'submenu') {
      const submenuDef = nodeDef as SubmenuDef<any, any>
      result.push(submenuDef)
      const children = submenuDef.nodes ?? []
      if (deep) {
        // Deep: recursively flatten children
        for (const child of children) {
          result.push(...flattenDef(child, deep))
        }
      }
      // Shallow: don't add submenu children
    }
  }

  return result
}
