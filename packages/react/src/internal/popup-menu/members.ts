// ============================================================================
// Popup Menu: names for members only
// ============================================================================
// Names the menu members need that `index.ts` doesn't export. Not a package
// entry: `index.ts` is `@bazza-ui/react/internal/popup-menu`, and its exports
// don't change. Members import everything else from `index.js`.
// See "Layers" in packages/react/AGENTS.md.

export type { ResolvedNodesSlot } from './data-first/context.js'
export { DataSubpagesContent } from './data-first/data-subpages.js'
export type { PopupMenuOpenChangeReason } from './events.js'
export { useMenuElement, usePressClaim } from './hooks/use-menu-element.js'
