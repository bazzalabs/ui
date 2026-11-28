'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import {
  resolveClassName,
  resolveStyle,
} from '../../../../utils/resolve-state-props.js'
import type { ComponentProps } from '../../../../utils/types.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useMenuSurfaceTier } from '../../contexts/surface-tier-context.js'
import { useMenuElement } from '../../hooks/use-menu-element.js'
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
  const { render, className, style, children, ...rest } = props

  const { store } = useMenuSurfaceTier()
  const open = store.useState('open')

  const state: PopupMenuIcon.State = React.useMemo(() => ({ open }), [open])

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'icon')

  // The icon toggles the popup (Combobox.Icon), so a press on it is a press on
  // a trigger, not an outside press.
  const triggerRef = useMenuElement('trigger')

  return useRender({
    render,
    ref: [forwardedRef, triggerRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      className: resolveClassName(className, state),
      style: resolveStyle(style, state),
      children,
    },
    defaultTagName: 'span',
  })
})

export namespace PopupMenuIcon {
  export type State = PopupMenuIconState
  export interface Props extends PopupMenuIconProps {}
}
