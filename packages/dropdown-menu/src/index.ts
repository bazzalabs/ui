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

// Menu model types - re-exported from @bazza-ui/menu for developer convenience
export type {
  MenuDef,
  NodeDef,
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
  SubmenuDef,
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

// Middleware - re-exported from @bazza-ui/menu for developer convenience
export { composeMiddleware, createNew } from '@bazza-ui/menu'
export type {
  MenuMiddleware,
  TransformNodesContext,
  BeforeFilterContext,
  AfterFilterContext,
  SearchResult,
  CreateNewConfig,
} from '@bazza-ui/menu'
