'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import {
  resolveClassName,
  resolveStyle,
} from '../../../../utils/resolve-state-props.js'
import type { ComponentProps } from '../../../../utils/types.js'
import { GroupContext, useSurfaceContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { PopupMenuGroupDataAttributes } from './group.data-attrs.js'
import { useGroupVisibility } from './use-group-visibility.js'

export interface PopupMenuGroupState extends Record<string, unknown> {
  /**
   * Whether the group is hidden due to no matching items.
   */
  hidden: boolean
  /**
   * Present when this is the first visible group in the list.
   */
  firstGroup: boolean
  /**
   * Present when this is the last visible group in the list.
   */
  lastGroup: boolean
  first: boolean
  last: boolean
}

export interface PopupMenuGroupProps
  extends ComponentProps<'div', PopupMenuGroup.State> {
  /**
   * Whether to force render this group regardless of filter results.
   * @default false
   */
  forceMount?: boolean

  /**
   * The group's name, used as the description of its options
   * (`aria-describedby` on each one). Takes precedence over the text of a
   * `GroupLabel` inside the group, and stays even while no `GroupLabel` is
   * mounted, as in a windowed list scrolled past the label row.
   */
  label?: string

  children: React.ReactNode
}

const stateAttributesMapping = {
  first: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuGroupDataAttributes.first]: '' } : null,
  last: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuGroupDataAttributes.last]: '' } : null,
  firstGroup: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuGroupDataAttributes.firstGroup]: '' } : null,
  lastGroup: (value: unknown): Record<string, string> | null =>
    value ? { [PopupMenuGroupDataAttributes.lastGroup]: '' } : null,
}

/**
 * Groups related popup menu items together.
 * Hidden when no child items match the current filter. A hidden group stays
 * mounted (with the `hidden` attribute) so a later search can bring it back.
 * Renders a `<div>` element with role="presentation".
 */
export const PopupMenuGroup = React.forwardRef<
  HTMLDivElement,
  PopupMenuGroup.Props
>(function PopupMenuGroup(props, forwardedRef) {
  const {
    forceMount = false,
    label,
    render,
    className,
    style,
    children,
    ...rest
  } = props

  const { store } = useSurfaceContext()
  const groupId = React.useId()
  const internalRef = React.useRef<HTMLDivElement>(null)
  const [rowElement, setRowElement] = React.useState<HTMLElement | null>(null)

  const { isVisible, groupContextValue, descriptionElement } =
    useGroupVisibility({
      store,
      groupId,
      forceMount,
      ref: internalRef,
      rowElement,
      label,
    })
  const isFirstGroup = store.useState('isFirstGroup', groupId)
  const isLastGroup = store.useState('isLastGroup', groupId)
  const isFirstRow = store.useState('isFirstRow', groupId)
  const isLastRow = store.useState('isLastRow', groupId)

  const state: PopupMenuGroup.State = React.useMemo(
    () => ({
      hidden: !isVisible,
      firstGroup: isFirstGroup,
      lastGroup: isLastGroup,
      first: isFirstRow,
      last: isLastRow,
    }),
    [isVisible, isFirstGroup, isLastGroup, isFirstRow, isLastRow],
  )

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'group')

  const element = useRender({
    render,
    ref: [internalRef, setRowElement, forwardedRef],
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      // A listbox's options lose VoiceOver announcements inside
      // role="group", so the group is presentational and its options are
      // described by its hidden label node instead (ADR-0005).
      role: 'presentation',
      hidden: isVisible ? rest.hidden : true,
      className: resolveClassName(className, state),
      style: isVisible
        ? resolveStyle(style, state)
        : { ...resolveStyle(style, state), display: 'none' },
      children: (
        <>
          {descriptionElement}
          {children}
        </>
      ),
    },
    defaultTagName: 'div',
  })

  return (
    <GroupContext.Provider value={groupContextValue}>
      {element}
    </GroupContext.Provider>
  )
})

export namespace PopupMenuGroup {
  export type State = PopupMenuGroupState
  export interface Props extends PopupMenuGroupProps {}
}
