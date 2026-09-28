'use client'

import { platform } from '@base-ui/utils/platform'
import { useTimeout } from '@base-ui/utils/useTimeout'
import * as React from 'react'

// Word Joiner: invisible and zero-width, so it forces a text mutation without shifting layout.
export const LIVE_REGION_MARKER = '\u2060'
// Safari VoiceOver needs roughly 200ms to notice the initial polite live-region change.
export const INITIAL_LIVE_REGION_TEXT_MUTATION_RESET_DELAY = 200

/**
 * Gives an initially empty polite live region a first text mutation on mount
 * so Safari VoiceOver announces later updates. Skipped on iOS, where the
 * marker is read aloud. Pattern from Base UI's combobox status.
 */
export function useInitialLiveRegionTextMutation<T extends HTMLElement>() {
  const timeout = useTimeout()
  const rootRef = React.useRef<T | null>(null)

  React.useEffect(() => {
    if (platform.os.ios) return undefined
    const root = rootRef.current
    if (root === null || root.textContent !== '') return undefined

    root.textContent = LIVE_REGION_MARKER
    timeout.start(INITIAL_LIVE_REGION_TEXT_MUTATION_RESET_DELAY, () => {
      if (root.textContent === LIVE_REGION_MARKER) root.textContent = ''
    })

    return () => {
      timeout.clear()
      if (root.textContent === LIVE_REGION_MARKER) root.textContent = ''
    }
  }, [timeout])

  return rootRef
}
