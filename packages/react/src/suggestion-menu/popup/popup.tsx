'use client'

import * as React from 'react'
import { PopupMenuPopup } from '../../internal/popup-menu/index.js'

export interface SuggestionMenuPopupProps extends PopupMenuPopup.Props {}

/**
 * The popup that holds the suggestions. It isn't a dialog: focus never enters
 * it, and the listbox inside is what the host input points at.
 * Renders a `<div>` element.
 */
export const SuggestionMenuPopup = React.forwardRef<
  HTMLDivElement,
  SuggestionMenuPopupProps
>(function SuggestionMenuPopup(props, forwardedRef) {
  return <PopupMenuPopup ref={forwardedRef} role="presentation" {...props} />
})

export namespace SuggestionMenuPopup {
  export type Props = SuggestionMenuPopupProps
}
