/** biome-ignore-all assist/source/organizeImports: manual order */
'use client'

// Component props types
export type {
  ActionMenuRootProps,
  ActionMenuTriggerProps,
} from './components/index.js'

export type {
  ActionMenuPositionerProps,
  ActionMenuSurfaceProps,
} from './types.js'

// Menu model types
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
  SurfaceSlots,
  SurfaceSlotProps,
  SurfaceClassNames,
  ShellSlotProps,
  ShellClassNames,
  SearchContext,
  ItemSlotProps,
  RowBindAPI,
  ContentBindAPI,
  InputBindAPI,
  ListBindAPI,
} from './types.js'

// Factory types
export type {
  CreateActionMenuOptions,
  CreateActionMenuResult,
} from './create-action-menu.js'

// Functions
export { renderIcon } from './lib/react-utils.js'
export { defaultSlots } from './lib/slots.js'
export { createActionMenu } from './create-action-menu.js'
export { flatten } from './lib/menu-utils.js'

// Middleware
export { composeMiddleware, createNew } from './middleware/index.js'
export type {
  MenuMiddleware,
  TransformNodesContext,
  BeforeFilterContext,
  AfterFilterContext,
  SearchResult,
  CreateNewConfig,
} from './middleware/index.js'
