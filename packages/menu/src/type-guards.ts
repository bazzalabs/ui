import type {
  BaseNode,
  BaseNodeDef,
  ButtonItemDef,
  ButtonItemNode,
  CheckboxItemDef,
  CheckboxItemNode,
  DefaultGroupDef,
  DefaultGroupNode,
  GroupDef,
  GroupedNode,
  GroupNode,
  // Node Definitions
  ItemDef,
  // Runtime Nodes
  ItemNode,
  LoadingDef,
  LoadingNode,
  // Menus
  Menu,
  Node,
  NodeDef,
  RadioGroupDef,
  RadioGroupNode,
  RadioItemDef,
  RadioItemNode,
  RootMenuNode,
  SeparatorDef,
  SeparatorNode,
  SubmenuDef,
  SubmenuNode,
} from './types.js'

/* ================================================================================================
 * Node Definition Type Guards
 * ============================================================================================== */

/**
 * Type guard to check if a node definition is an item definition.
 */
export function isItemDef<TData = unknown>(
  def: NodeDef<TData> | BaseNodeDef,
): def is ItemDef<TData> {
  return def.kind === 'item'
}

/**
 * Type guard to check if a node definition is a button item definition.
 */
export function isButtonItemDef<TData = unknown>(
  def: NodeDef<TData> | BaseNodeDef,
): def is ButtonItemDef<TData> {
  return (
    def.kind === 'item' &&
    ((def as ItemDef<TData>).variant ?? 'button') === 'button'
  )
}

/**
 * Type guard to check if a node definition is a checkbox item definition.
 */
export function isCheckboxItemDef<TData = unknown>(
  def: NodeDef<TData> | BaseNodeDef,
): def is CheckboxItemDef<TData> {
  return def.kind === 'item' && (def as ItemDef<TData>).variant === 'checkbox'
}

/**
 * Type guard to check if a node definition is a radio item definition.
 */
export function isRadioItemDef<TData = unknown>(
  def: NodeDef<TData> | BaseNodeDef,
): def is RadioItemDef<TData> {
  return def.kind === 'item' && (def as ItemDef<TData>).variant === 'radio'
}

/**
 * Type guard to check if a node definition is a group definition.
 */
export function isGroupDef<TData = unknown>(
  def: NodeDef<TData> | BaseNodeDef,
): def is GroupDef<TData> {
  return def.kind === 'group'
}

/**
 * Type guard to check if a node definition is a default group definition.
 */
export function isDefaultGroupDef<TData = unknown>(
  def: NodeDef<TData> | BaseNodeDef,
): def is DefaultGroupDef<TData> {
  return (
    def.kind === 'group' &&
    ((def as GroupDef<TData>).variant ?? 'default') === 'default'
  )
}

/**
 * Type guard to check if a node definition is a radio group definition.
 */
export function isRadioGroupDef<TData = unknown>(
  def: NodeDef<TData> | BaseNodeDef,
): def is RadioGroupDef<TData> {
  return def.kind === 'group' && (def as GroupDef<TData>).variant === 'radio'
}

/**
 * Type guard to check if a node definition is a submenu definition.
 */
export function isSubmenuDef<TData = unknown, TChild = unknown>(
  def: NodeDef<TData> | BaseNodeDef,
): def is SubmenuDef<TData, TChild> {
  return def.kind === 'submenu'
}

/**
 * Type guard to check if a node definition is a separator definition.
 */
export function isSeparatorDef(
  def: NodeDef<unknown> | BaseNodeDef,
): def is SeparatorDef {
  return def.kind === 'separator'
}

/**
 * Type guard to check if a node definition is a loading definition.
 */
export function isLoadingDef(
  def: NodeDef<unknown> | BaseNodeDef,
): def is LoadingDef {
  return def.kind === 'loading'
}

/* ================================================================================================
 * Runtime Node Type Guards
 * ============================================================================================== */

/**
 * Type guard to check if a runtime node is an item node.
 */
export function isItemNode<TData = unknown>(
  node: Node<TData> | BaseNode,
): node is ItemNode<TData> {
  return node.kind === 'item'
}

/**
 * Type guard to check if a runtime node is a button item node.
 */
