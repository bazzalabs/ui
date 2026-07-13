export enum PopupMenuRadioGroupDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-radio-group' | 'bazzaui-context-menu-radio-group'}
   */
  slot = 'bazzaui-[component]-radio-group',
  /**
   * Present when the radio group is disabled.
   */
  disabled = 'data-disabled',
  /**
   * Present when this is the first visible group in the list.
   */
  firstGroup = 'data-first-group',
  /**
   * Present when this is the last visible group in the list.
   */
  lastGroup = 'data-last-group',
  /** Present when this is the first visible list-level row. */
  first = 'data-first',
  /** Present when this is the last visible list-level row. */
  last = 'data-last',
}
