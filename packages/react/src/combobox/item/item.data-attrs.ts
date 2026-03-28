/**
 * Data attributes applied to Combobox.Item for styling.
 *
 * @example
 * ```css
 * [data-bazzaui-combobox-item][data-highlighted] {
 *   background: var(--highlight-bg);
 * }
 * [data-bazzaui-combobox-item][data-selected] {
 *   font-weight: bold;
 * }
 * [data-bazzaui-combobox-item][data-disabled] {
 *   opacity: 0.5;
 *   pointer-events: none;
 * }
 * ```
 */
export const ComboboxItemDataAttributes = {
  /**
   * Identifies the component part.
   * @type {'bazzaui-combobox-item'}
   */
  slot: 'bazzaui-combobox-item',
  /** Present when the item is highlighted (via keyboard or pointer). */
  highlighted: 'data-highlighted',
  /** Present when the item is disabled. */
  disabled: 'data-disabled',
  /** Present when the item is currently selected. */
  selected: 'data-selected',
} as const