export function isButtonItemNode<TData = unknown>(
  node: Node<TData> | BaseNode,
): node is ButtonItemNode<TData> {
  return node.kind === 'item' && (node as ItemNode<TData>).variant === 'button'
}

/**
 * Type guard to check if a runtime node is a checkbox item node.
 */
export function isCheckboxItemNode<TData = unknown>(
  node: Node<TData> | BaseNode,
): node is CheckboxItemNode<TData> {
  return (
    node.kind === 'item' && (node as ItemNode<TData>).variant === 'checkbox'
  )
}

/**
 * Type guard to check if a runtime node is a radio item node.
 */
export function isRadioItemNode<TData = unknown>(
  node: Node<TData> | BaseNode,
): node is RadioItemNode<TData> {
  return node.kind === 'item' && (node as ItemNode<TData>).variant === 'radio'
}

/**
 * Type guard to check if a runtime node is a group node.
 */
export function isGroupNode<TData = unknown>(
  node: Node<TData> | BaseNode,
): node is GroupNode<TData> {
  return node.kind === 'group'
}

/**
 * Type guard to check if a runtime node is a default group node.
 */
export function isDefaultGroupNode<TData = unknown>(
  node: Node<TData> | BaseNode,
): node is DefaultGroupNode<TData> {
  return (
    node.kind === 'group' && (node as GroupNode<TData>).variant === 'default'
  )
}

/**
 * Type guard to check if a runtime node is a radio group node.
 */
export function isRadioGroupNode<TData = unknown>(
  node: Node<TData> | BaseNode,
): node is RadioGroupNode<TData> {
  return node.kind === 'group' && (node as GroupNode<TData>).variant === 'radio'
}

/**
 * Type guard to check if a runtime node is a submenu node.
 */
export function isSubmenuNode<TData = unknown, TChild = unknown>(
  node: Node<TData> | BaseNode,
): node is SubmenuNode<TData, TChild> {
  return node.kind === 'submenu'
}

/**
 * Type guard to check if a runtime node is a separator node.
 */
export function isSeparatorNode(
  node: Node<unknown> | BaseNode,
): node is SeparatorNode {
  return node.kind === 'separator'
}

/**
 * Type guard to check if a runtime node is a loading node.
 */
export function isLoadingNode(
  node: Node<unknown> | BaseNode,
): node is LoadingNode {
  return node.kind === 'loading'
}

/* ================================================================================================
 * Menu Type Guards
 * ============================================================================================== */

/**
 * Type guard to check if a value is a menu (root menu or submenu).
 */
export function isMenu<TData = unknown>(value: unknown): value is Menu<TData> {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    (obj.kind === 'menu' || obj.kind === 'submenu') &&
    typeof obj.surfaceId === 'string' &&
    typeof obj.depth === 'number' &&
    Array.isArray(obj.nodes)
  )
}

/**
 * Type guard to check if a menu is a root menu node.
 */
export function isRootMenuNode<TData = unknown>(
  menu: Menu<TData>,
): menu is RootMenuNode<TData> {
  return menu.kind === 'menu'
}

/**
 * Type guard to check if a menu is a submenu node.
 */
export function isSubmenuMenuNode<TData = unknown, TChild = unknown>(
  menu: Menu<TData>,
): menu is SubmenuNode<TData, TChild> {
  return menu.kind === 'submenu'
}

/* ================================================================================================
 * Grouped Node Type Guards
 * ============================================================================================== */

/**
 * A node that belongs to a group, with required group metadata.
 * This represents an ItemNode or SubmenuNode that is a child of a GroupNode.
 */
export type GroupedNodeWithGroup<TData = unknown> = (
  | ItemNode<TData>
  | SubmenuNode<TData, any>
) &
  Required<Pick<GroupedNode<TData>, 'group'>> &
  Pick<GroupedNode<TData>, 'groupPosition' | 'groupIndex' | 'groupSize'>

/**
 * Type guard to check if a runtime node belongs to a group.
 * Returns true if the node has a `group` property set, indicating it is a child of a GroupNode.
 */
export function isGroupedNode<TData = unknown>(
  node: Node<TData> | BaseNode,
): node is GroupedNodeWithGroup<TData> {
  return (
    (node.kind === 'item' || node.kind === 'submenu') &&
    (node as GroupedNode<TData>).group !== undefined
  )
}
