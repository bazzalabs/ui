import { createThemeSystem } from '@bazza-ui/theming'
import { defaultSlots } from '../lib/slots.js'
import type {
  CommandMenuClassNames,
  CommandMenuSlotProps,
  CommandMenuSlots,
} from '../types.js'

/**
 * Create the theming system for command menus.
 * Provides GlobalThemeProvider, ScopedThemeProvider, and theme hooks.
 */
const {
  mergeTheme,
  GlobalThemeProvider,
  ScopedThemeProvider,
  useGlobalTheme,
  useScopedTheme,
} = createThemeSystem<
  CommandMenuSlots,
  CommandMenuSlotProps,
  CommandMenuClassNames
>(defaultSlots)

export {
  mergeTheme,
  GlobalThemeProvider,
  ScopedThemeProvider,
  useGlobalTheme,
  useScopedTheme,
}
