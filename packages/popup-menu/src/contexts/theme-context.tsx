import { createThemeSystem, mergePositionerProps } from '@bazza-ui/theming'
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
} = createThemeSystem<PopupMenuSlots, PopupMenuSlotProps, PopupMenuClassNames>({
  defaultSlots,
  slotPropMergeStrategy: {
    positioner: mergePositionerProps,
  },
})

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
