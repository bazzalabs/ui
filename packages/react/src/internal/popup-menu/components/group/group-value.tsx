'use client'

import * as React from 'react'
import {
  GroupContext,
  type GroupContextValue,
  type GroupPositional,
  useGroupContext,
} from '../../../listbox/index.js'

export interface PopupMenuGroupValueProps {
  /** Group id items register under. Omit for ungrouped rows that only need positional flags. */
  groupId?: string
  /** Positional flags for this row; each defined flag overrides the store-derived value. */
  positional?: GroupPositional
  children: React.ReactNode
}

/**
 * Headless provider for group membership and positional state.
 * Renders no DOM. Use to wrap individual rows in virtualized lists where
 * the store cannot derive position from mounted order.
 */
export function PopupMenuGroupValue(props: PopupMenuGroupValueProps) {
  const { groupId, positional, children } = props
  // Rows inside a group a search hides stay hidden.
  const isParentHidden = useGroupContext()?.hidden
  const contextValue: GroupContextValue = React.useMemo(
    () => ({ groupId, positional, hidden: isParentHidden }),
    [groupId, positional, isParentHidden],
  )
  return (
    <GroupContext.Provider value={contextValue}>
      {children}
    </GroupContext.Provider>
  )
}

export namespace PopupMenuGroupValue {
  export interface Props extends PopupMenuGroupValueProps {}
}
