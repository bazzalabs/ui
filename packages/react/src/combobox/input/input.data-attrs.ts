/**
 * Data attributes for ComboboxInput component.
 */
export const ComboboxInputDataAttributes = {
  /**
   * Identifies the component part.
   * @type {'bazzaui-combobox-input'}
   */
  slot: 'bazzaui-combobox-input',
  /** Present when the combobox popup is open. */
  open: 'data-open',
  /** Present when the combobox popup is closed. */
  closed: 'data-closed',
  /** Present when the input is disabled. */
  disabled: 'data-disabled',
  /** Present when no value is selected (showing placeholder). */
  placeholder: 'data-placeholder',
} as const
