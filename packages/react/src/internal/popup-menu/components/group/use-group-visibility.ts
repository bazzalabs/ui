'use client'

import * as React from 'react'
import { useMaybeCollectionRows } from '../../../listbox/contexts/collection-row-context.js'
import {
  type GroupContextValue,
  type ListboxStore,
  useGroupContext,
} from '../../../listbox/index.js'
import { useGroupDescription } from './group-description.js'

interface UseGroupVisibilityParams {
  store: ListboxStore
  groupId: string
  forceMount: boolean
  ref: React.RefObject<HTMLElement | null>
  rowElement: HTMLElement | null
  /** The group's name, which describes its options. */
  label: string | undefined
}

interface UseGroupVisibilityReturn {
  isVisible: boolean
  /** The context to provide to the group's children. */
  groupContextValue: GroupContextValue
  /** The group's hidden description node, rendered inside its element. */
  descriptionElement: React.ReactNode
}

/**
 * Registers a group with the store and works out whether it shows.
 *
 * A group a search hides keeps its children mounted, so its items stay
 * registered and a later search can bring it back. The group renders its
 * element hidden, stops counting as a row, and tells its children through
 * `GroupContext.hidden` to render nothing. A group inside a hidden group is
 * hidden too.
 *
 * It also names the group with `useGroupDescription`: the context carries the
 * description id its options point `aria-describedby` at (ADR-0005).
 */
export function useGroupVisibility(
  params: UseGroupVisibilityParams,
): UseGroupVisibilityReturn {
  const { store, groupId, forceMount, ref, rowElement, label } = params
  const parentGroup = useGroupContext()
  const parentGroupId = parentGroup?.groupId
  const isParentHidden = parentGroup?.hidden ?? false

  React.useEffect(
    () => store.registerGroup(groupId, ref, parentGroupId),
    [groupId, ref, parentGroupId, store],
  )

  const isGroupVisible = store.useState('isGroupVisible', groupId)
  // Under a data-first list, which mounts only the groups it shows, a group
  // is visible from its first commit, before the list publishes its rows.
  const inCollection = useMaybeCollectionRows()?.store === store
  const isVisible =
    !isParentHidden && (forceMount || inCollection || isGroupVisible)

  React.useLayoutEffect(() => {
    if (!rowElement || !isVisible) return undefined
    return store.registerRow(groupId, rowElement, { kind: 'group' })
  }, [rowElement, isVisible, groupId, store])

  const { descriptionId, registerLabel, element } = useGroupDescription(label)

  const groupContextValue = React.useMemo(
    () => ({ groupId, hidden: !isVisible, descriptionId, registerLabel }),
    [groupId, isVisible, descriptionId, registerLabel],
  )

  return { isVisible, groupContextValue, descriptionElement: element }
}
