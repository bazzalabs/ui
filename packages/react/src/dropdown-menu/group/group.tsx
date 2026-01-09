'use client'

import * as React from 'react'
import { GroupContext, useSurfaceContext } from '../contexts/surface-context.js'

export interface DropdownMenuGroupProps
  extends React.ComponentPropsWithoutRef<'div'> {
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
  const { forceMount = false, children, ...rest } = props

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

  if (!isVisible) {
    return null
  }

  return (
    <GroupContext.Provider value={groupContextValue}>
      <div
        ref={forwardedRef}
        {...rest}
        // Using role="presentation" since we're inside a listbox.
        // The group is purely visual - items are the semantic options.
        role="presentation"
        data-hidden={!isVisible ? '' : undefined}
      >
        {children}
      </div>
    </GroupContext.Provider>
  )
})

export namespace DropdownMenuGroup {
  export interface Props extends DropdownMenuGroupProps {}
}
