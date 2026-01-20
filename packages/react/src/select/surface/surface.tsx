'use client'

import * as React from 'react'
import {
  PopupMenuSurface,
  type PopupMenuSurfaceProps,
} from '../../internal/popup-menu/index.js'
import { useSelectContext } from '../contexts/select-context.js'
import { useSelectPositionerContext } from '../contexts/select-positioner-context.js'
import { SelectSurfaceDataAttributes } from './surface.data-attrs.js'

export { SelectSurfaceDataAttributes }

export interface SelectSurfaceProps extends PopupMenuSurfaceProps {}

/**
 * Provides search context and manages item registration for Select.
 * Automatically configures `autoHighlightFirst` based on the Positioner's
 * `alignItemWithTrigger` prop - when active, highlights the selected item
 * instead of the first item.
 *
 * Place inside Select.Popup to enable search functionality.
 * Renders a `<div>` element.
 */
export const SelectSurface = React.forwardRef<
  HTMLDivElement,
  SelectSurface.Props
>(function SelectSurface(props, forwardedRef) {
  const { autoHighlightFirst: autoHighlightFirstProp, ...rest } = props

  const selectContext = useSelectContext()
  const positionerContext = useSelectPositionerContext()

  // Determine autoHighlightFirst value:
  // - If alignItemWithTrigger is active and there's a selected value,
  //   highlight the selected item instead of the first item
  // - Otherwise, use the prop value (defaulting to true)
  const autoHighlightFirst = React.useMemo(() => {
    // If user explicitly passed a value, respect it
    if (autoHighlightFirstProp !== undefined) {
      return autoHighlightFirstProp
    }

    // If alignItemWithTrigger is active and we have a selected value,
    // auto-highlight the selected item
    if (positionerContext?.alignItemWithTriggerActive) {
      // For single-select, use the value
      // For multi-select, use the first selected value (or fall back to true)
      if (selectContext.multiple) {
        return selectContext.values[0] ?? true
      }
      return selectContext.value || true
    }

    // Default behavior
    return true
  }, [
    autoHighlightFirstProp,
    positionerContext?.alignItemWithTriggerActive,
    selectContext.multiple,
    selectContext.value,
    selectContext.values,
  ])

  return (
    <PopupMenuSurface
      ref={forwardedRef}
      autoHighlightFirst={autoHighlightFirst}
      {...{ [SelectSurfaceDataAttributes.slot]: '' }}
      {...rest}
    />
  )
})

export namespace SelectSurface {
  export type State = PopupMenuSurface.State
  export interface Props extends SelectSurfaceProps {}
}
