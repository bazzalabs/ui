// ============================================================================
// Suggestion Menu Exports
// ============================================================================

// Namespace export
export * as SuggestionMenu from './index.parts.js'

// ============================================================================
// Suggestion-menu specific
// ============================================================================

export type {
  SuggestionMenuHighlightChangeEventDetails,
  SuggestionMenuHighlightChangeReason,
  SuggestionMenuOpenChangeEventDetails,
  SuggestionMenuOpenChangeReason,
} from './events.js'
export {
  createSuggestionMenuHandle,
  type SuggestionMenuAnchor,
  SuggestionMenuHandle,
  type SuggestionMenuUpdate,
} from './handle.js'
export type {
  SuggestionMenuList,
  SuggestionMenuListProps,
} from './list/list.js'
export type {
  SuggestionMenuPopup,
  SuggestionMenuPopupProps,
} from './popup/popup.js'
export type {
  SuggestionMenuRoot,
  SuggestionMenuRootProps,
  SuggestionMenuRootRenderState,
} from './root/root.js'
export type {
  SuggestionMenuSurface,
  SuggestionMenuSurfaceProps,
} from './surface/surface.js'

// ============================================================================
// Re-exported from internal/popup-menu (with SuggestionMenu prefix)
// ============================================================================

// Data-first content and loaders
export type {
  AsyncContentMode,
  AsyncLoaderConfig,
  AsyncLoaderResult,
  AsyncMenuCoordinatorValue,
  AsyncResultBehavior,
  GroupDef,
  ItemDef,
  LinkItemDef,
  LoaderComponentProps,
  NodeDef,
  PopupMenuArrowProps as SuggestionMenuArrowProps,
  PopupMenuEmptyProps as SuggestionMenuEmptyProps,
  PopupMenuEmptyState as SuggestionMenuEmptyState,
  PopupMenuFooterProps as SuggestionMenuFooterProps,
  PopupMenuGroupLabelProps as SuggestionMenuGroupLabelProps,
  PopupMenuGroupProps as SuggestionMenuGroupProps,
  PopupMenuHeaderProps as SuggestionMenuHeaderProps,
  PopupMenuIconProps as SuggestionMenuIconProps,
  PopupMenuItemProps as SuggestionMenuItemProps,
  PopupMenuItemState as SuggestionMenuItemState,
  PopupMenuLinkItemProps as SuggestionMenuLinkItemProps,
  PopupMenuLoadingProps as SuggestionMenuLoadingProps,
  PopupMenuNode,
  PopupMenuPortalProps as SuggestionMenuPortalProps,
  PopupMenuPositionerProps as SuggestionMenuPositionerProps,
  PopupMenuSeparatorProps as SuggestionMenuSeparatorProps,
  QueryLoaderConfig,
  SeparatorDef,
  StaticLoaderConfig,
  TreeItemDef,
} from '../internal/popup-menu/index.js'
export {
  useAsyncMenuCoordinator,
  useDataList,
} from '../internal/popup-menu/index.js'
