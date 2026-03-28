'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { useMaybeComboboxContext } from '../../../../combobox/contexts/combobox-context.js'
import {
  resolveLabel,
  stringifyAsValue,
} from '../../../../utils/resolve-value-label.js'
import type { ComponentProps } from '../../../../utils/types.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { usePopupMenuContext } from '../../contexts/popup-menu-context.js'
import { PopupMenuIconDataAttributes } from './icon.data-attrs.js'

export { PopupMenuIconDataAttributes }

export interface PopupMenuIconState extends Record<string, unknown> {
  /**
   * Whether the popup is currently open.
   */
  open: boolean
}

export interface PopupMenuIconProps
  extends ComponentProps<'span', PopupMenuIcon.State> {}

const stateAttributesMapping = {
  open: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuIconDataAttributes.open]: '' } : null,
}

/**
 * An icon that indicates the trigger opens a popup.
 * Typically used inside the trigger to show a chevron or dropdown arrow.
 * Renders a `<span>` element.
 */
export const PopupMenuIcon = React.forwardRef<
  HTMLSpanElement,
  PopupMenuIcon.Props
>(function PopupMenuIcon(props, forwardedRef) {
  const {
    render,
    className,
    style,
    children,
    onPointerDown,
    onClick,
    ...rest
  } = props

  const { store } = usePopupMenuContext()
  const open = store.useState('open')

  // Check if inside a Combobox to apply special focus handling
  const comboboxContext = useMaybeComboboxContext()

  const state: PopupMenuIcon.State = React.useMemo(() => ({ open }), [open])

  // Prevent pointer down from stealing focus from the input (Combobox only)
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLSpanElement>) => {
      if (comboboxContext) {
        event.preventDefault()
      }
      onPointerDown?.(event)
    },
    [comboboxContext, onPointerDown],
  )

  // Handle click to toggle the combobox (Combobox only)
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      onClick?.(event)
      if (event.defaultPrevented) return

      if (comboboxContext) {
        if (open) {
          comboboxContext.closeCombobox()
        } else {
          // Pre-set the input value BEFORE opening to avoid the empty intermediate state
          // This mirrors what the input click handler does
          const hasValue = comboboxContext.multiple
            ? comboboxContext.values.length > 0
            : comboboxContext.value != null

          if (hasValue && !comboboxContext.multiple) {
            // Serialize the value to a string key for registry lookup
            const valueKey = stringifyAsValue(
              comboboxContext.value,
              comboboxContext.itemToStringValue,
            )
            // Get the label from the registry or resolve from the value
            const registryText = comboboxContext.itemTextRegistry.get(valueKey)
            const labelValue =
              registryText ??
              resolveLabel(
                comboboxContext.value,
                comboboxContext.itemToStringLabel,
              )
            comboboxContext.onInputValueChange(labelValue)
          }

          comboboxContext.openCombobox()
        }
      }
    },
    [onClick, comboboxContext, open],
  )

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'icon')

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      className,
      style,
      children,
      onPointerDown: handlePointerDown,
      onClick: handleClick,
    },
    defaultTagName: 'span',
  })
})

export namespace PopupMenuIcon {
  export type State = PopupMenuIconState
  export interface Props extends PopupMenuIconProps {}
}
