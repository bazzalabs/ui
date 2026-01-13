'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { useMaybeComboboxContext } from '../../../../combobox/contexts/combobox-context.js'
import type { ComponentProps } from '../../../../utils/types.js'
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
  extends ComponentProps<'span', PopupMenuIconState> {}

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
  PopupMenuIconProps
>(function PopupMenuIcon(props, forwardedRef) {
  const { render, className, style, children, onPointerDown, ...rest } = props

  const { store } = usePopupMenuContext()
  const open = store.useState('open')

  // Check if inside a Combobox to apply special focus handling
  const comboboxContext = useMaybeComboboxContext()

  const state: PopupMenuIconState = React.useMemo(() => ({ open }), [open])

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

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      className,
      style,
      children,
      onPointerDown: handlePointerDown,
    },
    defaultTagName: 'span',
  })
})

export namespace PopupMenuIcon {
  export type State = PopupMenuIconState
  export interface Props extends PopupMenuIconProps {}
}
