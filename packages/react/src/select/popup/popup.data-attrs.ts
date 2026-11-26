// Re-export all base popup data attributes
// oxlint-disable-next-line no-restricted-imports -- bazza/data-attrs-enum needs the engine enum re-exported from its data-attrs file, which `index.js` isn't
export { PopupMenuPopupDataAttributes } from '../../internal/popup-menu/components/popup/popup.data-attrs.js'

/**
 * Select-specific popup data attributes (in addition to PopupMenuPopupDataAttributes).
 */
export enum SelectPopupDataAttributes {
  /**
   * Present when the popup is using align-item-with-trigger positioning.
   * This reflects the actual state, not just the prop value.
   */
  alignItemWithTrigger = 'data-align-item-with-trigger',
}
