// Store types
export type {
  AimGuardState,
  CreatePopupMenuStoreOptions,
  PopupMenuStore,
  PopupMenuStoreActions,
  PopupMenuStoreState,
  PopupSurfaceSlice,
} from './types.js'

// Store factory
export { createPopupMenuStore } from './create-popup-menu-store.js'

// Store context and hooks
export {
  PopupMenuStoreProvider,
  usePopupMenuStoreApi,
  usePopupMenuStore,
  usePopupMenuActions,
  // Selectors
  selectOpen,
  selectDisabled,
  selectScopeId,
  selectFocusOwnerId,
  selectAimGuard,
  createSurfaceSelector,
  createSurfaceActiveIdSelector,
  createSurfaceQuerySelector,
  createSurfaceHoverSelector,
} from './context.js'
export type { PopupMenuStoreProviderProps } from './context.js'
