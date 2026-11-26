import type {
  AppendLoadedIds as CoreAppendLoadedIds,
  AppendLoadedResult as CoreAppendLoadedResult,
} from '@bazza-ui/menu-core'
import type { NodeDef } from './types.js'

// Appending loaded defs lives in `@bazza-ui/menu-core`, generic over the def
// type.
export { appendLoadedDefs } from '@bazza-ui/menu-core'

/** How the menu identifies rows, so duplicates match the Menu Tree exactly. */
export interface AppendLoadedIds extends CoreAppendLoadedIds<NodeDef> {}

export interface AppendLoadedResult extends CoreAppendLoadedResult<NodeDef> {}
