import type * as React from 'react'

type HostKeyboardEvent = KeyboardEvent | React.KeyboardEvent

/** Keys the menu may use while open; everything else stays with the host. */
const MENU_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter'])

export interface SuggestionMenuKeymapOptions {
  /** Whether the menu is open. */
  isOpen: () => boolean
  /** Runs the menu's own keyboard handling; returns whether it used the key. */
  forward: (event: HostKeyboardEvent) => boolean
  /** Closes the menu because Escape was pressed. */
  dismiss: (event: HostKeyboardEvent) => void
}

/**
 * Decides what a key press in the host input does to the suggestion menu.
 * Returns `true` when the menu used the key (its default action is then
 * prevented), `false` when the key keeps its meaning in the host.
 *
 * While open: ↑/↓, Ctrl+N/P and Home/End move the highlight, Enter chooses the
 * highlighted row, and Escape closes the menu without reaching an enclosing
 * dialog. Tab, ←/→, PageUp/PageDown, printable keys, and any key with ⌘, Alt
 * or Shift (or Ctrl other than N/P) belong to the host. Nothing is handled
 * while closed or during IME composition.
 */
export function handleSuggestionMenuKey(
  event: HostKeyboardEvent,
  options: SuggestionMenuKeymapOptions,
): boolean {
  const native = 'nativeEvent' in event ? event.nativeEvent : event
  if (native.isComposing || event.keyCode === 229) return false
  if (event.defaultPrevented || !options.isOpen()) return false

  const { key, ctrlKey, metaKey, altKey, shiftKey } = event
  if (metaKey || altKey || shiftKey) return false

  if (ctrlKey) {
    if (key !== 'n' && key !== 'p') return false
    return options.forward(event)
  }

  if (key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    options.dismiss(event)
    return true
  }

  if (!MENU_KEYS.has(key)) return false
  return options.forward(event)
}
