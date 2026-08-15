'use client'

import * as React from 'react'
import type { KeyChord } from '../utils/parse-keybinding.js'
import { parseKeybinding } from '../utils/parse-keybinding.js'
import { isApplePlatform } from '../utils/platform.js'

/**
 * Options for the useHotkey global keydown listener.
 *
 * @internal Not part of the public API — used by CommandMenu's `hotkey` prop.
 */
export interface UseHotkeyOptions {
  /** @default true */
  enabled?: boolean
  /** @default true */
  preventDefault?: boolean
  /** Fire even when focus is in an input/textarea/select/contenteditable. @default false */
  allowInInput?: boolean
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

function getEventKey(event: KeyboardEvent): string {
  const key = event.key.toLowerCase()

  return key === ' ' ? 'space' : key
}

function matchesModifiers(event: KeyboardEvent, chord: KeyChord): boolean {
  const isApple = isApplePlatform()
  const meta = chord.meta || (isApple && chord.mod)
  const ctrl = chord.ctrl || (!isApple && chord.mod)

  return (
    event.metaKey === meta &&
    event.ctrlKey === ctrl &&
    event.altKey === chord.alt &&
    event.shiftKey === chord.shift
  )
}

function matchesChord(event: KeyboardEvent, chord: KeyChord): boolean {
  return chord.key === getEventKey(event) && matchesModifiers(event, chord)
}

/**
 * Calls a handler when a single-chord keybinding is pressed anywhere in the
 * document.
 *
 * @internal Not part of the public API. Deliberately unexported from
 * `kbd/index.ts` — consumers get global-shortcut behavior through
 * `CommandMenu.Root`'s `hotkey` prop instead. Import via the file path if
 * another primitive needs it.
 */
export function useHotkey(
  keys: string,
  handler: (event: KeyboardEvent) => void,
  options?: UseHotkeyOptions,
): void {
  const keybinding = React.useMemo(() => parseKeybinding(keys), [keys])
  const [firstChord] = keybinding.chords
  const chord =
    keybinding.chords.length === 1 && firstChord !== undefined
      ? firstChord
      : null
  const isSequence = keybinding.chords.length > 1
  const enabled = options?.enabled !== false

  const handlerRef = React.useRef(handler)
  const optionsRef = React.useRef(options)

  handlerRef.current = handler
  optionsRef.current = options

  React.useEffect(() => {
    if (isSequence && process.env.NODE_ENV !== 'production') {
      console.warn(
        `useHotkey only supports single-chord keybindings. Received "${keys}", but sequences are not supported by useHotkey.`,
      )
    }
  }, [isSequence, keys])

  React.useEffect(() => {
    if (!enabled || chord === null || isSequence || chord.key === null) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentOptions = optionsRef.current

      if (event.repeat) {
        return
      }

      if (!currentOptions?.allowInInput && isEditableTarget(event.target)) {
        return
      }

      if (!matchesChord(event, chord)) {
        return
      }

      if (currentOptions?.preventDefault !== false) {
        event.preventDefault()
      }

      handlerRef.current(event)
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [chord, enabled, isSequence])
}
