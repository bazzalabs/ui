/** biome-ignore-all assist/source/organizeImports: manual order */
'use client'

// Components
export { ContextMenuRoot } from './components/root.js'
export { ContextMenuTrigger } from './components/trigger.js'
export { ContextMenuContent } from './components/content.js'

// Keep simple component export for convenience
export { ContextMenu } from './context-menu.js'
export type { ContextMenuProps } from './types.js'

// Component props types
export type {
  CreateContextMenuResult,
  CreateContextMenuOptions,
  ContextMenuOptions,
} from './create-context-menu.js'

export type {
  PopupMenuSlots as ContextMenuSlots,
  PopupMenuSlotProps as ContextMenuSlotProps,
  PopupMenuClassNames as ContextMenuClassNames,
  PopupMenuTheme as ContextMenuTheme,
  PopupMenuThemeDef as ContextMenuThemeDef,
} from '@bazza-ui/popup-menu'

// Package-specific menu types with dual naming
export type {
  // Full names (explicit)
  ContextMenuDef,
  ContextSubmenuDef,
  ContextNodeDef,
} from './types.js'

// Simple names (convenient for package-scoped usage)
export type {
  ContextMenuDef as MenuDef,
  ContextSubmenuDef as SubmenuDef,
  ContextNodeDef as NodeDef,
} from './types.js'

// Re-export non-extended base types from @bazza-ui/menu for developer convenience
export type {
  GroupDef,
  DefaultGroupDef,
  RadioGroupDef,
  ItemDef,
  BaseItemDef,
  ButtonItemDef,
  CheckboxItemDef,
  RadioItemDef,
  ItemVariantMap,
  ExtendedItemVariantMap,
  ItemVariant,
  ExtendedItemVariant,
  ItemExtendedProperties,
  SeparatorDef,
  SeparatorNode,
  LoadingDef,
  LoadingNode,
  Menu,
  GroupNode,
  DefaultGroupNode,
  RadioGroupNode,
  ItemNode,
  ButtonItemNode,
  CheckboxItemNode,
  RadioItemNode,
  MenuNodeKind,
  SearchContext,
  ItemSlotProps,
  RowBindAPI,
  ContentBindAPI,
  InputBindAPI,
  ListBindAPI,
  GroupHeadingBindAPI,
} from '@bazza-ui/menu'

// Factory
export { createContextMenu } from './create-context-menu.js'

// Control types
export type * from './control.js'

// Functions - re-exported from @bazza-ui/menu for developer convenience
export { renderIcon, flatten } from '@bazza-ui/menu'

// Export middleware helpers (also available at @bazza-ui/context-menu/middleware)
export { composeMiddleware, createNew } from './middleware.js'
