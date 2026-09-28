'use client'

import { visuallyHidden } from '@base-ui/utils/visuallyHidden'
import {
  LIVE_REGION_MARKER,
  useInitialLiveRegionTextMutation,
} from '../../../../utils/use-initial-live-region-text-mutation.js'
import { useCheckboxSelection } from '../../contexts/checkbox-selection-context.js'

/**
 * Visually hidden polite status region that announces range and drag
 * selection commits. Rendered once per surface, present before any gesture.
 */
export function PopupMenuCheckboxSelectionStatus() {
  const selection = useCheckboxSelection()
  const announcement = selection.useState('announcement')
  const ref = useInitialLiveRegionTextMutation<HTMLDivElement>()

  // Alternate a trailing word joiner so two identical announcements in a row
  // still change the region's text.
  const text = announcement
    ? announcement.key % 2 === 0
      ? `${announcement.text}${LIVE_REGION_MARKER}`
      : announcement.text
    : ''

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={visuallyHidden}
    >
      {text}
    </div>
  )
}
