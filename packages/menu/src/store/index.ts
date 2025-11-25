// Store types

// Context factory
export {
  createMenuStoreContext,
  type MenuStoreContextValue,
} from './context.js'

// Store factory
export { createBaseMenuStore } from './create-base-menu-store.js'

// Selectors
export * as menuSelectors from './selectors.js'
export {
  // Derived selectors
  selectActiveNode,
  // Cross-surface selectors
  selectAllSurfaces,
  selectChildSurfaces,
  selectDeepestOpenSurface,
  selectDir,
  selectDisabled,
  selectDisplayNodes,
  selectError,
  selectFilteredNodes,
  selectFocusOwner,
  selectHasResults,
  selectIsEmpty,
  selectIsFocusOwner,
  // Loading state selectors
  selectIsLoading,
  selectIsStreaming,
  selectItemNodes,
  selectKeyboard,
  selectLoadingProgress,
  selectMenu,
  selectMenuDef,
  selectNodesByKind,
  // Root selectors
  selectOpen,
  selectOpenSurfacesCount,
  selectOriginalNodes,
  // Action selectors
  selectRootActions,
  selectRootSurface,
  selectScopeId,
  selectSubmenuNodes,
  // Surface selectors (generic)
  selectSurface,
  selectSurfaceActions,
  selectSurfaceActiveId,
  selectSurfaceDepth,
  selectSurfaceInputActive,
  selectSurfaceOpen,
  selectSurfaceParentId,
  // Surface primitive selectors
  selectSurfaceQuery,
  selectSurfacesByDepth,
  selectVimBindings,
} from './selectors.js'
export type {
  BaseMenuStore,
  BaseMenuStoreActions,
  BaseMenuStoreState,
  CreateBaseMenuStoreOptions,
  // Type helpers for constraints
  MenuDefLike,
  MenuLike,
  MenuSurfaceSlice,
  NodeLike,
  StoreExtension,
  // Surface refs type
  SurfaceRefs,
} from './types.js'
