'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import {
  resolveClassName,
  resolveStyle,
} from '../../../../utils/resolve-state-props.js'
import type { ComponentProps } from '../../../../utils/types.js'
import { useGroupContext, useSurfaceContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { PopupMenuGroupLabelDataAttributes } from './group-label.data-attrs.js'

export interface PopupMenuGroupLabelState extends Record<string, unknown> {
  /**
   * Present when this label is the first row in the list.
   */
  first: boolean
  /**
   * Present when this label is the last row in the list.
   */
  last: boolean
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
  first: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuGroupLabelDataAttributes.first]: '' } : null,
  last: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuGroupLabelDataAttributes.last]: '' } : null,
  firstGroup: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuGroupLabelDataAttributes.firstGroup]: '' } : null,
  lastGroup: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuGroupLabelDataAttributes.lastGroup]: '' } : null,
}

/**
 * A label/heading for a group of popup menu items.
 * Renders a `<div>` element with role="presentation" and `aria-hidden`: its
 * text names the group through the group's hidden description node, which
 * every option in the group points `aria-describedby` at.
 *
 * The group keeps the last text its label rendered after the label unmounts,
 * so the options of a windowed list stay described once the label row scrolls
 * away. A label that renders empty text clears the name. To set or change the
 * name independently of the label row, pass `label` to the group.
 */
export const PopupMenuGroupLabel = React.forwardRef<
  HTMLDivElement,
  PopupMenuGroupLabel.Props
>(function PopupMenuGroupLabel(props, forwardedRef) {
  const { render, className, style, children, ...rest } = props
  const { store } = useSurfaceContext()
  const groupContext = useGroupContext()
  const groupId = groupContext?.groupId ?? ''

  const storeFirstGroup = store.useState('isFirstGroup', groupId)
  const storeLastGroup = store.useState('isLastGroup', groupId)
  const storeFirstRow = store.useState('isFirstRow', groupId)
  const isFirstGroup = groupContext?.positional?.firstGroup ?? storeFirstGroup
  const isLastGroup = groupContext?.positional?.lastGroup ?? storeLastGroup
  const isFirstRow = groupContext?.positional?.first ?? storeFirstRow
  // No store fallback: the store can only say whether the *group* is the last
  // row, and a label is followed by its own items — so it is the last row only
  // when a consumer flattens the list and declares it (e.g. virtualized rows).
  const isLastRow = groupContext?.positional?.last ?? false

  const state: PopupMenuGroupLabel.State = React.useMemo(
    () => ({
      first: isFirstRow,
      last: isLastRow,
      firstGroup: isFirstGroup,
      lastGroup: isLastGroup,
    }),
    [isFirstRow, isLastRow, isFirstGroup, isLastGroup],
  )

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'group-label')

  const isHidden = groupContext?.hidden ?? false

  // Give the group this label's text for its hidden description node, which
  // names the group's options (ADR-0005). Only while the element is mounted:
  // the group keeps the text after the label hides or unmounts.
  const labelRef = React.useRef<HTMLDivElement>(null)
  const registerLabel = groupContext?.registerLabel
  // biome-ignore lint/correctness/useExhaustiveDependencies: children and isHidden are intentional trigger deps — re-read the text when the label's content changes or it mounts its element again
  React.useLayoutEffect(() => {
    const labelElement = labelRef.current
    if (!labelElement) return
    registerLabel?.(labelElement.textContent?.trim() ?? '')
  }, [registerLabel, children, isHidden])

  const element = useRender({
    render,
    ref: [labelRef, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      // Presentation role - this is a visual label, not interactive
      role: 'presentation',
      // aria-hidden: the group's hidden description node carries this text
      // to its options (ADR-0005), so reading the label too would repeat it.
      'aria-hidden': 'true',
      className: resolveClassName(className, state),
      style: resolveStyle(style, state),
      children,
    },
    enabled: !isHidden,
    defaultTagName: 'div',
  })

  if (isHidden) return null

  return element
})

export namespace PopupMenuGroupLabel {
  export type State = PopupMenuGroupLabelState
  export interface Props extends PopupMenuGroupLabelProps {}
}
