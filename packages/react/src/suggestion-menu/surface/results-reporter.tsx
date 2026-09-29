'use client'

import * as React from 'react'
import {
  type ListboxStore,
  useListboxContext,
} from '../../internal/listbox/index.js'
import { useMaybeAsyncMenuCoordinator } from '../../internal/popup-menu/index.js'
import { useSuggestionMenuRootContext } from '../root/root-context.js'

/**
 * How many rows the list shows, disabled ones included: a list of only
 * disabled rows still has results, it just can't choose one. The same numbers
 * `Empty` decides from, so the summary never disagrees with it.
 * @internal Exported for tests.
 */
export function countShownRows(store: Pick<ListboxStore, 'state'>): number {
  const { virtualized, virtualItemsCount, filteredCount } = store.state
  return virtualized ? virtualItemsCount : filteredCount
}

/** A row's accessible text, found inside this menu's list. */
function rowLabel(store: ListboxStore, id: string): string | null {
  const list = store.context.refs.listRef.current
  const element =
    store.context.refs.itemRefs.get(id)?.current ??
    [...(list?.querySelectorAll('[id]') ?? [])].find((el) => el.id === id)
  const text =
    element?.getAttribute('aria-label') ?? element?.textContent?.trim()
  return text || store.context.items.get(id)?.value || null
}

/**
 * Tells the Root what the settled results are, so its status region can
 * announce them. Lives inside the Surface, where the settle state is known.
 */
export function SuggestionMenuResultsReporter() {
  const { store } = useListboxContext()
  const coordinator = useMaybeAsyncMenuCoordinator()
  const { query, reportResults } = useSuggestionMenuRootContext()
  const open = store.useState('open')
  const highlightedId = store.useState('highlightedId')
  const highlightSource = store.useState('highlightSource')
  const settled = coordinator?.rootReveal.settled ?? true

  // Re-run when the menu itself moves the highlight (e.g. to the first row
  // once rows land). Moves by keyboard or pointer are voiced through
  // aria-activedescendant and the row, not the summary.
  const menuHighlightRef = React.useRef<string | null>(null)
  if (highlightSource !== 'keyboard' && highlightSource !== 'pointer') {
    menuHighlightRef.current = highlightedId
  }
  const menuHighlightedId = menuHighlightRef.current

  React.useEffect(() => {
    if (!open || !settled) return undefined
    // Read the rows once this update has finished: a settle published from a
    // layout effect re-renders first, and cancels this timer if the results
    // turned out not to be settled after all.
    const timeout = setTimeout(() => {
      const ids = store.getVisibleItemIds()
      // The row Enter would choose: the highlighted one, if any.
      const current = store.state.highlightedId
      const chosen = current !== null && ids.includes(current) ? current : null
      reportResults(
        countShownRows(store),
        chosen ? rowLabel(store, chosen) : null,
      )
    })
    return () => clearTimeout(timeout)
  }, [open, settled, query, menuHighlightedId, store, reportResults])

  return null
}
