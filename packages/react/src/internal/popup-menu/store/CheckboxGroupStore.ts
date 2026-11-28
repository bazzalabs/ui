import { Store } from '@base-ui/utils/store'
import {
  type ControlledCell,
  cellValue,
  createCell,
  notifyCell,
  propCell,
} from '@bazza-ui/menu-core'
import {
  createChangeEventDetails,
  REASONS,
} from '../../../utils/events/index.js'
import type {
  CheckboxValueChangeEventDetails,
  CheckboxValueChangeReason,
} from '../events.js'

export interface CheckboxGroupState {
  /** The group's value: its prop's while the prop controls it. */
  readonly value: string[]
  /** The values in `value`, for `isChecked`. */
  readonly checkedValues: ReadonlySet<string>
}

/**
 * Whether the group's value has `value`, `false` for a row with none. A key
 * selector: rows read it with `useStore(store, isChecked, value)`, so a
 * change re-renders only the rows whose answer changed.
 */
export function isChecked(
  state: CheckboxGroupState,
  value: string | undefined,
): boolean {
  return value !== undefined && state.checkedValues.has(value)
}

export interface CheckboxGroupStoreOptions {
  /** The `value` prop when the store is made, `undefined` while uncontrolled. */
  value: string[] | undefined
  defaultValue: string[]
  /** Calls the consumer's latest `onValueChange` (`useStableCallback`). */
  onValueChange: (
    value: string[],
    eventDetails: CheckboxValueChangeEventDetails,
  ) => void
}

function stateOf(value: string[]): CheckboxGroupState {
  return { value, checkedValues: new Set(value) }
}

/**
 * One checkbox group's value (a `CheckboxGroup`'s or a `CheckboxGroupValue`'s),
 * in a `ControlledCell`, with its effective value in state. Made once with
 * the group and put in its context, which then changes only with the group's
 * `disabled`, so a change re-renders only the rows it checks or unchecks.
 * Only the store writes the cell: its `setValue` (which tells the consumer of
 * every change) and `control`, which syncs the prop.
 */
export class CheckboxGroupStore extends Store<CheckboxGroupState> {
  #cell: ControlledCell<string[]>
  readonly #onValueChange: CheckboxGroupStoreOptions['onValueChange']

  constructor(options: CheckboxGroupStoreOptions) {
    const cell = createCell(options.defaultValue, options.value)
    super(stateOf(cellValue(cell)))
    this.#cell = cell
    this.#onValueChange = options.onValueChange
  }

  /** The group's value: the prop's while it controls it. */
  getValue(): string[] {
    return cellValue(this.#cell)
  }

  /**
   * Replaces the group's value. The consumer's `onValueChange` hears every
   * change first. Returns `false` when it canceled the change.
   */
  setValue(
    value: string[],
    reason: CheckboxValueChangeReason = REASONS.itemPress,
    event?: Event,
  ): boolean {
    const details = createChangeEventDetails(reason, event)
    const asked = this.#cell
    const { cell, result } = notifyCell(
      asked,
      value,
      details,
      this.#onValueChange,
    )
    // Only an uncontrolled change writes, and only over the cell it was asked
    // of: what the consumer did from inside its callback (a prop it synced
    // with `flushSync`, another change) stands.
    if (result === 'applied' && this.#cell === asked) this.#write(cell)
    return result !== 'canceled'
  }

  /** Syncs the `value` prop into the cell, from a layout effect. */
  control(value: string[] | undefined): void {
    this.#write(propCell(this.#cell, value))
  }

  #write(cell: ControlledCell<string[]>) {
    if (cell === this.#cell) return
    const before = cellValue(this.#cell)
    this.#cell = cell
    const value = cellValue(cell)
    if (!Object.is(before, value)) this.setState(stateOf(value))
  }
}
