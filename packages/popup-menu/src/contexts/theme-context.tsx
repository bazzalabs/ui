import { createThemeSystem } from '@bazza-ui/theming'
import { defaultSlots } from '../lib/slots.js'
import type {
  PopupMenuSlots,
  PopupMenuSlotProps,
  PopupMenuClassNames,
} from '../types.js'

/**
 * Create the theming system for popup menus.
 * Provides GlobalThemeProvider, ScopedThemeProvider, and theme hooks.
 */
const {
  mergeTheme,
  GlobalThemeProvider,
  ScopedThemeProvider,
  useGlobalTheme,
  useScopedTheme,
} = createThemeSystem<
  PopupMenuSlots,
  PopupMenuSlotProps,
  PopupMenuClassNames
>(defaultSlots)

export {
  mergeTheme,
  GlobalThemeProvider,
  ScopedThemeProvider,
  useGlobalTheme,
  useScopedTheme,
}
