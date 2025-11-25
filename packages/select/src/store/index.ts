// Store types
export type {
  AimGuardState,
  CreateMultiSelectStoreOptions,
  CreateSelectStoreOptions,
  MultiSelectionState,
  SelectionState,
  SelectMenuStore,
  SelectMenuStoreActions,
  SelectMenuStoreState,
  SelectSurfaceSlice,
  SingleSelectionState,
} from './types.js'

// Store factories
export {
  createMultiSelectStore,
  createSelectStore,
} from './create-select-store.js'

// Store context and hooks
export {
  SelectMenuStoreProvider,
  useSelectMenuStoreApi,
  useSelectMenuStore,
  useSelectMenuActions,
  // Convenience selectors
  selectOpen,
  selectDisabled,
  selectScopeId,
  selectFocusOwnerId,
  selectSelection,
  selectValue,
  selectValues,
  selectSelectionMode,
  createSurfaceSelector,
  createSurfaceActiveIdSelector,
  createSurfaceQuerySelector,
} from './context.js'

export type { SelectMenuStoreProviderProps } from './context.js'
