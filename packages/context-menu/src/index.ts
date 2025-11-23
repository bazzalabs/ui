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

// Menu model types - re-exported from @bazza-ui/menu for developer convenience
export type {
  MenuDef as BaseMenuDef,
  NodeDef as BaseNodeDef,
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
  SubmenuDef as BaseSubmenuDef,
  SeparatorDef,
  SeparatorNode,
  Menu,
  Node,
  GroupNode,
  DefaultGroupNode,
  RadioGroupNode,
  ItemNode,
  ButtonItemNode,
  CheckboxItemNode,
  RadioItemNode,
  SubmenuNode,
  MenuNodeKind,
  MenuSlots,
  MenuSlotProps,
  MenuClassNames,
  MenuTheme,
  MenuThemeDef,
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
