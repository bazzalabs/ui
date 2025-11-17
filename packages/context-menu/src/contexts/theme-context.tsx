import { createThemeSystem } from '@bazza-ui/theming'
import { defaultSlots } from '../lib/slots.js'
import type {
  ContextMenuSlots,
  ContextMenuSlotProps,
  ContextMenuClassNames,
} from '../types.js'

/**
 * Create the theming system for context menus.
 * Provides GlobalThemeProvider, ScopedThemeProvider, and theme hooks.
 */
const {
  mergeTheme,
  GlobalThemeProvider,
  ScopedThemeProvider,
  useGlobalTheme,
  useScopedTheme,
} = createThemeSystem<
  ContextMenuSlots,
  ContextMenuSlotProps,
  ContextMenuClassNames
>(defaultSlots)

export {
  mergeTheme,
  GlobalThemeProvider,
  ScopedThemeProvider,
  useGlobalTheme,
  useScopedTheme,
}
