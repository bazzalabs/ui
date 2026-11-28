import type { CheckboxValueChangeReason } from '../events.js'
import {
  GroupValueStore,
  type GroupValueStoreOptions,
} from './GroupValueStore.js'

export interface CheckboxGroupState {
  /** The group's own value (while no prop controls it). */
  readonly value: string[]
  /** The values in `value`, for `isChecked`. */
  readonly checkedValues: ReadonlySet<string>
}

/**
 * Whether the group's own value has `value`, `false` for a row with none. A
 * key selector: rows read it with `useStore(store, isChecked, value)`, so a
 * change re-renders only the rows whose answer changed. While a prop controls
 * the group, rows read the prop instead (`groupChecked`).
 */
export function isChecked(
  state: CheckboxGroupState,
  value: string | undefined,
): boolean {
  return value !== undefined && state.checkedValues.has(value)
}

function stateOf(value: string[]): CheckboxGroupState {
  return { value, checkedValues: new Set(value) }
}

/** A checkbox group's value (a `CheckboxGroup`'s or a `CheckboxGroupValue`'s): see `GroupValueStore`. */
export class CheckboxGroupStore extends GroupValueStore<
  string[],
  CheckboxGroupState,
  CheckboxValueChangeReason
> {
  constructor(
    options: Omit<
      GroupValueStoreOptions<
        string[],
        CheckboxGroupState,
        CheckboxValueChangeReason
      >,
      'stateOf'
    >,
  ) {
    super({ ...options, stateOf })
  }
}

/**
 * Whether a checkbox in a group is checked: in the prop, while one controls
 * the group, else in the group's own value (`ownChecked`, from `isChecked`).
 */
export function groupChecked(
  controlled: readonly string[] | undefined,
  ownChecked: boolean,
  value: string | undefined,
): boolean {
  if (controlled === undefined) return ownChecked
  return value !== undefined && controlled.includes(value)
}
