export enum PopupMenuListDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-list' | 'bazzaui-context-menu-list' | 'bazzaui-select-list' | 'bazzaui-combobox-list'}
   */
  slot = 'bazzaui-[component]-list',
  /**
   * Always present on the list element.
   * Used for styling and by useStickyRowWidth to find the list container.
   */
  list = 'data-popup-menu-list',
  /**
   * Present on the list while a focus zone (Header/Footer) holds DOM focus.
   * Use to dim the preserved item highlight while custom controls are focused.
   */
  zoneFocused = 'data-zone-focused',
}
