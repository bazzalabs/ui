export enum ContextMenuCheckboxItemDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-context-menu-checkbox-item'}
   */
  slot = 'bazzaui-context-menu-checkbox-item',
  /**
   * Present when the checkbox item is checked.
   */
  checked = 'data-checked',
  /**
   * Present when the checkbox item is unchecked.
   */
  unchecked = 'data-unchecked',
  /**
   * Present while a range or drag selection previews a checked state for this
   * item that differs from its committed state.
   */
  pending = 'data-pending',
  /**
   * Present when the item is highlighted (via keyboard or pointer).
   */
  highlighted = 'data-highlighted',
  /**
   * Present when the item is disabled.
   */
  disabled = 'data-disabled',
}

export enum ContextMenuCheckboxItemIndicatorDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-context-menu-checkbox-item-indicator'}
   */
  slot = 'bazzaui-context-menu-checkbox-item-indicator',
  /**
   * Present when the checkbox item is checked.
   */
  checked = 'data-checked',
  /**
   * Present when the checkbox item is unchecked.
   */
  unchecked = 'data-unchecked',
}
