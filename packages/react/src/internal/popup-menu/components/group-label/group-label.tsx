'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { useGroupContext, useSurfaceContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { PopupMenuGroupLabelDataAttributes } from './group-label.data-attrs.js'

export interface PopupMenuGroupLabelState extends Record<string, unknown> {
  /**
   * Present when this label's parent group is the first visible group in the list.
   */
  firstGroup: boolean
  /**
   * Present when this label's parent group is the last visible group in the list.
   */
  lastGroup: boolean
}

export interface PopupMenuGroupLabelProps
  extends ComponentProps<'div', PopupMenuGroupLabel.State> {
  children: React.ReactNode
}

const stateAttributesMapping = {
  firstGroup: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuGroupLabelDataAttributes.firstGroup]: '' } : null,
  lastGroup: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuGroupLabelDataAttributes.lastGroup]: '' } : null,
}

/**
 * A label/heading for a group of popup menu items.
 * Renders a `<div>` element with role="presentation".
 */
export const PopupMenuGroupLabel = React.forwardRef<
  HTMLDivElement,
  PopupMenuGroupLabel.Props
>(function PopupMenuGroupLabel(props, forwardedRef) {
  const { render, className, style, children, ...rest } = props
  const { store } = useSurfaceContext()
  const groupContext = useGroupContext()
  const groupId = groupContext?.groupId ?? ''

  const isFirstGroup = store.useState('isFirstGroup', groupId)
  const isLastGroup = store.useState('isLastGroup', groupId)

  const state: PopupMenuGroupLabel.State = React.useMemo(
    () => ({
      firstGroup: isFirstGroup,
      lastGroup: isLastGroup,
    }),
    [isFirstGroup, isLastGroup],
  )

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'group-label')

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      // Presentation role - this is a visual label, not interactive
      role: 'presentation',
      // aria-hidden since the group label is decorative for screen readers
      // in the context of a listbox (options are the semantic elements)
      'aria-hidden': 'true',
      className,
      style,
      children,
    },
    defaultTagName: 'div',
  })
})

export namespace PopupMenuGroupLabel {
  export type State = PopupMenuGroupLabelState
  export interface Props extends PopupMenuGroupLabelProps {}
}
