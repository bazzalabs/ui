// ============================================================================
// Deep Search Module
// ============================================================================
// Data-first API for popup menus with deep search support.

export type { DataSurfaceContextValue, RenderNodeFn } from './context.js'

// Context
export {
  DataSurfaceContext,
  useDataSurfaceContext,
  useMaybeDataSurfaceContext,
} from './context.js'
export type { PopupMenuDataInputProps } from './data-input.js'
export { PopupMenuDataInput } from './data-input.js'
export type { PopupMenuDataListProps } from './data-list.js'

export { PopupMenuDataList } from './data-list.js'
export type { PopupMenuDataSurfaceProps } from './data-surface.js'
// Components
export { PopupMenuDataSurface } from './data-surface.js'
// Types
export type {
  DataListChildrenState,
  DataListProps,
  DataSurfaceProps,
  DeepSearchConfig,
  DisplayNode,
  GroupDef,
  ItemDef,
  ItemRenderParams,
  NodeDef,
  RowRenderContext,
  ScoredNode,
  SeparatorDef,
  SubmenuDef,
  SubmenuRenderParams,
} from './types.js'
export type { FilterNodesOptions } from './utils.js'
// Utilities
export {
  buildDisplayNodes,
  deduplicateNodes,
  filterNodes,
  flattenNodes,
  getBrowseNodes,
  getFirstNavigableId,
  getNavigableIds,
  isGroupDef,
  isItemDef,
  isSeparatorDef,
  isSubmenuDef,
  partitionByKind,
  scoreNodes,
  sortByScore,
} from './utils.js'
