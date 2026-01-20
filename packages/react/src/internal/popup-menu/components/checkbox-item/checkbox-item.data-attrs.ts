export enum PopupMenuCheckboxItemDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-checkbox-item' | 'bazzaui-context-menu-checkbox-item'}
   */
  slot = 'bazzaui-[component]-checkbox-item',
  /**
   * Present when the checkbox item is checked.
   */
  checked = 'data-checked',
  /**
   * Present when the checkbox item is unchecked.
   */
  unchecked = 'data-unchecked',
  /**
   * Present when the item is highlighted (via keyboard or pointer).
   */
  highlighted = 'data-highlighted',
  /**
   * Present when the item is disabled.
   */
  disabled = 'data-disabled',
}
