export enum PopupMenuPopupDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-popup' | 'bazzaui-context-menu-popup' | 'bazzaui-select-popup' | 'bazzaui-combobox-popup'}
   */
  slot = 'bazzaui-[component]-popup',
  /**
   * Present when the popup menu is open.
   */
  open = 'data-open',
  /**
   * Present when the popup menu is closed.
   */
  closed = 'data-closed',
  /**
   * Indicates which side the popup is positioned relative to the trigger.
   * @type {'top' | 'bottom' | 'left' | 'right'}
   */
  side = 'data-side',
  /**
   * Indicates how the popup is aligned relative to specified side.
   * @type {'start' | 'center' | 'end'}
   */
  align = 'data-align',
  /**
   * Present when the popup is animating in.
   */
  startingStyle = 'data-starting-style',
  /**
   * Present when the popup is animating out.
   */
  endingStyle = 'data-ending-style',
  /**
   * Present if animations should be instant.
   * @type {'click' | 'dismiss'}
   */
  instant = 'data-instant',
  /**
   * Present when this popup's surface is the focus owner.
   * Useful for styling the currently focused menu in a submenu chain.
   */
  focused = 'data-focused',
  /**
   * Present when this popup has an open submenu below it in the menu tree.
   * Useful for styling all parent menus in an open submenu chain.
   */
  hasOpenSubmenu = 'data-has-open-submenu',
  /**
   * Present when this popup is a submenu (not the root menu).
   * Useful for applying different styles to submenus vs root menus.
   */
  submenu = 'data-submenu',
}
