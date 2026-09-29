'use client'

import * as React from 'react'
import type { ListboxStore } from '../../internal/listbox/index.js'

/** Written on every host while the menu is open. */
const SHARED_ATTRIBUTES = [
  'aria-controls',
  'aria-activedescendant',
  'aria-autocomplete',
  'aria-haspopup',
] as const

/** Also written on a single-line `<input>`, which becomes a combobox. */
const INPUT_ATTRIBUTES = ['role', 'aria-expanded'] as const

type HostAttribute =
  | (typeof SHARED_ATTRIBUTES)[number]
  | (typeof INPUT_ATTRIBUTES)[number]

function managedAttributes(host: Element): readonly HostAttribute[] {
  return host instanceof HTMLInputElement
    ? [...INPUT_ATTRIBUTES, ...SHARED_ATTRIBUTES]
    : SHARED_ATTRIBUTES
}

/**
 * The attributes the host should carry while the menu is open. A single-line
 * `<input>` becomes a combobox. A `<textarea>` or contenteditable keeps its
 * own role (usually `textbox`) and gets no `aria-expanded`, which `textbox`
 * doesn't support (see ADR 0005); those two attributes aren't touched.
 */
export function getHostAttributes(
  host: Element,
  listId: string | null,
  activeDescendant: string | null,
): Partial<Record<HostAttribute, string | null>> {
  const shared = {
    'aria-controls': listId,
    'aria-activedescendant': activeDescendant,
    'aria-autocomplete': 'list',
    'aria-haspopup': 'listbox',
  }
  return host instanceof HTMLInputElement
    ? { role: 'combobox', 'aria-expanded': 'true', ...shared }
    : shared
}

/**
 * Writes the host's ARIA attributes while the menu is open and puts back the
 * host's own values when it closes or the host is detached. Until the menu
 * opens, the host is an ordinary text field. Returns a function that writes
 * them again, for when the list mounts without the Root re-rendering.
 */
export function useHostAria(params: {
  store: ListboxStore
  host: Element | null
  open: boolean
  activeDescendant: string | null
}): (listId?: string) => void {
  const { store, host, open, activeDescendant } = params
  const listIdRef = React.useRef<string | null>(null)

  // Writes wait until the host's own values are saved: the list can mount
  // (and ask for a write) earlier in the same commit.
  const savedRef = React.useRef(false)
  React.useLayoutEffect(() => {
    if (!host || !open) return undefined
    const saved = managedAttributes(host).map(
      (name) => [name, host.getAttribute(name)] as const,
    )
    savedRef.current = true
    return () => {
      savedRef.current = false
      for (const [name, value] of saved) {
        if (value === null) host.removeAttribute(name)
        else host.setAttribute(name, value)
      }
    }
  }, [host, open])

  const latest = React.useRef({ store, host, open, activeDescendant })
  latest.current = { store, host, open, activeDescendant }
  const sync = React.useCallback((mountedListId?: string) => {
    if (mountedListId) listIdRef.current = mountedListId
    const current = latest.current
    if (!current.host || !current.open || !savedRef.current) return
    const listId =
      current.store.context.refs.listRef.current?.id ||
      listIdRef.current ||
      current.store.context.listId ||
      null
    const attributes = getHostAttributes(
      current.host,
      listId,
      current.activeDescendant,
    )
    for (const name of managedAttributes(current.host)) {
      const value = attributes[name] ?? null
      if (value === null) {
        if (current.host.hasAttribute(name)) current.host.removeAttribute(name)
      } else if (current.host.getAttribute(name) !== value) {
        current.host.setAttribute(name, value)
      }
    }
  }, [])

  // Runs after every render: the Root re-renders as the highlight moves.
  React.useLayoutEffect(sync)
  return sync
}
