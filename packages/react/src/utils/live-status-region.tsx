'use client'

import { visuallyHidden } from '@base-ui/utils/visuallyHidden'
import {
  LIVE_REGION_MARKER,
  useInitialLiveRegionTextMutation,
} from './use-initial-live-region-text-mutation.js'

/** A message for a live region. `key` changes with every new message. */
export interface LiveStatusAnnouncement {
  text: string
  key: number
}

/**
 * Visually hidden polite status region. Gets a first text mutation on mount
 * (Safari VoiceOver needs it before it announces later updates) and
 * alternates a trailing word joiner so the same message twice in a row still
 * changes the region's text.
 */
export function LiveStatusRegion(props: {
  announcement: LiveStatusAnnouncement | null
  /** Use `'span'` where only phrasing content is allowed. */
  element?: 'div' | 'span'
}) {
  const { announcement, element: Element = 'div' } = props
  const ref = useInitialLiveRegionTextMutation<HTMLElement>()

  const text = announcement
    ? announcement.key % 2 === 0
      ? `${announcement.text}${LIVE_REGION_MARKER}`
      : announcement.text
    : ''

  return (
    <Element
      ref={ref as React.Ref<HTMLDivElement & HTMLSpanElement>}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={visuallyHidden}
    >
      {text}
    </Element>
  )
}
