'use client'

import * as React from 'react'
import {
  PopupMenuSurface,
  type PopupMenuSurfaceProps,
} from '../../internal/popup-menu/index.js'
import { stringifyAsValue } from '../../utils/resolve-value-label.js'
import { useSelectContext } from '../contexts/select-context.js'
import { useSelectPositionerContext } from '../contexts/select-positioner-context.js'
import { SelectSurfaceDataAttributes } from './surface.data-attrs.js'

export { SelectSurfaceDataAttributes }

export interface SelectSurfaceProps
  extends Omit<PopupMenuSurfaceProps, 'autoHighlightFirst'> {
  /**
   * Controls auto-highlighting behavior when the select opens.
   * - `true`: highlight the first item (default when alignItemWithTrigger is inactive)
   * - `false`: don't auto-highlight any item
   * - `'selected'`: highlight the currently selected item, or first item if none selected
   * - `string`: highlight the item with this specific value
   *
   * Note: When the Positioner's `alignItemWithTrigger` is active and this prop
   * is not explicitly set, the selected item is automatically highlighted.
   *
   * @default true (or selected value when alignItemWithTrigger is active)
   */
  autoHighlightFirst?: boolean | 'selected' | string
}

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
  // - 'selected': use the current selected value (falls back to true if no selection)
  // - If alignItemWithTrigger is active and prop is not set, highlight the selected item
  // - Otherwise, use the prop value (defaulting to true)
  const autoHighlightFirst = React.useMemo(() => {
    // Helper to serialize a value to a string for highlighting
    // Returns true (highlight first) when there's no meaningful value
    const serializeValue = (value: unknown): string | true => {
      if (value == null || value === '') return true
      return stringifyAsValue(value, selectContext.itemToStringValue)
    }

    // Handle 'selected' shorthand - resolve to actual selected value
    if (autoHighlightFirstProp === 'selected') {
      // For single-select, use the selected value
      // For multi-select, use the first selected value
      const selectedValue = selectContext.multiple
        ? selectContext.values[0]
        : selectContext.value

      // If there's a selected value, serialize and use for highlighting
      return serializeValue(selectedValue)
    }

    // If user explicitly passed a value (other than 'selected'), respect it
    if (autoHighlightFirstProp !== undefined) {
      return autoHighlightFirstProp
    }

    // If alignItemWithTrigger is active and we have a selected value,
    // auto-highlight the selected item
    if (positionerContext?.alignItemWithTriggerActive) {
      // For single-select, use the value
      // For multi-select, use the first selected value (or fall back to true)
      const selectedValue = selectContext.multiple
        ? selectContext.values[0]
        : selectContext.value
      return serializeValue(selectedValue)
    }

    // Default behavior
    return true
  }, [
    autoHighlightFirstProp,
    positionerContext?.alignItemWithTriggerActive,
    selectContext.multiple,
    selectContext.value,
    selectContext.values,
    selectContext.itemToStringValue,
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
