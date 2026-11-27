'use client'

import { type ReadonlyStore, Store, useStore } from '@base-ui/utils/store'

// Read in place of a missing store; it never changes.
const NO_STORE: ReadonlyStore<object> = new Store({})
const returnFallback = (_state: object, fallback: unknown) => fallback

/**
 * `useStore(store, selector, arg)` for a store a part may not have (outside
 * a menu tree, a submenu or a data-first Surface): `fallback` while there's
 * none.
 */
export function useMaybeStore<State, Value, Arg = undefined>(
  store: ReadonlyStore<State> | null | undefined,
  selector: (state: State, arg: Arg) => Value,
  fallback: Value,
  arg?: Arg,
): Value {
  return useStore(
    (store ?? NO_STORE) as ReadonlyStore<State | object>,
    (store ? selector : returnFallback) as (
      state: State | object,
      arg: unknown,
    ) => Value,
    store ? arg : fallback,
  )
}
