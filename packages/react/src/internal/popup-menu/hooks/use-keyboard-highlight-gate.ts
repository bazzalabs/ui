'use client'

import * as React from 'react'
import type { ListboxStore } from '../../listbox/index.js'

export interface UseKeyboardHighlightGateParams {
  /** The listbox store whose highlight the input points at. */
  store: ListboxStore
  /** Whether the popup is open. */
  open: boolean
  /** The current query. */
  query: string
}

export interface UseKeyboardHighlightGateReturn {
  /**
   * Whether the input should point `aria-activedescendant` at the
   * highlighted row. Decided during render, so a pointer or automatic
   * highlight never reaches the input, not even for one render.
   */
  active: boolean
  /** Call after a key moved the highlight. Arms for the current query. */
  arm: () => void
  /** Call when the input hands the screen reader back to the text (←/→). */
  disarm: () => void
}

/**
 * Gates `aria-activedescendant` on an input that keeps DOM focus while a
 * popup's rows are highlighted (ADR 0005): it follows keyboard highlight
 * only. Armed when a key moves the highlight; disarmed on `disarm()`, when
 * the pointer or the menu itself moves the highlight, when the popup closes,
 * and for good when the query changes, even if the text comes back.
 */
export function useKeyboardHighlightGate(
  params: UseKeyboardHighlightGateParams,
): UseKeyboardHighlightGateReturn {
  const { store, open, query } = params
  const highlightSource = store.useState('highlightSource')
  // The query the keyboard highlight was made for; `null` when disarmed.
  const [armedQuery, setArmedQuery] = React.useState<string | null>(null)
  const queryRef = React.useRef(query)
  queryRef.current = query

  const arm = React.useCallback(() => setArmedQuery(queryRef.current), [])
  const disarm = React.useCallback(() => setArmedQuery(null), [])

  React.useEffect(() => {
    if (highlightSource !== 'keyboard') setArmedQuery(null)
  }, [highlightSource])
  // A new query disarms it for good, even if the text comes back.
  // biome-ignore lint/correctness/useExhaustiveDependencies(query): the query is the trigger, not an input
  React.useLayoutEffect(() => {
    setArmedQuery(null)
  }, [query])
  React.useEffect(() => {
    if (!open) setArmedQuery(null)
  }, [open])

  const active = open && highlightSource === 'keyboard' && armedQuery === query
  return { active, arm, disarm }
}
