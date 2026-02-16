export enum PopupMenuSubpageTriggerDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-subpage-trigger' | 'bazzaui-context-menu-subpage-trigger'}
   */
  slot = 'bazzaui-[component]-subpage-trigger',
  /**
   * Present on subpage trigger elements.
   */
  subpageTrigger = 'data-subpage-trigger',
  /**
   * Present when the target page is active.
   */
  popupOpen = 'data-popup-open',
  /**
   * Present when the target page owns keyboard focus.
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
}
