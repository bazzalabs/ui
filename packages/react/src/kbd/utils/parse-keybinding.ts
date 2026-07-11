export interface KeyChord {
  meta: boolean
  ctrl: boolean
  alt: boolean
  shift: boolean
  mod: boolean
  key: string | null
}

export interface Keybinding {
  chords: KeyChord[]
}

type Platform = 'apple' | 'other'

const keyAliases: Record<string, string> = {
  esc: 'escape',
  return: 'enter',
  del: 'delete',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  space: 'space',
  spacebar: 'space',
  plus: '+',
}

function normalizeKey(key: string): string {
  return keyAliases[key] ?? key
}

function createChord(): KeyChord {
  return {
    meta: false,
    ctrl: false,
    alt: false,
    shift: false,
    mod: false,
    key: null,
  }
}

export function parseKeybinding(keys: string): Keybinding {
  const trimmed = keys.trim()

  if (trimmed.length === 0) {
    return { chords: [] }
  }

  return {
    chords: trimmed.split(/\s+/).map((chordValue) => {
      const chord = createChord()

      for (const tokenValue of chordValue.split('+')) {
        const token = tokenValue.trim().toLowerCase()

        if (token === '') {
          // Skip empty tokens from trailing/leading/double "+" (e.g. "mod+").
          // A literal "+" key is expressed with the "plus" alias.
          continue
        }

        if (token === 'mod') {
          chord.mod = true
        } else if (
          token === 'meta' ||
          token === 'cmd' ||
          token === 'command' ||
          token === 'win' ||
          token === 'super'
        ) {
          chord.meta = true
        } else if (token === 'ctrl' || token === 'control') {
          chord.ctrl = true
        } else if (token === 'alt' || token === 'option' || token === 'opt') {
          chord.alt = true
        } else if (token === 'shift') {
          chord.shift = true
        } else {
          if (chord.key !== null) {
            throw new Error(
              `Keybinding chord "${chordValue}" contains multiple keys: "${chord.key}" and "${token}"`,
            )
          }

          chord.key = normalizeKey(token)
        }
      }

      return chord
    }),
  }
}

export function getKeyLabel(key: string, platform: Platform): string {
  const normalizedKey = key.toLowerCase()

  switch (normalizedKey) {
    case 'enter':
      return platform === 'apple' ? '↵' : 'Enter'
    case 'escape':
      return 'Esc'
    case 'backspace':
      return platform === 'apple' ? '⌫' : 'Backspace'
    case 'delete':
      return platform === 'apple' ? '⌦' : 'Del'
    case 'tab':
      return platform === 'apple' ? '⇥' : 'Tab'
    case 'space':
      return 'Space'
    case 'arrowup':
      return '↑'
    case 'arrowdown':
      return '↓'
    case 'arrowleft':
      return '←'
    case 'arrowright':
      return '→'
    default:
      if (normalizedKey.length === 1) {
        return normalizedKey.toUpperCase()
      }

      return normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1)
  }
}

export function getChordLabels(chord: KeyChord, platform: Platform): string[] {
  const isCtrl = chord.ctrl || (platform === 'other' && chord.mod)
  const isMeta = chord.meta || (platform === 'apple' && chord.mod)
  const labels: string[] = []

  if (isCtrl) {
    labels.push(platform === 'apple' ? '⌃' : 'Ctrl')
  }

  if (chord.alt) {
    labels.push(platform === 'apple' ? '⌥' : 'Alt')
  }

  if (chord.shift) {
    labels.push(platform === 'apple' ? '⇧' : 'Shift')
  }

  if (isMeta) {
    labels.push(platform === 'apple' ? '⌘' : 'Win')
  }

  if (chord.key !== null) {
    labels.push(getKeyLabel(chord.key, platform))
  }

  return labels
}
