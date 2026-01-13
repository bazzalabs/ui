'use client'

import * as React from 'react'
import {
  PopupMenuSurface,
  type PopupMenuSurfaceProps,
} from '../../internal/popup-menu/index.js'
import { useComboboxContext } from '../contexts/combobox-context.js'

export interface ComboboxSurfaceProps extends PopupMenuSurfaceProps {}

/**
 * Provides search context and manages item registration for Combobox.
 * Automatically syncs the search state with the combobox's input value.
 *
 * Place inside Combobox.Popup to enable search functionality.
 * Renders a `<div>` element.
 */
export const ComboboxSurface = React.forwardRef<
  HTMLDivElement,
  ComboboxSurfaceProps
>(function ComboboxSurface(props, forwardedRef) {
  const {
    autoHighlightFirst: autoHighlightFirstProp,
    search: searchProp,
    onSearchChange: onSearchChangeProp,
    ...rest
  } = props

  const comboboxContext = useComboboxContext()

  // Always highlight the first item by default
  // Users can override this with the autoHighlightFirst prop
  const autoHighlightFirst = autoHighlightFirstProp ?? true

  // Sync search with combobox's input value
  // When skipFiltering is true, pass empty string to show all items
  const search =
    searchProp ??
    (comboboxContext.skipFiltering ? '' : comboboxContext.inputValue)

  // Sync search changes back to combobox
  const handleSearchChange = React.useCallback(
    (value: string) => {
      comboboxContext.onInputValueChange(value)
      onSearchChangeProp?.(value)
    },
    [comboboxContext, onSearchChangeProp],
  )

  return (
    <PopupMenuSurface
      ref={forwardedRef}
      autoHighlightFirst={autoHighlightFirst}
      search={search}
      onSearchChange={handleSearchChange}
      // Skip auto-focus because the Combobox.Input is outside the popup
      // and should retain focus while the dropdown is open
      skipAutoFocus
      {...rest}
    />
  )
})

export namespace ComboboxSurface {
  export type State = PopupMenuSurface.State
  export interface Props extends ComboboxSurfaceProps {}
}
