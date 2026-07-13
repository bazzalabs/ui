export enum PopupMenuGroupLabelDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-group-label' | 'bazzaui-context-menu-group-label' | 'bazzaui-select-group-label' | 'bazzaui-combobox-group-label'}
   */
  slot = 'bazzaui-[component]-group-label',
  /**
   * Present when this label's parent group is the first visible group in the list.
   */
  firstGroup = 'data-first-group',
  /**
   * Present when this label's parent group is the last visible group in the list.
   */
  lastGroup = 'data-last-group',
}
