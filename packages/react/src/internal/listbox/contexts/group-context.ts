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
}

const GroupContext = React.createContext<GroupContextValue | null>(null)

export function useGroupContext(): GroupContextValue | null {
  return React.useContext(GroupContext)
}

export { GroupContext }
