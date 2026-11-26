'use client'

import * as React from 'react'
import {
  GroupContext,
  type GroupContextValue,
  useGroupContext,
} from '../../listbox/index.js'
import { useGroupDescription } from '../components/group/group-description.js'

export interface DataGroupContainerProps {
  /**
   * The def's `label`. When it's missing, a `GroupLabel` that `renderLabel`
   * renders names the group with its text instead.
   */
  label: string | undefined
  children: React.ReactNode
}

/**
 * The default container of a data-first group, radio group or checkbox group.
 * Presentational, as every group kind is (ADR-0005): its options are named by
 * a hidden description node holding the group's label.
 */
export function DataGroupContainer(props: DataGroupContainerProps) {
  const { label, children } = props
  const parentGroup = useGroupContext()
  const description = useGroupDescription(label)
  const contextValue: GroupContextValue = React.useMemo(
    () => ({
      ...parentGroup,
      descriptionId: description.descriptionId,
      registerLabel: description.registerLabel,
    }),
    [parentGroup, description.descriptionId, description.registerLabel],
  )

  return (
    <div role="presentation">
      {description.element}
      <GroupContext.Provider value={contextValue}>
        {children}
      </GroupContext.Provider>
    </div>
  )
}
