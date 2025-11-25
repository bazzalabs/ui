// Re-export non-extended base types from @bazza-ui/menu for developer convenience
export type {
  BaseItemDef,
  ButtonItemDef,
  ButtonItemNode,
  CheckboxItemDef,
  CheckboxItemNode,
  ContentBindAPI,
  DefaultGroupDef,
  DefaultGroupNode,
  ExtendedItemVariant,
  ExtendedItemVariantMap,
  GroupDef,
  GroupHeadingBindAPI,
  GroupNode,
  InputBindAPI,
  ItemDef,
  ItemExtendedProperties,
  ItemNode,
  ItemSlotProps,
  ItemVariant,
  ItemVariantMap,
  ListBindAPI,
  LoadingDef,
  LoadingNode,
  Menu,
  MenuNodeKind,
  RadioGroupDef,
  RadioGroupNode,
  RadioItemDef,
  RadioItemNode,
  RowBindAPI,
  SearchContext,
  SeparatorDef,
  SeparatorNode,
} from '@bazza-ui/menu'
export { flatten, renderIcon } from '@bazza-ui/menu'

// Export control types
export type * from './control.js'
export type {
  CommandMenuOptions,
  CreateCommandMenuOptions,
  CreateCommandMenuResult,
} from './create-command-menu.js'
// Factory
export { createCommandMenu } from './create-command-menu.js'
export type { CommandMenuEvent } from './events.js'
// Export event constants
export { COMMAND_MENU_EVENTS } from './events.js'
// Export middleware helpers (also available at @bazza-ui/command-menu/middleware)
export { composeMiddleware, createNew } from './middleware.js'
export type {
  CommandMenuStore,
  CommandMenuStoreActions,
  CommandMenuStoreProviderProps,
  CommandMenuStoreState,
  CommandSurfaceSlice,
  CreateCommandMenuStoreOptions,
  NavigationChangeEvent,
  NavigationState,
} from './store/index.js'
// Export store hooks and context (for advanced use cases)
export {
  CommandMenuStoreProvider,
  createCommandMenuStore,
  createSurfaceActiveIdSelector,
  createSurfaceQuerySelector,
  createSurfaceSelector,
  selectCurrentMenuDef,
  selectDisabled,
  selectFocusOwnerId,
  selectIsInSubmenu,
  selectNavigation,
  selectNavigationStack,
  selectOpen,
  selectScopeId,
  selectShowBreadcrumbs,
  useCommandMenuActions,
  useCommandMenuStore,
  useCommandMenuStoreApi,
} from './store/index.js'
// Export all types from types.js
export type * from './types.js'
// Export package-specific menu types with dual naming
// Simple names (convenient for package-scoped usage)
export type {
  CommandMenuClassNames,
  CommandMenuClassNames as MenuClassNames,
  CommandMenuDef,
  CommandMenuDef as MenuDef,
  CommandMenuSlotProps,
  CommandMenuSlotProps as MenuSlotProps,
  CommandMenuSlots,
  CommandMenuSlots as MenuSlots,
  CommandMenuTheme,
  CommandMenuTheme as MenuTheme,
  CommandMenuThemeDef,
  CommandMenuThemeDef as MenuThemeDef,
  CommandNodeDef,
  CommandNodeDef as NodeDef,
  CommandSubmenuDef,
  CommandSubmenuDef as SubmenuDef,
} from './types.js'
