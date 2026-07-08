// ============================================================================
// Internal Composite Package
// ============================================================================
// Roving-tabindex focus management for composite widgets (APG conventions).
// Used by: popup-menu focus zones. Internal only — not exported publicly.

export type {
  UseRovingFocusParams,
  UseRovingFocusReturn,
} from './use-roving-focus.js'
export { getRovingCandidates, useRovingFocus } from './use-roving-focus.js'
