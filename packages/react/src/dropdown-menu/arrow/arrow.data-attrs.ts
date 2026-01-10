export enum DropdownMenuArrowDataAttributes {
  /**
   * Present when the dropdown menu is open.
   */
  open = 'data-open',
  /**
   * Present when the dropdown menu is closed.
   */
  closed = 'data-closed',
  /**
   * Indicates which side the popup is positioned relative to the trigger.
   * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
  /**
   * Indicates how the popup is aligned relative to specified side.
   * @type {'start' | 'center' | 'end'}
   */
  align = 'data-align',
  /**
   * Present when the arrow is not centered due to collision avoidance.
   */
  uncentered = 'data-uncentered',
}
