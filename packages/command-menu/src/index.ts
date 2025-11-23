export type {
  CommandMenuOptions,
  CreateCommandMenuOptions,
  CreateCommandMenuResult,
} from './create-command-menu.js'

// Factory
export { createCommandMenu } from './create-command-menu.js'

// Export control types
export type * from './control.js'

// Export event constants
export { COMMAND_MENU_EVENTS } from './events.js'
export type { CommandMenuEvent } from './events.js'

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
