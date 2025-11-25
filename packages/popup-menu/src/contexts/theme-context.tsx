import { createThemeSystem } from '@bazza-ui/theming'
import { defaultSlots } from '../components/slots/default-slots.js'
import type {
  PopupMenuClassNames,
  PopupMenuSlotProps,
  PopupMenuSlots,
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
} = createThemeSystem<PopupMenuSlots, PopupMenuSlotProps, PopupMenuClassNames>(
  defaultSlots,
)

export {
  mergeTheme,
  GlobalThemeProvider,
  ScopedThemeProvider,
  useGlobalTheme,
  useScopedTheme,
  type PopupMenuSlots,
  type PopupMenuSlotProps,
  type PopupMenuClassNames,
}
