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
  /** Present when this row is the first visible list-level row (not inside a group). */
  first = 'data-first',
  /** Present when this row is the last visible list-level row (not inside a group). */
  last = 'data-last',
  /** Present when this row is the first visible row within its group. */
  firstInGroup = 'data-first-in-group',
  /** Present when this row is the last visible row within its group. */
  lastInGroup = 'data-last-in-group',
}
