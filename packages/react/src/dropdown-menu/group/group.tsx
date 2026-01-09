'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { GroupContext, useSurfaceContext } from '../contexts/surface-context.js'

export interface DropdownMenuGroupState extends Record<string, unknown> {
  /**
   * Whether the group is hidden due to no matching items.
   */
  hidden: boolean
}

export interface DropdownMenuGroupProps
  extends ComponentProps<'div', DropdownMenuGroupState> {
  /**
   * Whether to force render this group regardless of filter results.
   * @default false
   */
  forceMount?: boolean

  children: React.ReactNode
}

/**
 * Groups related dropdown menu items together.
 * Hidden when no child items match the current filter.
 * Renders a `<div>` element with role="group".
 */
export const DropdownMenuGroup = React.forwardRef<
  HTMLDivElement,
  DropdownMenuGroupProps
>(function DropdownMenuGroup(props, forwardedRef) {
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

  // Register group with store
  React.useEffect(() => {
    const unregister = store.registerGroup(groupId)
    return unregister
  }, [groupId, store])

  // Check if group has visible items using selector
  const isGroupVisible = store.useState('isGroupVisible', groupId)
  const isVisible = forceMount || isGroupVisible

  // Provide group context to children
  const groupContextValue = React.useMemo(() => ({ groupId }), [groupId])

  const state: DropdownMenuGroupState = React.useMemo(
    () => ({
      hidden: !isVisible,
    }),
    [isVisible],
  )

  const element = useRender({
    render,
    ref: forwardedRef,
    state,
    props: {
      ...rest,
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

export namespace DropdownMenuGroup {
  export type State = DropdownMenuGroupState
  export interface Props extends DropdownMenuGroupProps {}
}
