import { Store } from '@base-ui/utils/store'
import {
  type ControlledCell,
  cellValue,
  createCell,
  notifyCell,
  propCell,
} from '@bazza-ui/menu-core'
import {
  type ChangeEventDetails,
  createChangeEventDetails,
  REASONS,
} from '../../../utils/events/index.js'

export interface GroupValueStoreOptions<Value, State, Reason extends string> {
  /** The `value` prop when the store is made, `undefined` while uncontrolled. */
  value: Value | undefined
  defaultValue: Value
  /** Calls the consumer's latest `onValueChange` (`useStableCallback`). */
  onValueChange: (
    value: Value,
    eventDetails: ChangeEventDetails<Reason>,
  ) => void
  /** The state rows read, from the group's own value. */
  stateOf: (value: Value) => State
  /**
   * Whether the group keeps a value of its own while no prop controls it.
   * A headless `*GroupValue` provider doesn't: it only reports changes.
   */
  ownsValue: boolean
}

/**
 * One selection group's value (a checkbox or radio group, or its headless
 * `*GroupValue` provider), in a `ControlledCell`. Its state is derived from
 * the group's own value, the one it keeps while no prop controls it: a
 * change to it re-renders only the rows whose answer changed. While a prop
 * controls the group, its rows read the prop from the group's context, in
 * the render that brings it, so they never render an older value than their
 * props; the prop syncs into the cell from a layout effect for `getValue`,
 * and changes nothing rows read here. Only the store writes the cell: its
 * `setValue` (which tells the consumer of every change) and `control`.
 */
export class GroupValueStore<
  Value,
  State,
  Reason extends string,
> extends Store<State> {
  #cell: ControlledCell<Value>
  readonly #options: GroupValueStoreOptions<Value, State, Reason>

  constructor(options: GroupValueStoreOptions<Value, State, Reason>) {
    const cell = createCell(options.defaultValue, options.value)
    super(options.stateOf(cell.internal))
    this.#cell = cell
    this.#options = options
  }

  /** The group's value: the prop's while it controls it (as of its last commit). */
  getValue(): Value {
    return cellValue(this.#cell)
  }

  /**
   * Replaces the group's value. The consumer's `onValueChange` hears every
   * change first, even one to the value the group has. Returns `false` when
   * it canceled the change.
   */
  setValue(
    value: Value,
    reason: Reason = REASONS.itemPress as Reason,
    event?: Event,
  ): boolean {
    const details = createChangeEventDetails(reason, event)
    const asked = this.#cell
    const { cell, result } = notifyCell(
      asked,
      value,
      details,
      this.#options.onValueChange,
    )
    // Only an uncontrolled change writes, only in a group that keeps its
    // value, and only over the cell it was asked of: what the consumer did
    // from inside its callback (a prop it synced with `flushSync`, another
    // change) stands.
    if (
      result === 'applied' &&
      this.#options.ownsValue &&
      this.#cell === asked
    ) {
      this.#write(cell)
    }
    return result !== 'canceled'
  }

  /** Syncs the `value` prop into the cell, from a layout effect. */
  control(value: Value | undefined): void {
    this.#write(propCell(this.#cell, value))
  }

  #write(cell: ControlledCell<Value>) {
    if (cell === this.#cell) return
    const before = this.#cell.internal
    this.#cell = cell
    if (!Object.is(before, cell.internal)) {
      this.setState(this.#options.stateOf(cell.internal))
    }
  }
}
