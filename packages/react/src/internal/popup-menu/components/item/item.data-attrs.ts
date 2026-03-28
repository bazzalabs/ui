export enum PopupMenuItemDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-item' | 'bazzaui-context-menu-item' | 'bazzaui-select-item' | 'bazzaui-combobox-item'}
   */
  slot = 'bazzaui-[component]-item',
  /**
   * Present when the item is highlighted (via keyboard or pointer).
   */
  highlighted = 'data-highlighted',
  /**
   * Present when the item is disabled.
   */
  disabled = 'data-disabled',
}
