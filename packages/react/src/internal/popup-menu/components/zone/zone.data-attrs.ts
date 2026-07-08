export enum PopupMenuZoneDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-dropdown-menu-header' | 'bazzaui-dropdown-menu-footer' | 'bazzaui-context-menu-header' | 'bazzaui-context-menu-footer'}
   */
  slot = 'bazzaui-[component]-[placement]',
  /** Always present. Value is 'header' or 'footer'. */
  placement = 'data-placement',
  /** Present while this zone holds DOM focus. */
  active = 'data-active',
}
