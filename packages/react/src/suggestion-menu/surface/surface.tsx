'use client'

import * as React from 'react'
import { useListboxContext } from '../../internal/listbox/index.js'
import {
  isPopupMenuNode,
  type NodeDef,
  PopupMenuSurface,
  type PopupMenuSurfaceProps,
} from '../../internal/popup-menu/index.js'
import { useSuggestionMenuRootContext } from '../root/root-context.js'
import { SuggestionMenuResultsReporter } from './results-reporter.js'

export interface SuggestionMenuSurfaceProps
  extends Omit<
    PopupMenuSurfaceProps,
    'search' | 'onSearchChange' | 'defaultSearch' | 'skipAutoFocus'
  > {
  /**
   * How rows from `asyncContent` combine with `content`.
   * @default 'append'
   */
  asyncContentMode?: PopupMenuSurfaceProps['asyncContentMode']
}

const BRANCH_KINDS = new Set(['submenu', 'subpage'])

let warnedBranches = false
function warnBranches() {
  if (process.env.NODE_ENV === 'production' || warnedBranches) return
  warnedBranches = true
  console.warn(
    '[SuggestionMenu] Submenu and subpage definitions are not supported and were skipped.',
  )
}

type ContentEntry = NonNullable<PopupMenuSurfaceProps['content']>[number]

/**
 * Drops submenu and subpage defs (anywhere in the content), warning once.
 * @internal Exported for tests.
 */
export function withoutBranches<T extends ContentEntry>(
  entries: readonly T[],
): T[] {
  let dropped = false
  const keep = <E extends ContentEntry>(list: readonly E[]): E[] =>
    list.flatMap((entry): E[] => {
      const def: NodeDef = isPopupMenuNode(entry) ? entry.def : entry
      if (BRANCH_KINDS.has(def.kind)) {
        dropped = true
        return []
      }
      if (isPopupMenuNode(entry)) return [entry]
      const children = 'nodes' in def ? def.nodes : undefined
      if (Array.isArray(children)) {
        const nodes = keep(children as NodeDef[])
        const changed =
          nodes.length !== children.length ||
          nodes.some((node, index) => node !== children[index])
        return changed ? [{ ...def, nodes } as E] : [entry]
      }
      return [entry]
    })
  const result = keep(entries)
  if (dropped) warnBranches()
  return dropped ? result : (entries as T[])
}

/**
 * One pane of suggestions: its content, loaders, list and empty/loading
 * states. The query comes from the host input (through the Root), never from
 * an input inside the popup. Submenu and subpage definitions in `content` are
 * skipped with a development warning; rows from `asyncContent` are shown as
 * returned, so loaders shouldn't return them.
 * Renders a `<div>` element.
 */
export const SuggestionMenuSurface = React.forwardRef<
  HTMLDivElement,
  SuggestionMenuSurfaceProps
>(function SuggestionMenuSurface(props, forwardedRef) {
  const { content, asyncContentMode = 'append', children, ...rest } = props
  const { query } = useSuggestionMenuRootContext()
  const { store } = useListboxContext()

  // The host input plays the role of the surface's input: the list neither
  // takes focus nor handles keys itself.
  React.useLayoutEffect(() => {
    store.setHasInput(true)
    return () => store.setHasInput(false)
  }, [store])

  const filteredContent = React.useMemo(
    () =>
      content ? withoutBranches(content as readonly ContentEntry[]) : content,
    [content],
  ) as PopupMenuSurfaceProps['content']

  return (
    <PopupMenuSurface
      ref={forwardedRef}
      {...rest}
      content={filteredContent}
      asyncContentMode={asyncContentMode}
      search={query}
      // DOM focus stays in the host input.
      skipAutoFocus
    >
      {children}
      <SuggestionMenuResultsReporter />
    </PopupMenuSurface>
  )
})

export namespace SuggestionMenuSurface {
  export type Props = SuggestionMenuSurfaceProps
}
