// ============================================================================
// Deep Search Module
// ============================================================================
// Data-first API for popup menus with deep search support.

export type {
  DataPopupContextValue,
  DataSurfaceContextValue,
  RenderNodeFn,
} from './context.js'

// Context
export {
  DataListContext,
  DataPopupContext,
  DataSurfaceContext,
  useDataList,
  useDataPopupContext,
  useDataSurfaceContext,
  useMaybeDataList,
  useMaybeDataPopupContext,
  useMaybeDataSurfaceContext,
} from './context.js'
export type { PopupMenuDataInputProps } from './data-input.js'
export { PopupMenuDataInput } from './data-input.js'
export type { PopupMenuDataListProps } from './data-list.js'
export { PopupMenuDataList } from './data-list.js'
export type { PopupMenuDataSubpagesProps } from './data-subpages.js'
export { PopupMenuDataSubpages } from './data-subpages.js'
export type { PopupMenuDataSurfaceProps } from './data-surface.js'
// Components
export { PopupMenuDataSurface } from './data-surface.js'
// Types
export type {
  AsyncResultBehavior,
  BreadcrumbNode,
  CheckboxItemDef,
  CheckboxItemRenderParams,
  CheckboxItemRenderProps,
  DataListChildrenState,
  DataListProps,
  DataSubpagesChildrenState,
  DataSubpagesProps,
  DataSurfaceProps,
  DeepSearchConfig,
  DisplayGroupNode,
  DisplayNode,
  DisplayRadioGroupNode,
  DisplayRowNode,
  DisplaySeparatorNode,
  DisplaySubpageNode,
  GetQualifiedRowIdContext,
  GetQualifiedRowIdFn,
  GroupBehavior,
  GroupDef,
  GroupRenderContext,
  GroupRenderParams,
  IncludeInDeepSearch,
  InitialQueryBehavior,
  ItemDef,
  ItemRenderParams,
  ItemRenderProps,
  NodeDef,
  RadioGroupDef,
  RadioGroupRenderParams,
  RadioGroupRenderProps,
  RadioItemDef,
  RadioItemRenderParams,
  RadioItemRenderProps,
  RowRenderContext,
  ScoredNode,
  SeparatorDef,
  SeparatorRenderParams,
  SubmenuDef,
  SubmenuRenderParams,
  SubmenuRenderProps,
  SubpageContentRenderParams,
  SubpageDef,
  SubpageTriggerRenderParams,
  SubpageTriggerRenderProps,
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
  defaultGetQualifiedRowId,
  filterNodes,
  flattenNodes,
  getBrowseNodesFlatten,
  getBrowseNodesPreserve,
  getFirstNavigableId,
  getNavigableIds,
  getSubpagePageId,
  isCheckboxItemDef,
  isGroupDef,
  isItemDef,
  isRadioGroupDef,
  isRadioItemDef,
  isSeparatorDef,
  isSubmenuDef,
  isSubpageDef,
  partitionByKind,
  scoreNodes,
  shouldIncludeInDeepSearch,
  shouldIncludeSubmenuRowsInDeepSearch,
  shouldLoadEagerly,
  sortByScore,
} from './utils.js'
