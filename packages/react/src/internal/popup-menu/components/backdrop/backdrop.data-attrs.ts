export enum PopupMenuBackdropDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-backdrop' | 'bazzaui-context-menu-backdrop' | 'bazzaui-select-backdrop' | 'bazzaui-combobox-backdrop'}
   */
  slot = 'bazzaui-[component]-backdrop',
  /**
   * Present when the popup menu is open.
   */
  open = 'data-open',
  /**
   * Present when the popup menu is closed.
   */
  closed = 'data-closed',
  /**
   * Present when the popup menu is animating in.
   */
  startingStyle = 'data-starting-style',
  /**
   * Present when the popup menu is animating out.
   */
  endingStyle = 'data-ending-style',
}
