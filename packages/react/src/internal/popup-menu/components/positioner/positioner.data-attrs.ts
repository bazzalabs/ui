export enum PopupMenuPositionerDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-positioner' | 'bazzaui-context-menu-positioner' | 'bazzaui-select-positioner' | 'bazzaui-combobox-positioner'}
   */
  slot = 'bazzaui-[component]-positioner',
  /**
   * Present when the popup menu is open.
   */
  open = 'data-open',
  /**
   * Present when the popup menu is closed.
   */
  closed = 'data-closed',
  /**
   * Present when the anchor is hidden.
   */
  anchorHidden = 'data-anchor-hidden',
  /**
   * Indicates which side the popup is positioned relative to the trigger.
   * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
  /**
   * Indicates how the popup is aligned relative to specified side.
   * @type {'start' | 'center' | 'end' | 'list-start'}
   */
  align = 'data-align',
}
