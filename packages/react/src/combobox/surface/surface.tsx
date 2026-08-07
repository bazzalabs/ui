'use client'

import * as React from 'react'
import {
  PopupMenuSurface,
  type PopupMenuSurfaceProps,
} from '../../internal/popup-menu/index.js'
import { stringifyAsValue } from '../../utils/resolve-value-label.js'
import { useComboboxContext } from '../contexts/combobox-context.js'
import { ComboboxSurfaceDataAttributes } from './surface.data-attrs.js'

export { ComboboxSurfaceDataAttributes }

export interface ComboboxSurfaceProps
  extends Omit<PopupMenuSurfaceProps, 'autoHighlightFirst'> {
  /**
   * Controls auto-highlighting behavior when the combobox opens.
   * - `true`: highlight the first item (default)
   * - `false`: don't auto-highlight any item
   * - `'selected'`: highlight the currently selected item, or first item if none selected
   * - `string`: highlight the item with this specific value
   * @default true
   */
  autoHighlightFirst?: boolean | 'selected' | string

  /**
   * Whether to clear the search query when the combobox closes.
   * - `true`: clear immediately when the combobox closes (default)
   * - `false`: preserve search when the combobox closes
   * - `'after-exit'`: clear after exit animation completes
   * @default true
   */
  clearSearchOnClose?: boolean | 'after-exit'
}

/**
 * Provides search context and manages item registration for Combobox.
 * Automatically syncs the search state with the combobox's input value.
 *
 * Place inside Combobox.Popup to enable search functionality.
 * Renders a `<div>` element.
 */
export const ComboboxSurface = React.forwardRef<
  HTMLDivElement,
  ComboboxSurface.Props
>(function ComboboxSurface(props, forwardedRef) {
  const {
    autoHighlightFirst: autoHighlightFirstProp,
    clearSearchOnClose = true,
    search: searchProp,
    onSearchChange: onSearchChangeProp,
    onPointerMove: onPointerMoveProp,
    ...rest
  } = props

  const comboboxContext = useComboboxContext()

  // Focus the input when cursor moves inside the popup
  // This allows users to immediately type to filter after hovering
  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMoveProp?.(event)

      // Focus the input if it's not already focused
      const input = comboboxContext.inputRef.current
      if (input && document.activeElement !== input) {
        input.focus()
      }
    },
    [onPointerMoveProp, comboboxContext.inputRef],
  )

  // Resolve autoHighlightFirst:
  // - 'selected': use the current selected value (falls back to true if no selection)
  // - true/false/string: pass through as-is
  // Default to true (highlight first item)
  const autoHighlightFirst = React.useMemo(() => {
    const prop = autoHighlightFirstProp ?? true

    if (prop === 'selected') {
      // For single-select, use the selected value
      // For multi-select, use the first selected value
      const selectedValue = comboboxContext.multiple
        ? comboboxContext.values[0]
        : comboboxContext.value

      // If there's a selected value, serialize it to a string and use for highlighting
      if (selectedValue != null) {
        return stringifyAsValue(
          selectedValue,
          comboboxContext.itemToStringValue,
        )
      }
      // Otherwise highlight first
      return true
    }

    return prop
  }, [
    autoHighlightFirstProp,
    comboboxContext.multiple,
    comboboxContext.value,
    comboboxContext.values,
    comboboxContext.itemToStringValue,
  ])

  // Sync search with combobox's input value based on filter mode:
  // - 'active': use inputValue (normal filtering)
  // - 'showAll': use '' (show all items when opened with selected value)
  // - 'frozen': use frozen search value (during close animation)
  const { filterMode } = comboboxContext
  const search =
    searchProp ??
    (filterMode.type === 'active'
      ? comboboxContext.inputValue
      : filterMode.type === 'showAll'
        ? ''
        : filterMode.search)

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
      clearSearchOnClose={clearSearchOnClose}
      search={search}
      onSearchChange={handleSearchChange}
      onPointerMove={handlePointerMove}
      // Skip auto-focus because the Combobox.Input is outside the popup
      // and should retain focus while the dropdown is open
      skipAutoFocus
      {...{ [ComboboxSurfaceDataAttributes.slot]: '' }}
      {...rest}
    />
  )
})

export namespace ComboboxSurface {
  export type State = PopupMenuSurface.State
  export interface Props extends ComboboxSurfaceProps {}
}
