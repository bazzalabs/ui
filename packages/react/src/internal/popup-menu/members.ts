// ============================================================================
// Popup Menu: names for members only
// ============================================================================
// Names the menu members need that `index.ts` doesn't export. Not a package
// entry: `index.ts` is `@bazza-ui/react/internal/popup-menu`, and its exports
// don't change. Members import everything else from `index.js`.
// See "Layers" in packages/react/AGENTS.md.

export {
  getRequestReason,
  type PopupActions,
  popupActionsOf,
} from '../listbox/store/ListboxStore.js'
export {
  DataPopupProvider,
  DataSubpagesContent,
} from './data-first/data-subpages.js'
export type { LoaderState, QueryToken } from './data-first/types.js'
export { useLoader, useLoadersSettled } from './data-first/use-loader.js'
export type { PopupMenuOpenChangeReason } from './events.js'
export { useCloseInOneFrame } from './hooks/use-close-in-one-frame.js'
export { useMenuElement, usePressClaim } from './hooks/use-menu-element.js'
export {
  askFromBaseUI,
  askRootOpen,
  mirrorToBaseUI,
} from './store/MenuTreeStore.js'
