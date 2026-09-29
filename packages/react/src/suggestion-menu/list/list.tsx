'use client'

import * as React from 'react'
import { PopupMenuList } from '../../internal/popup-menu/index.js'
import { useSuggestionMenuRootContext } from '../root/root-context.js'

export interface SuggestionMenuListProps extends PopupMenuList.Props {
  /**
   * Accessible label for the listbox.
   * @default 'Suggestions'
   */
  label?: string
}

/**
 * The listbox of suggestions. Keyboard handling comes from the host input,
 * so the list never takes focus.
 * Renders a `<div>` element with `role="listbox"`.
 */
export const SuggestionMenuList = React.forwardRef<
  HTMLDivElement,
  SuggestionMenuListProps
>(function SuggestionMenuList(props, forwardedRef) {
  const { label = 'Suggestions', ...rest } = props
  const { syncHostAria } = useSuggestionMenuRootContext()
  const observerRef = React.useRef<MutationObserver | null>(null)
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      // The host's `aria-controls` points at the list as soon as it has its
      // id, which can arrive a render after the element mounts.
      observerRef.current?.disconnect()
      observerRef.current = null
      if (node) {
        if (node.id) syncHostAria(node.id)
        const observer = new MutationObserver(() => {
          if (node.id) syncHostAria(node.id)
        })
        observer.observe(node, { attributeFilter: ['id'] })
        observerRef.current = observer
      }
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [forwardedRef, syncHostAria],
  )
  return <PopupMenuList ref={setRef} label={label} {...rest} />
})

export namespace SuggestionMenuList {
  export type Props = SuggestionMenuListProps
}
