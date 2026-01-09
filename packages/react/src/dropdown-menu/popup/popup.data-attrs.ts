export enum DropdownMenuPopupDataAttributes {
  /**
   * Present when the dropdown menu popup is open.
   */
  open = 'data-open',
  /**
   * Present when the dropdown menu popup is closed.
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
}
