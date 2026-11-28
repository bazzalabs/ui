// Type tests: checked by `bun run type-check` (test files aren't, and this
// one isn't run by Vitest).
import {
  defaultPopupMenuDebugContextValue,
  type PopupMenuDebugContextValue,
} from './popup-menu-debug-context.js'

// A production build's overlay flag is only `enabled: false`: an overlay
// setting reads only once `enabled` has narrowed the value to the settings.
export function readOverlay(debug: PopupMenuDebugContextValue): string | null {
  const overlay = debug.showSafeTriangleArea
  // @ts-expect-error an overlay setting needs `enabled` checked first
  void overlay.missColor
  return overlay.enabled ? overlay.missColor : null
}

export const production: { readonly enabled: false } = { enabled: false }
// The production value is one the root may hold.
export const held: PopupMenuDebugContextValue = {
  ...defaultPopupMenuDebugContextValue,
  showSafeTriangleArea: production,
}
