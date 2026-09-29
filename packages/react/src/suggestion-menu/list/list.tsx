'use client'

import * as React from 'react'
import { PopupMenuList } from '../../internal/popup-menu/index.js'

export interface SuggestionMenuListProps extends PopupMenuList.Props {
  /**
   * Accessible label for the listbox.
   * @default 'Suggestions'
   */
  label?: string
}

/**
 * The listbox of suggestions. Keyboard handling comes from the host input,
 * so the list never takes focus.
 * Renders a `<div>` element with `role="listbox"`.
 */
export const SuggestionMenuList = React.forwardRef<
  HTMLDivElement,
  SuggestionMenuListProps
>(function SuggestionMenuList(props, forwardedRef) {
  const { label = 'Suggestions', ...rest } = props
  return <PopupMenuList ref={forwardedRef} label={label} {...rest} />
})

export namespace SuggestionMenuList {
  export type Props = SuggestionMenuListProps
}
