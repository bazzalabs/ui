import type {
  GroupDef,
  GroupNode,
  ItemDef,
  ItemNode,
  Menu,
  MenuDef,
  MenuNodeDefaults,
  Node,
  NodeDef,
  SubmenuDef,
  SubmenuNode,
} from '../types.js'

/* ================================================================================================
 * Menu Instantiation Function
 * ============================================================================================== */

export function instantiateMenuFromDef<T>(
  def: MenuDef<T>,
  surfaceId: string,
  depth: number,
  query = '',
  open = false,
): Menu<T> {
  // Resolve function loaders with query context and open state
  const resolvedLoader =
    def.loader && typeof def.loader === 'function'
      ? def.loader({ query, open })
      : def.loader

  // Determine source of nodes: either static (sync) or from loader (async)
  const sourceNodes = resolvedLoader ? resolvedLoader.data : def.nodes
  const loadingState = resolvedLoader
    ? {
        isLoading: resolvedLoader.isLoading,
        isError: resolvedLoader.isError,
        error: resolvedLoader.error,
        isFetching: resolvedLoader.isFetching,
      }
    : undefined

  const parentless: Menu<T> = {
    id: def.id,
    title: def.title,
    inputPlaceholder: def.inputPlaceholder,
    hideSearchUntilActive: def.hideSearchUntilActive,
    defaults: def.defaults,
    ui: def.ui,
    nodes: [] as Node<T>[],
    surfaceId,
    depth,
    input: def.input,
    open: def.open,
    loader: def.loader,
    loadingState,
  }

  function inst<U>(d: NodeDef<U>, parent: Menu<any>): Node<U> {
    if (d.kind === 'item') {
      const itemDef = d as ItemDef<U>
      const variant = itemDef.variant ?? 'button'

      const node: ItemNode<U> = {
        ...itemDef,
        variant,
        kind: 'item',
        parent,
        def: itemDef,
        ...(variant === 'radio'
          ? {
              value:
                itemDef.variant === 'radio' ? (itemDef.value ?? d.id) : d.id,
            }
          : {}),
      } as ItemNode<U>

      return node
    }

    if (d.kind === 'group') {
      const groupDef = d as GroupDef<U>
      const children = (d.nodes ?? []).map((c) =>
        inst<any>(c as NodeDef<any>, parent),
      )

      const variant = groupDef.variant ?? 'default'

      const node: GroupNode<U> = {
        id: d.id,
        kind: 'group',
        hidden: d.hidden,
        parent,
        def: groupDef,
        heading: groupDef.heading,
        nodes: children as (ItemNode<U> | SubmenuNode<any>)[],
        variant,
        ...(variant === 'radio'
          ? {
              value: groupDef.variant === 'radio' ? groupDef.value : '',
              onValueChange:
                groupDef.variant === 'radio'
                  ? groupDef.onValueChange
                  : () => {},
            }
          : {}),
      } as GroupNode<U>

      // For groups, set group reference on all child nodes
      for (const child of node.nodes) {
        child.group = node
      }

      return node
    }

    // submenu
    const subDef = d as SubmenuDef<any, any>
    const childSurfaceId = `${parent.surfaceId}::${subDef.id}`

    // Determine submenu open state (from state descriptor or default to false)
    const subOpen = subDef.open?.value ?? false

    // ! In TSX, don't write instantiateMenuFromDef<any>(...)
    // Use casts instead of a generic call to avoid `<any>` being parsed as JSX:
    const child = instantiateMenuFromDef(
      {
        id: subDef.id,
        title: subDef.title,
        inputPlaceholder: subDef.inputPlaceholder,
        hideSearchUntilActive: subDef.hideSearchUntilActive,
        nodes: subDef.nodes as NodeDef<any>[],
        loader: subDef.loader,
        defaults: subDef.defaults as MenuNodeDefaults<any> | undefined,
        ui: subDef.ui as MenuDef<any>['ui'],
        input: subDef.input,
        open: subDef.open,
      } as MenuDef<any>,
      childSurfaceId,
      parent.depth + 1,
      query,
      subOpen,
    ) as Menu<any>

    const node: SubmenuNode<any, any> = {
      ...(subDef as SubmenuDef<any, any>),
      kind: 'submenu',
      parent,
      def: d,
      child,
      nodes: child.nodes,
    }

    return node as Node<U>
  }

  parentless.nodes = (sourceNodes ?? []).map((n) =>
    inst(n as any, parentless),
  ) as any

  return parentless
}

// Overload signatures for flatten function
export function flatten<T>(
  input: Menu<T> | Node<T> | Node<T>[],
  options?: { deep?: boolean },
): Node<T>[]
export function flatten<T>(
  input: MenuDef<T> | NodeDef<T> | NodeDef<T>[],
  options?: { deep?: boolean },
): NodeDef<T>[]

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
export function flatten<T>(
  input: Menu<T> | Node<T> | Node<T>[] | MenuDef<T> | NodeDef<T> | NodeDef<T>[],
  options?: { deep?: boolean },
): Node<T>[] | NodeDef<T>[] {
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
  return flattenDef(input as MenuDef<T> | NodeDef<T>, deep)
}

function flattenRuntime<T>(input: Menu<T> | Node<T>, deep: boolean): Node<T>[] {
  const result: Node<T>[] = []

  // Check if input is a Node (has 'kind') or Menu
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
        // Deep: recursively flatten the child menu
        result.push(...flattenRuntime(submenuNode.child, deep))
      }
      // Shallow: don't add submenu children
      return result
    }
  }

  // Input is a Menu - process its nodes array
  const menu = input as Menu<T>
  const nodes = menu.nodes

  for (const node of nodes) {
    if (node.kind === 'item') {
      result.push(node)
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
        // Deep: recursively flatten the child menu
        result.push(...flattenRuntime(submenuNode.child, deep))
      }
      // Shallow: don't add submenu children
    }
  }

  return result
}

function flattenDef<T>(
  input: MenuDef<T> | NodeDef<T>,
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

  // Input is a MenuDef - process its nodes array
  const menuDef = input as MenuDef<T>
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
