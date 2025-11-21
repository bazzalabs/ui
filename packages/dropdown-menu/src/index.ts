/** biome-ignore-all assist/source/organizeImports: manual order */
'use client'

// Components
export { DropdownMenuRoot } from './components/root.js'
export { DropdownMenuTrigger } from './components/trigger.js'
export { DropdownMenuContent } from './components/content.js'

// Keep simple component export for convenience
export { DropdownMenu } from './dropdown-menu.js'
export type { DropdownMenuProps } from './types.js'

// Component props types
export type {
  CreateDropdownMenuResult,
  CreateDropdownMenuOptions,
  DropdownMenuOptions,
} from './create-dropdown-menu.js'

export type {
  PopupMenuSlots as DropdownMenuSlots,
  PopupMenuSlotProps as DropdownMenuSlotProps,
  PopupMenuClassNames as DropdownMenuClassNames,
  PopupMenuTheme as DropdownMenuTheme,
  PopupMenuThemeDef as DropdownMenuThemeDef,
} from '@bazza-ui/popup-menu'

export type {
  PopupMenuSlots,
  PopupMenuSlotProps,
  PopupMenuClassNames,
  PopupMenuTheme,
  PopupMenuThemeDef,
} from '@bazza-ui/popup-menu'

// Package-specific menu types with dual naming
export type {
  // Full names (explicit)
  DropdownMenuDef,
  DropdownSubmenuDef,
  DropdownNodeDef,
} from './types.js'

// Simple names (convenient for package-scoped usage)
export type {
  DropdownMenuDef as MenuDef,
  DropdownSubmenuDef as SubmenuDef,
  DropdownNodeDef as NodeDef,
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
export { createDropdownMenu } from './create-dropdown-menu.js'

// Functions - re-exported from @bazza-ui/menu for developer convenience
export { renderIcon, flatten } from '@bazza-ui/menu'

export type * from './types.js'
