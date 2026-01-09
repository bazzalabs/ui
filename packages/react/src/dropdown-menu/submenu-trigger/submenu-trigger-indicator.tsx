'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { useFocusOwner } from '../contexts/focus-owner-context.js'
import { useSubmenuContext } from '../contexts/submenu-context.js'
import { DropdownMenuSubmenuTriggerDataAttributes } from './submenu-trigger.data-attrs.js'

export interface DropdownMenuSubmenuTriggerIndicatorState
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
    value ? { [DropdownMenuSubmenuTriggerDataAttributes.popupOpen]: '' } : null,
  popupFocused: (value: unknown) =>
    value
      ? { [DropdownMenuSubmenuTriggerDataAttributes.popupFocused]: '' }
      : null,
}

export interface DropdownMenuSubmenuTriggerIndicatorProps
  extends ComponentProps<'span', DropdownMenuSubmenuTriggerIndicatorState> {}

/**
 * An indicator element for submenu triggers that reflects the submenu's open and focus state.
 * Typically used to render a chevron or arrow icon.
 * Must be used within DropdownMenu.SubmenuTrigger.
 * Renders a `<span>` element.
 */
export const DropdownMenuSubmenuTriggerIndicator = React.forwardRef<
  HTMLSpanElement,
  DropdownMenuSubmenuTriggerIndicatorProps
>(function DropdownMenuSubmenuTriggerIndicator(props, forwardedRef) {
  const { render, className, style, children, ...rest } = props

  // Get submenu context for open state
  const { open, childSurfaceId } = useSubmenuContext()

  // Get focus owner store to check if this submenu owns focus
  const focusOwnerStore = useFocusOwner()
  const isPopupFocused = focusOwnerStore.useState('isOwner', childSurfaceId)

  const state: DropdownMenuSubmenuTriggerIndicatorState = React.useMemo(
    () => ({
      popupOpen: open,
      popupFocused: isPopupFocused,
    }),
    [open, isPopupFocused],
  )

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      'aria-hidden': true,
      className,
      style,
      children,
    },
    defaultTagName: 'span',
  })
})

export namespace DropdownMenuSubmenuTriggerIndicator {
  export type State = DropdownMenuSubmenuTriggerIndicatorState
  export interface Props extends DropdownMenuSubmenuTriggerIndicatorProps {}
}
