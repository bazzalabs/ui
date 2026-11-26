// ============================================================================
// Full Pipeline
// ============================================================================

import type { FilterNodesOptions as CoreFilterNodesOptions } from '@bazza-ui/menu-core'
import type { PopupMenuNode } from '../menu-tree/types.js'

// The pipeline lives in `@bazza-ui/menu-core`, generic over the Menu Node type.
export { filterNodes } from '@bazza-ui/menu-core'

export interface FilterNodesOptions
  extends CoreFilterNodesOptions<PopupMenuNode> {}
