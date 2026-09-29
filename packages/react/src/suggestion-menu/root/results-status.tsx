'use client'

import {
  type LiveStatusAnnouncement,
  LiveStatusRegion,
} from '../../utils/live-status-region.js'

/**
 * Formats the result summary.
 * @param count The number of results.
 * @param label The text of the row Enter would choose, or `null` if none.
 */
export type GetAriaResultsText = (count: number, label: string | null) => string

export const defaultGetAriaResultsText: GetAriaResultsText = (count, label) => {
  if (count === 0) return 'No results'
  const results = `${count} ${count === 1 ? 'result' : 'results'}`
  return label ? `${results}, first: ${label}` : results
}

export type ResultsAnnouncement = LiveStatusAnnouncement

/**
 * Visually hidden polite status region that announces the settled result
 * summary. Rendered by the Root from mount, outside the popup, so Safari
 * VoiceOver has seen it before the first summary arrives.
 */
export function SuggestionMenuResultsStatus(props: {
  announcement: ResultsAnnouncement | null
}) {
  return <LiveStatusRegion announcement={props.announcement} element="span" />
}
