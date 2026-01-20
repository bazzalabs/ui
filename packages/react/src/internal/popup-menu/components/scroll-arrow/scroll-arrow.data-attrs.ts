export const PopupMenuScrollArrowDataAttributes = {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-scroll-up-arrow' | 'bazzaui-dropdown-menu-scroll-down-arrow' | 'bazzaui-context-menu-scroll-up-arrow' | 'bazzaui-context-menu-scroll-down-arrow' | 'bazzaui-select-scroll-up-arrow' | 'bazzaui-select-scroll-down-arrow' | 'bazzaui-combobox-scroll-up-arrow' | 'bazzaui-combobox-scroll-down-arrow'}
   */
  slot: 'bazzaui-[component]-scroll-[up|down]-arrow',
  /** @type {'up' | 'down'} */
  direction: 'data-direction',
  /** @type {'top' | 'bottom' | 'left' | 'right'} */
  side: 'data-side',
} as const
