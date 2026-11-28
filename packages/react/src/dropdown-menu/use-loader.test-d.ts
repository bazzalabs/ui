// Type tests: checked by `bun run type-check` (test files aren't, and this
// one isn't run by Vitest).
import { expectTypeOf } from 'vitest'
import {
  DropdownMenu,
  type LoaderState,
  type NodeDef,
  useLoader,
} from './index.js'

// A loader's state is about node defs unless said otherwise.
expectTypeOf<LoaderState>().toEqualTypeOf<LoaderState<NodeDef[]>>()
expectTypeOf(useLoader).returns.toEqualTypeOf<LoaderState>()
expectTypeOf(DropdownMenu.useLoader).toEqualTypeOf(useLoader)

export function useAnnotatedLoader(): LoaderState {
  const state: LoaderState = DropdownMenu.useLoader()
  return state
}
