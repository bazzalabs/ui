export enum PopupMenuTreeItemDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-tree-item' | 'bazzaui-context-menu-tree-item'}
   */
  slot = 'bazzaui-[component]-tree-item',
  /** The depth of the tree item. */
  depth = 'data-depth',
  /** Identifies a tree item. */
  treeItem = 'data-tree-item',
  /** Present when the tree item is a non-selectable header. */
  header = 'data-header',
}
