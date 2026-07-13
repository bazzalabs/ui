'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { GroupContext, useSurfaceContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { PopupMenuGroupDataAttributes } from './group.data-attrs.js'

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
 * Hidden when no child items match the current filter.
 * Renders a `<div>` element with role="group".
 */
export const PopupMenuGroup = React.forwardRef<
  HTMLDivElement,
  PopupMenuGroup.Props
>(function PopupMenuGroup(props, forwardedRef) {
  const {
    forceMount = false,
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

  // Register group with store
  React.useEffect(() => {
    const unregister = store.registerGroup(groupId, internalRef)
    return unregister
  }, [groupId, store])

  React.useLayoutEffect(() => {
    if (!rowElement) return undefined
    return store.registerRow(groupId, rowElement, { kind: 'group' })
  }, [rowElement, groupId, store])

  // Check if group has visible items using selector
  const isGroupVisible = store.useState('isGroupVisible', groupId)
  const isVisible = forceMount || isGroupVisible
  const isFirstGroup = store.useState('isFirstGroup', groupId)
  const isLastGroup = store.useState('isLastGroup', groupId)
  const isFirstRow = store.useState('isFirstRow', groupId)
  const isLastRow = store.useState('isLastRow', groupId)

  // Provide group context to children
  const groupContextValue = React.useMemo(() => ({ groupId }), [groupId])

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
      // Using role="presentation" since we're inside a listbox.
      // The group is purely visual - items are the semantic options.
      role: 'presentation',
      className,
      style,
      children,
    },
    enabled: isVisible,
    defaultTagName: 'div',
  })

  if (!isVisible) {
    return null
  }

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
