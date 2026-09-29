'use client'

import { LiveStatusRegion } from '../../../../utils/live-status-region.js'
import { useCheckboxSelection } from '../../contexts/checkbox-selection-context.js'

/**
 * Visually hidden polite status region that announces range and drag
 * selection commits. Rendered once per surface, present before any gesture.
 */
export function PopupMenuCheckboxSelectionStatus() {
  const selection = useCheckboxSelection()
  const announcement = selection.useState('announcement')
  return <LiveStatusRegion announcement={announcement ?? null} />
}
