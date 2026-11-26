'use client'

import * as React from 'react'

// ============================================================================
// Group Context (for items to know their parent group)
// ============================================================================

export interface GroupPositional {
  first?: boolean
  last?: boolean
  firstInGroup?: boolean
  lastInGroup?: boolean
  firstGroup?: boolean
  lastGroup?: boolean
}

export interface GroupContextValue {
  groupId?: string
  positional?: GroupPositional
  /**
   * True while a search hides the group. Its parts stay mounted, so its items
   * stay registered and a later search can bring the group back, but they
   * render nothing.
   */
  hidden?: boolean
  /**
   * The id the group's options point `aria-describedby` at, so the group is
   * named without `role="group"` (ADR-0005): the group's own hidden
   * description node, else the nearest labelled ancestor group's. Unset when
   * neither has a label. Every surface starts with no group, so it never
   * reaches a submenu's rows.
   */
  descriptionId?: string
  /**
   * Tells the group its `GroupLabel`'s text, so it can describe its options.
   * The group keeps the last text it was given, so the description outlives a
   * label row that unmounts (a windowed list); `''` clears the name. A group's
   * `label` prop takes precedence over it.
   */
  registerLabel?: (text: string) => void
}

const GroupContext = React.createContext<GroupContextValue | null>(null)

export function useGroupContext(): GroupContextValue | null {
  return React.useContext(GroupContext)
}

export { GroupContext }
