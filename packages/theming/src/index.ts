/**
 * @bazza-ui/theming
 *
 * Generic theming system for Bazza UI components.
 * Provides a factory function to create theme contexts with slots, slotProps, and classNames.
 */

export { createThemeSystem } from './create-theme-system.js'
export type { Theme, ThemeDef } from './types.js'

// Re-export utilities from @bazza-ui/menu for convenience
export { mergeProps, mergeClassNames, mergeSlotProps, cn } from '@bazza-ui/menu'
