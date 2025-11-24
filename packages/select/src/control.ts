/**
 * Control API for programmatic access to Select components.
 * Provides methods to read state and control behavior imperatively.
 */

export interface SelectControlState {
  /** Whether the select is disabled */
  disabled: boolean
  /** Current selected value (single select) */
  value?: string
  /** Current selected values (multi select) */
  values?: string[]
}

export interface SelectControl<TData = unknown> {
  /**
   * Get current state of the select.
   */
  getState(): SelectControlState

  /**
   * Disable the select. Returns a function to re-enable.
   */
  disable(): () => void

  /**
   * Enable the select.
   */
  enable(): void

  /**
   * Set disabled state.
   */
  setDisabled(disabled: boolean): void

  /**
   * Programmatically set the selected value (single select only).
   */
  setValue?(value: string): void

  /**
   * Programmatically set the selected values (multi select only).
   */
  setValues?(values: string[]): void

  /**
   * Programmatically open the select.
   */
  open(): void

  /**
   * Programmatically close the select.
   */
  close(): void

  /**
   * Programmatically toggle open/closed state.
   */
  toggle(): void
}

export interface MultiSelectControl<TData = unknown> extends SelectControl<TData> {
  /**
   * Select all available options (multi select only).
   */
  selectAll(): void

  /**
   * Clear all selections (multi select only).
   */
  clearAll(): void
}
