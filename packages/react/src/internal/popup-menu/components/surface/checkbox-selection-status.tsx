'use client'

import * as React from 'react'
import { LiveStatusRegion } from '../../../../utils/live-status-region.js'
import { useMaybeCheckboxSelection } from '../../contexts/checkbox-selection-context.js'
import { useMaybeStore } from '../../hooks/use-maybe-store.js'
import type { CheckboxSelectionState } from '../../store/CheckboxSelectionStore.js'

const announcementOf = (state: CheckboxSelectionState) => state.announcement

export interface PopupMenuCheckboxSelectionStatusProps {
  /** The Surface, which claims the selection: a new one starts it fresh. */
  owner: object
  /** The consumer's text for a commit's announcement. */
  formatAnnouncement: ((count: number, checked: boolean) => string) | undefined
}

/**
 * Visually hidden polite status region that announces range and drag
 * selection commits. Rendered once per surface, present before any gesture.
 * It also ties the surface's checkbox selection to its Surface once the
 * first checkbox row has made it: the claim, the open-state subscription and
 * the announcement text. It unmounts while a subpage hides the surface's
 * content, so the Surface itself drops the announcement then.
 */
export function PopupMenuCheckboxSelectionStatus(
  props: PopupMenuCheckboxSelectionStatusProps,
) {
  const { owner, formatAnnouncement } = props
  const selection = useMaybeCheckboxSelection()

  // Claimed as the Surface mounts, which starts the selection fresh for a
  // new Surface and keeps it for this one shown again.
  React.useLayoutEffect(() => selection?.claim(owner), [selection, owner])
  React.useEffect(() => selection?.attach(), [selection])
  React.useEffect(() => {
    selection?.setAnnouncementFormatter(formatAnnouncement)
  }, [selection, formatAnnouncement])

  const announcement = useMaybeStore(selection, announcementOf, null)
  return <LiveStatusRegion announcement={announcement ?? null} />
}
