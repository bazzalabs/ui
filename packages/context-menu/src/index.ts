/** biome-ignore-all assist/source/organizeImports: manual order */
'use client'

// Base component
export { ContextMenu } from './context-menu.js'

// Components
export { ContextMenuInput } from './components/input.js'
export type { ContextMenuInputProps } from './components/input.js'

// Component props types
export type { ContextMenuProps } from './types.js'

// Theming types
export type {
  ContextMenuSlots,
  ContextMenuSlotProps,
  ContextMenuClassNames,
  ContextMenuTheme,
  ContextMenuThemeDef,
  RowBindAPI,
  ContentBindAPI,
  ListBindAPI,
  GroupHeadingBindAPI,
} from './types.js'

// Factory
export { createContextMenu } from './create-context-menu.js'
export type {
  CreateContextMenuOptions,
  CreateContextMenuResult,
  ThemedContextMenuProps,
} from './create-context-menu.js'

// Theming utilities
export { defaultSlots } from './lib/slots.js'
export {
  mergeTheme,
  useGlobalTheme,
  useScopedTheme,
  GlobalThemeProvider,
  ScopedThemeProvider,
} from './contexts/theme-context.js'

// Re-export menu types for convenience
export type {
  MenuDef,
  NodeDef,
  ItemDef,
  GroupDef,
  SubmenuDef,
  SeparatorDef,
  Menu,
  Node,
  ItemNode,
  GroupNode,
  SubmenuNode,
  SeparatorNode,
} from '@bazza-ui/menu'

// Re-export renderIcon utility
export { renderIcon } from '@bazza-ui/menu'
