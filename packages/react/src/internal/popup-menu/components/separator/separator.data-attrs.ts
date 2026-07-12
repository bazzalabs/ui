export enum PopupMenuSeparatorDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-separator' | 'bazzaui-context-menu-separator' | 'bazzaui-select-separator' | 'bazzaui-combobox-separator'}
   */
  slot = 'bazzaui-[component]-separator',
  /**
   * Present when this row is the first visible list-level row.
   */
  first = 'data-first',
  /**
   * Present when this row is the last visible list-level row.
   */
  last = 'data-last',
}
