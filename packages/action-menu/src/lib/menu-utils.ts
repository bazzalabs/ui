import type {
  GroupDef,
  GroupNode,
  ItemDef,
  ItemNode,
  Menu,
  MenuDef,
  Node,
  NodeDef,
  SubmenuDef,
  SubmenuNode,
} from '../types.js'

export function instantiateMenuFromDef<T>(
  def: MenuDef<T>,
  surfaceId: string,
  depth: number,
): Menu<T> {
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

    const child = instantiateMenuFromDef(
      {
        id: subDef.id,
        title: subDef.title,
        inputPlaceholder: subDef.inputPlaceholder,
        hideSearchUntilActive: subDef.hideSearchUntilActive,
        nodes: subDef.nodes as NodeDef<any>[],
        defaults: subDef.defaults,
        ui: subDef.ui,
        input: subDef.input,
      } as MenuDef<any>,
      childSurfaceId,
      parent.depth + 1,
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

  parentless.nodes = (def.nodes ?? []).map((n) =>
    inst(n as any, parentless),
  ) as any
  return parentless
}
