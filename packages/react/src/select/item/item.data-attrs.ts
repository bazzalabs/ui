export const SelectItemDataAttributes = {
  /**
   * Identifies the component part.
   * @type {'bazzaui-select-item'}
   */
  slot: 'bazzaui-select-item',
  /**
   * Present when the item is highlighted via keyboard or pointer.
   */
  highlighted: 'data-highlighted',
  /**
   * Present when the item is disabled.
   */
  disabled: 'data-disabled',
  /**
   * Present when the item is currently selected.
   */
  selected: 'data-selected',
  /** Present when this row is the first visible list-level row (not inside a group). */
  first: 'data-first',
  /** Present when this row is the last visible list-level row (not inside a group). */
  last: 'data-last',
  /** Present when this row is the first visible row within its group. */
  firstInGroup: 'data-first-in-group',
  /** Present when this row is the last visible row within its group. */
  lastInGroup: 'data-last-in-group',
} as const
