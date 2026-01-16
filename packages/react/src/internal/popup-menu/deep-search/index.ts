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
  CheckboxItemDef,
  CheckboxItemRenderParams,
  CheckboxItemRenderProps,
  DataListChildrenState,
  DataListProps,
  DataSurfaceProps,
  DeepSearchConfig,
  DisplayGroupNode,
  DisplayNode,
  DisplayRadioGroupNode,
  DisplayRowNode,
  DisplaySeparatorNode,
  GroupBehavior,
  GroupDef,
  GroupRenderContext,
  GroupRenderParams,
  ItemDef,
  ItemRenderParams,
  ItemRenderProps,
  NodeDef,
  RadioGroupDef,
  RadioGroupRenderParams,
  RadioGroupRenderProps,
  RowRenderContext,
  ScoredNode,
  SeparatorDef,
  SeparatorRenderParams,
  SubmenuDef,
  SubmenuRenderParams,
  SubmenuRenderProps,
} from './types.js'
export {
  defineRadioGroup,
  isDisplayGroupNode,
  isDisplayRadioGroupNode,
  isDisplayRowNode,
  isDisplaySeparatorNode,
} from './types.js'
export type { FilterNodesOptions } from './utils.js'
// Utilities
export {
  buildDisplayRowNodes,
  deduplicateNodes,
  filterNodes,
  flattenNodes,
  getBrowseNodesFlatten,
  getBrowseNodesPreserve,
  getFirstNavigableId,
  getNavigableIds,
  isCheckboxItemDef,
  isGroupDef,
  isItemDef,
  isRadioGroupDef,
  isSeparatorDef,
  isSubmenuDef,
  partitionByKind,
  scoreNodes,
  sortByScore,
} from './utils.js'
