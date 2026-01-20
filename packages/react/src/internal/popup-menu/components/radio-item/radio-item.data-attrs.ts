export enum PopupMenuRadioItemDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-radio-item' | 'bazzaui-context-menu-radio-item'}
   */
  slot = 'bazzaui-[component]-radio-item',
  /**
   * Present when the radio item is checked/selected.
   */
  checked = 'data-checked',
  /**
   * Present when the radio item is unchecked.
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
