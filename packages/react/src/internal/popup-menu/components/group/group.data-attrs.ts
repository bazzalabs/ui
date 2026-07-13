export enum PopupMenuGroupDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-group' | 'bazzaui-context-menu-group' | 'bazzaui-select-group' | 'bazzaui-combobox-group'}
   */
  slot = 'bazzaui-[component]-group',
  /**
   * Present when this is the first visible group in the list.
   */
  firstGroup = 'data-first-group',
  /**
   * Present when this is the last visible group in the list.
   */
  lastGroup = 'data-last-group',
}
