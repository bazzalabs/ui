import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { CommandMenuTriggerProps } from '../types.js'

/**
 * Parses a keyboard shortcut string into a set of keys.
 * Examples: "cmd+k", "ctrl+shift+p", "/"
 */
function parseShortcut(shortcut: string): {
  key: string
  ctrl: boolean
  meta: boolean
  shift: boolean
  alt: boolean
} {
  const parts = shortcut.toLowerCase().split('+')
  const key = parts[parts.length - 1]!
  const ctrl = parts.includes('ctrl')
  const meta = parts.includes('cmd') || parts.includes('meta')
  const shift = parts.includes('shift')
  const alt = parts.includes('alt')

  return { key, ctrl, meta, shift, alt }
}

/**
 * Checks if a keyboard event matches a parsed shortcut.
 */
function matchesShortcut(
  event: KeyboardEvent,
  shortcut: ReturnType<typeof parseShortcut>,
): boolean {
  return (
    event.key.toLowerCase() === shortcut.key &&
    event.ctrlKey === shortcut.ctrl &&
    event.metaKey === shortcut.meta &&
    event.shiftKey === shortcut.shift &&
    event.altKey === shortcut.alt
  )
}

export function CommandMenuTrigger({
  shortcut = 'cmd+k',
  disabled = false,
  children,
}: CommandMenuTriggerProps) {
  // Parse shortcuts
  const shortcuts = React.useMemo(() => {
    const shortcutArray = Array.isArray(shortcut) ? shortcut : [shortcut]
    return shortcutArray.map(parseShortcut)
  }, [shortcut])

  // Set up global keyboard listener
  React.useEffect(() => {
    if (disabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if any shortcut matches
      const matched = shortcuts.some((s) => matchesShortcut(event, s))

      if (matched) {
        // Prevent default behavior
        event.preventDefault()
        event.stopPropagation()

        // Trigger the dialog open
        // We'll use a custom event to communicate with the Dialog.Trigger
        const trigger = document.querySelector(
          '[data-command-menu-trigger]',
        ) as HTMLElement | null
        if (trigger) {
          trigger.click()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, disabled])

  // If children provided, render as Dialog.Trigger
  if (children) {
    return (
      <Dialog.Trigger asChild data-command-menu-trigger>
        {children}
      </Dialog.Trigger>
    )
  }

  // Otherwise, render a hidden trigger for programmatic access
  return (
    <Dialog.Trigger asChild data-command-menu-trigger>
      <button type="button" style={{ display: 'none' }} aria-hidden />
    </Dialog.Trigger>
  )
}
