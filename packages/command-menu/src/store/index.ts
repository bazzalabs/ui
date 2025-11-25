// Store types
export type {
  CommandMenuStore,
  CommandMenuStoreActions,
  CommandMenuStoreState,
  CommandSurfaceSlice,
  CreateCommandMenuStoreOptions,
  NavigationChangeEvent,
  NavigationState,
} from './types.js'

// Store factory
export { createCommandMenuStore } from './create-command-menu-store.js'

// Store context and hooks
export {
  CommandMenuStoreProvider,
  useCommandMenuStoreApi,
  useCommandMenuStore,
  useCommandMenuActions,
  // Convenience selectors
  selectOpen,
  selectDisabled,
  selectScopeId,
  selectFocusOwnerId,
  selectNavigation,
  selectNavigationStack,
  selectIsInSubmenu,
  selectCurrentMenuDef,
  selectShowBreadcrumbs,
  createSurfaceSelector,
  createSurfaceActiveIdSelector,
  createSurfaceQuerySelector,
} from './context.js'

export type { CommandMenuStoreProviderProps } from './context.js'
