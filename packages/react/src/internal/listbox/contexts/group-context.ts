'use client'

import * as React from 'react'

// ============================================================================
// Group Context (for items to know their parent group)
// ============================================================================

export interface GroupContextValue {
  groupId: string
}

const GroupContext = React.createContext<GroupContextValue | null>(null)

export function useGroupContext(): GroupContextValue | null {
  return React.useContext(GroupContext)
}

export { GroupContext }
