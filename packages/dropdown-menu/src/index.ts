/** biome-ignore-all assist/source/organizeImports: manual order */
'use client'

// Components
export { DropdownMenuRoot } from './components/root.js'
export { DropdownMenuTrigger } from './components/trigger.js'
export { DropdownMenuContent } from './components/content.js'

// Keep simple component export for convenience
export { DropdownMenu } from './dropdown-menu.js'
export { DropdownMenuRoot as Root } from './components/root.js'
export { DropdownMenuTrigger as Trigger } from './components/trigger.js'
export { DropdownMenuContent as Content } from './components/content.js'

// Factory and component props types
export type {
  CreateDropdownMenuResult,
  CreateDropdownMenuOptions,
  DropdownMenuOptions,
} from './create-dropdown-menu.js'

export { createDropdownMenu } from './create-dropdown-menu.js'

// Export control types
export type * from './control.js'

// Export all types
export type * from './types.js'

// Package-specific menu types with dual naming
export type {
  DropdownMenuDef,
  DropdownSubmenuDef,
  DropdownNodeDef,
  DropdownNode,
  DropdownSubmenuNode,
} from './types.js'

// Simple names (convenient for package-scoped usage)
export type {
  DropdownMenuDef as MenuDef,
  DropdownSubmenuDef as SubmenuDef,
  DropdownNodeDef as NodeDef,
  DropdownNode as Node,
  DropdownSubmenuNode as SubmenuNode,
} from './types.js'

// Theme/Slot types from popup-menu (not extended, just used)
export type {
  PopupMenuSlots,
  PopupMenuSlotProps,
  PopupMenuClassNames,
  PopupMenuTheme,
  PopupMenuThemeDef,
} from '@bazza-ui/popup-menu'

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
  LoadingDef,
  Menu,
  GroupNode,
  DefaultGroupNode,
  RadioGroupNode,
  ItemNode,
  ButtonItemNode,
  CheckboxItemNode,
  RadioItemNode,
  SeparatorNode,
  LoadingNode,
  MenuNodeKind,
  SearchContext,
  ItemSlotProps,
  RowBindAPI,
  ContentBindAPI,
  InputBindAPI,
  ListBindAPI,
  GroupHeadingBindAPI,
} from '@bazza-ui/menu'

export { flatten, renderIcon } from '@bazza-ui/menu'

// Export middleware helpers (also available at @bazza-ui/dropdown-menu/middleware)
export { composeMiddleware, createNew } from './middleware.js'
