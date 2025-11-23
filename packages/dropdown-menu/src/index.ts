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

export { createDropdownMenu } from './create-dropdown-menu.js'

// Export control types
export type * from './control.js'

// Export all types
export type * from './types.js'

export { flatten, renderIcon } from '@bazza-ui/menu'
