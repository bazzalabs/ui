'use client'

import * as React from 'react'
import {
  type AttachTextTriggerOptions,
  attachTextTrigger,
  type SuggestionMenuTextTriggerHandle,
} from './attach-text-trigger.js'

/**
 * React wrapper for `attachTextTrigger`. Returns a stable ref for the
 * `<input>` or `<textarea>`; pass it directly (the attached field is
 * `menu.host`). The latest `triggers` are used on every keystroke.
 */
export function useTextTrigger(
  menu: SuggestionMenuTextTriggerHandle,
  options: AttachTextTriggerOptions,
): (field: HTMLInputElement | HTMLTextAreaElement | null) => void {
  const optionsRef = React.useRef(options)
  optionsRef.current = options
  const detachRef = React.useRef<(() => void) | null>(null)

  // React calls the ref with `null` when the field unmounts, which detaches.
  return React.useCallback(
    (field: HTMLInputElement | HTMLTextAreaElement | null) => {
      detachRef.current?.()
      detachRef.current = field
        ? attachTextTrigger(menu, field, {
            get triggers() {
              return optionsRef.current.triggers
            },
          })
        : null
    },
    [menu],
  )
}
