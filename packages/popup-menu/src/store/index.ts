// Store types

export type { PopupMenuStoreProviderProps } from './context.js'
// Store context and hooks
export {
  createSurfaceActiveIdSelector,
  createSurfaceHoverSelector,
  createSurfaceQuerySelector,
  createSurfaceSelector,
  PopupMenuStoreProvider,
  selectAimGuard,
  selectDisabled,
  selectFocusOwnerId,
  // Selectors
  selectOpen,
  selectScopeId,
  // Surface hooks
  useActiveId,
  useDisplayNodes,
  useInputActive,
  usePopupMenuActions,
  usePopupMenuStore,
  usePopupMenuStoreApi,
  useSurfaceMenu,
  useSurfaceOrder,
  useSurfaceQuery,
  useSurfaceRefs,
  useSurfaceRows,
} from './context.js'
// Store factory
export { createPopupMenuStore } from './create-popup-menu-store.js'
export type {
  AimGuardState,
  CreatePopupMenuStoreOptions,
  PopupMenuStore,
  PopupMenuStoreActions,
  PopupMenuStoreState,
  PopupSurfaceSlice,
} from './types.js'
