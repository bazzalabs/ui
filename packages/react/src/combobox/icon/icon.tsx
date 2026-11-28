'use client'

import * as React from 'react'
import {
  PopupMenuIcon,
  type PopupMenuIconState,
} from '../../internal/popup-menu/index.js'
import { useMenuSurfaceTier } from '../../internal/popup-menu/members.js'
import {
  resolveLabel,
  stringifyAsValue,
} from '../../utils/resolve-value-label.js'
import type { ComponentProps } from '../../utils/types.js'
import { useComposedHandler } from '../../utils/use-part.js'
import { useComboboxContext } from '../contexts/combobox-context.js'

export interface ComboboxIconState extends PopupMenuIconState {}

export interface ComboboxIconProps
  extends ComponentProps<'span', ComboboxIcon.State> {}

/**
 * An icon that opens and closes the combobox popup when clicked, without
 * taking focus from the input.
 * Renders a `<span>` element.
 */
export const ComboboxIcon = React.forwardRef<
  HTMLSpanElement,
  ComboboxIcon.Props
>(function ComboboxIcon(props, forwardedRef) {
  const { onPointerDown, onClick, ...rest } = props

  const comboboxContext = useComboboxContext()
  const { store } = useMenuSurfaceTier()
  const open = store.useState('open')

  // Prevent pointer down from stealing focus from the input
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLSpanElement>) => {
      event.preventDefault()
      onPointerDown?.(event)
    },
    [onPointerDown],
  )

  // After the consumer's handler (`useComposedHandler`, below), which
  // `preventDefault()` or `preventBaseUIHandler()` in skips it.
  const handleOwnClick = React.useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      if (event.defaultPrevented) return

      if (open) {
        comboboxContext.closeCombobox()
        return
      }

      // Pre-set the input value BEFORE opening to avoid the empty intermediate state
      // This mirrors what the input click handler does
      if (!comboboxContext.multiple && comboboxContext.value != null) {
        // Serialize the value to a string key for registry lookup
        const valueKey = stringifyAsValue(
          comboboxContext.value,
          comboboxContext.itemToStringValue,
        )
        // Get the label from the registry or resolve from the value
        const registryText = comboboxContext.itemTextRegistry.get(valueKey)
        const labelValue =
          registryText ??
          resolveLabel(comboboxContext.value, comboboxContext.itemToStringLabel)
        comboboxContext.onInputValueChange(labelValue)
      }

      comboboxContext.openCombobox()
    },
    [comboboxContext, open],
  )
  const handleClick = useComposedHandler(onClick, handleOwnClick)

  return (
    <PopupMenuIcon
      {...rest}
      ref={forwardedRef}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    />
  )
})

export namespace ComboboxIcon {
  export type State = ComboboxIconState
  export interface Props extends ComboboxIconProps {}
}
