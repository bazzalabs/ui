// ============================================================================
// Async Node Collection & Merging
// ============================================================================

import type { AsyncSubmenuInfo as CoreAsyncSubmenuInfo } from '@bazza-ui/menu-core'
import type { PopupMenuNode } from '../menu-tree/types.js'

// Async branch collection lives in `@bazza-ui/menu-core`, generic over the
// Menu Node type.
export {
  collectAsyncSubmenus,
  resolveBranchIncludeMode,
  shouldLoadEagerly,
} from '@bazza-ui/menu-core'

/**
 * Info about an async branch node (submenu/subpage) for registration.
 */
export interface AsyncSubmenuInfo extends CoreAsyncSubmenuInfo<PopupMenuNode> {}
