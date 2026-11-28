import type { RadioValueChangeReason } from '../events.js'
import {
  GroupValueStore,
  type GroupValueStoreOptions,
} from './GroupValueStore.js'

export interface RadioGroupState {
  /** The group's own selected value (while no prop controls it). */
  readonly value: string | undefined
}

/**
 * Whether `value` is the group's own selected value. A key selector: items
 * read it with `useStore(store, isSelected, value)`, so selecting one
 * re-renders only the item that loses the selection and the one that takes
 * it. While a prop controls the group, items read the prop instead.
 */
export function isSelected(state: RadioGroupState, value: string): boolean {
  return state.value === value
}

function stateOf(value: string | undefined): RadioGroupState {
  return { value }
}

/** A radio group's value (a `RadioGroup`'s or a `RadioGroupValue`'s): see `GroupValueStore`. */
export class RadioGroupStore extends GroupValueStore<
  string | undefined,
  RadioGroupState,
  RadioValueChangeReason
> {
  constructor(
    options: Omit<
      GroupValueStoreOptions<
        string | undefined,
        RadioGroupState,
        RadioValueChangeReason
      >,
      'stateOf'
    >,
  ) {
    super({ ...options, stateOf })
  }
}
