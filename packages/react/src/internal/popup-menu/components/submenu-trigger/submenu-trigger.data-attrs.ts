export enum PopupMenuSubmenuTriggerDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-submenu-trigger' | 'bazzaui-context-menu-submenu-trigger'}
   */
  slot = 'bazzaui-[component]-submenu-trigger',
  /**
   * Present on submenu trigger elements.
   */
  submenuTrigger = 'data-submenu-trigger',
  /**
   * Present when the submenu popup is open.
   */
  popupOpen = 'data-popup-open',
  /**
   * Present when the submenu owns keyboard focus.
   */
  popupFocused = 'data-popup-focused',
  /**
   * Present when the item is highlighted.
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
