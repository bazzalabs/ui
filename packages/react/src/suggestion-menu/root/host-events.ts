'use client'

export interface HostEventsOptions {
  isOpen: () => boolean
  /** The popup element, while it's mounted. */
  getPopup: () => HTMLElement | null
  /** Focus left the host for somewhere other than the popup. */
  onFocusOut: (event: FocusEvent) => void
  /** A press inside the popup is about to choose a row. */
  onSelectionStart: () => void
  /** The press has been handled. */
  onSelectionEnd: () => void
}

function isInPopup(event: Event, popup: HTMLElement | null) {
  if (!popup) return false
  // composedPath() sees through shadow roots, where `target` is retargeted.
  const target = event.composedPath()[0] ?? event.target
  return target instanceof Node && popup.contains(target)
}

/**
 * Watches the attached host input for the menu:
 * - focus leaving the host closes the menu, unless it moved into the popup,
 *   the whole window lost focus, or the host got it back before the next task;
 * - a press inside the popup doesn't move focus out of the host (form fields
 *   inside the popup keep their native focus);
 * - a click inside the popup marks a row selection, so the Root can tell a
 *   close requested by the row's `onSelect` from the menu's own.
 * Returns a function that stops watching.
 */
export function watchHost(host: Element, options: HostEventsOptions) {
  const doc = host.ownerDocument
  let focusTimeout: ReturnType<typeof setTimeout> | undefined
  let endSelection: (() => void) | null = null

  const onFocusOut = (event: Event) => {
    if (!options.isOpen()) return
    const next = (event as FocusEvent).relatedTarget
    const popup = options.getPopup()
    if (next instanceof Node && popup?.contains(next)) return
    clearTimeout(focusTimeout)
    focusTimeout = setTimeout(() => {
      if (!options.isOpen() || !doc.hasFocus()) return
      // Read now: the host may have been attached before it was in the page.
      const root = host.getRootNode() as Document | ShadowRoot
      if (root.activeElement === host) return
      options.onFocusOut(event as FocusEvent)
    })
  }

  const onMouseDown = (event: MouseEvent) => {
    if (!options.isOpen() || !isInPopup(event, options.getPopup())) return
    const target = event.composedPath()[0]
    if (
      target instanceof Element &&
      target.closest('input, textarea, select, [contenteditable]')
    ) {
      return
    }
    event.preventDefault()
  }

  const onClick = (event: MouseEvent) => {
    if (!options.isOpen() || !isInPopup(event, options.getPopup())) return
    // A click fired from inside a row's handler belongs to that selection.
    if (endSelection) return
    options.onSelectionStart()
    // The row's handler (React's listener on its root) runs later in this
    // dispatch, and browsers run microtasks between listeners, so the
    // selection ends when the click reaches the window. A timeout covers a
    // click that stopped propagating before that.
    const view = doc.defaultView
    // Only this click ends it: the row's handler may fire another one.
    const onWindowClick = (windowEvent: Event) => {
      if (windowEvent === event) end()
    }
    const end = () => {
      if (endSelection !== end) return
      endSelection = null
      view?.removeEventListener('click', onWindowClick)
      clearTimeout(timeout)
      options.onSelectionEnd()
    }
    endSelection = end
    view?.addEventListener('click', onWindowClick)
    const timeout = setTimeout(end)
  }

  host.addEventListener('focusout', onFocusOut)
  doc.addEventListener('mousedown', onMouseDown, true)
  doc.addEventListener('click', onClick, true)
  return () => {
    endSelection?.()
    clearTimeout(focusTimeout)
    host.removeEventListener('focusout', onFocusOut)
    doc.removeEventListener('mousedown', onMouseDown, true)
    doc.removeEventListener('click', onClick, true)
  }
}
