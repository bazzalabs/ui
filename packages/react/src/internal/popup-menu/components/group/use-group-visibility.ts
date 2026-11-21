'use client'

import * as React from 'react'
import {
  type GroupContextValue,
  type ListboxStore,
  useGroupContext,
} from '../../../listbox/index.js'

interface UseGroupVisibilityParams {
  store: ListboxStore
  groupId: string
  forceMount: boolean
  ref: React.RefObject<HTMLElement | null>
  rowElement: HTMLElement | null
}

interface UseGroupVisibilityReturn {
  isVisible: boolean
  /** The context to provide to the group's children. */
  groupContextValue: GroupContextValue
}

/**
 * Registers a group with the store and works out whether it shows.
 *
 * A group a search hides keeps its children mounted, so its items stay
 * registered and a later search can bring it back. The group renders its
 * element hidden, stops counting as a row, and tells its children through
 * `GroupContext.hidden` to render nothing. A group inside a hidden group is
 * hidden too.
 */
export function useGroupVisibility(
  params: UseGroupVisibilityParams,
): UseGroupVisibilityReturn {
  const { store, groupId, forceMount, ref, rowElement } = params
  const parentGroup = useGroupContext()
  const parentGroupId = parentGroup?.groupId
  const isParentHidden = parentGroup?.hidden ?? false

  React.useEffect(
    () => store.registerGroup(groupId, ref, parentGroupId),
    [groupId, ref, parentGroupId, store],
  )

  const isGroupVisible = store.useState('isGroupVisible', groupId)
  const isVisible = !isParentHidden && (forceMount || isGroupVisible)

  React.useLayoutEffect(() => {
    if (!rowElement || !isVisible) return undefined
    return store.registerRow(groupId, rowElement, { kind: 'group' })
  }, [rowElement, isVisible, groupId, store])

  const groupContextValue = React.useMemo(
    () => ({ groupId, hidden: !isVisible }),
    [groupId, isVisible],
  )

  return { isVisible, groupContextValue }
}
