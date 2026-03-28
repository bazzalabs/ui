/**
 * Data attributes applied to Select.List for styling.
 * Container for select items with role="listbox".
 *
 * @example
 * ```css
 * [data-bazzaui-select-list] {
 *   max-height: 300px;
 *   overflow-y: auto;
 * }
 * ```
 */
export enum SelectListDataAttributes {
  /**
   * Identifies the component part.
   * @type {'bazzaui-select-list'}
   */
  slot = 'bazzaui-select-list',
  /**
   * Always present on the list element.
   * Used for styling and by useStickyRowWidth to find the list container.
   */
  list = 'data-popup-menu-list',
}
