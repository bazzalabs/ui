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
  /** Present when this row is the first visible list-level row (not inside a group). */
  first = 'data-first',
  /** Present when this row is the last visible list-level row (not inside a group). */
  last = 'data-last',
  /** Present when this row is the first visible row within its group. */
  firstInGroup = 'data-first-in-group',
  /** Present when this row is the last visible row within its group. */
  lastInGroup = 'data-last-in-group',
}
