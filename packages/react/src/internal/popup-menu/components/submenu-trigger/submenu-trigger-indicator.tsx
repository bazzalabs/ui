'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useSubmenuContext } from '../../contexts/submenu-context.js'
import { PopupMenuSubmenuTriggerDataAttributes } from './submenu-trigger.data-attrs.js'

export { PopupMenuSubmenuTriggerDataAttributes }

export interface PopupMenuSubmenuTriggerIndicatorState
  extends Record<string, unknown> {
  /**
   * Whether the submenu popup is open.
   */
  popupOpen: boolean
  /**
   * Whether the submenu owns keyboard focus.
   */
  popupFocused: boolean
}

// Custom mapping to convert state to kebab-case data attributes
const stateAttributesMapping = {
  popupOpen: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.popupOpen]: '' } : null,
  popupFocused: (value: unknown) =>
    value ? { [PopupMenuSubmenuTriggerDataAttributes.popupFocused]: '' } : null,
}

export interface PopupMenuSubmenuTriggerIndicatorProps
  extends ComponentProps<'span', PopupMenuSubmenuTriggerIndicator.State> {}

/**
 * An indicator element for submenu triggers that reflects the submenu's open and focus state.
 * Typically used to render a chevron or arrow icon.
 * Must be used within PopupMenu.SubmenuTrigger.
 * Renders a `<span>` element.
 */
export const PopupMenuSubmenuTriggerIndicator = React.forwardRef<
  HTMLSpanElement,
  PopupMenuSubmenuTriggerIndicator.Props
>(function PopupMenuSubmenuTriggerIndicator(props, forwardedRef) {
  const { render, className, style, children, ...rest } = props

  // Get submenu context for open state
  const { open, childSurfaceId } = useSubmenuContext()

  // Get focus owner store to check if this submenu owns focus
  const focusOwnerStore = useFocusOwner()
  const isPopupFocused = focusOwnerStore.useState('isOwner', childSurfaceId)

  const state: PopupMenuSubmenuTriggerIndicator.State = React.useMemo(
    () => ({
      popupOpen: open,
      popupFocused: isPopupFocused,
    }),
    [open, isPopupFocused],
  )

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'submenu-trigger-indicator')

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      'aria-hidden': true,
      className,
      style,
      children,
    },
    defaultTagName: 'span',
  })
})

export namespace PopupMenuSubmenuTriggerIndicator {
  export type State = PopupMenuSubmenuTriggerIndicatorState
  export interface Props extends PopupMenuSubmenuTriggerIndicatorProps {}
}
