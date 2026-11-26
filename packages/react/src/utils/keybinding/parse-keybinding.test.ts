import { describe, expect, it } from 'vitest'
import {
  getChordLabels,
  getKeyLabel,
  parseKeybinding,
} from './parse-keybinding.js'

describe('parseKeybinding', () => {
  it('parses a chord', () => {
    expect(parseKeybinding('mod+shift+o')).toEqual({
      chords: [
        {
          meta: false,
          ctrl: false,
          alt: false,
          shift: true,
          mod: true,
          key: 'o',
        },
      ],
    })
  })

  it('parses a sequence', () => {
    expect(parseKeybinding('g i')).toEqual({
      chords: [
        {
          meta: false,
          ctrl: false,
          alt: false,
          shift: false,
          mod: false,
          key: 'g',
        },
        {
          meta: false,
          ctrl: false,
          alt: false,
          shift: false,
          mod: false,
          key: 'i',
        },
      ],
    })
  })

  it('parses modifier and key aliases case-insensitively', () => {
    expect(parseKeybinding('CMD+Option+RETURN')).toEqual({
      chords: [
        {
          meta: true,
          ctrl: false,
          alt: true,
          shift: false,
          mod: false,
          key: 'enter',
        },
      ],
    })

    expect(parseKeybinding('control+opt+esc super+spacebar plus')).toEqual({
      chords: [
        {
          meta: false,
          ctrl: true,
          alt: true,
          shift: false,
          mod: false,
          key: 'escape',
        },
        {
          meta: true,
          ctrl: false,
          alt: false,
          shift: false,
          mod: false,
          key: 'space',
        },
        {
          meta: false,
          ctrl: false,
          alt: false,
          shift: false,
          mod: false,
          key: '+',
        },
      ],
    })
  })

  it('throws on two keys in one chord', () => {
    expect(() => parseKeybinding('k+j')).toThrow(/multiple keys/i)
  })

  it('returns no chords for an empty string', () => {
    expect(parseKeybinding('   ')).toEqual({ chords: [] })
  })

  it('ignores empty tokens from trailing or doubled separators', () => {
    expect(parseKeybinding('mod+')).toEqual({
      chords: [
        {
          meta: false,
          ctrl: false,
          alt: false,
          shift: false,
          mod: true,
          key: null,
        },
      ],
    })
    expect(parseKeybinding('ctrl++k')).toEqual({
      chords: [
        {
          meta: false,
          ctrl: true,
          alt: false,
          shift: false,
          mod: false,
          key: 'k',
        },
      ],
    })
  })
})

describe('getKeyLabel', () => {
  it('resolves labels per platform', () => {
    expect(getKeyLabel('o', 'apple')).toBe('O')
    expect(getKeyLabel('enter', 'apple')).toBe('↵')
    expect(getKeyLabel('enter', 'other')).toBe('Enter')
    expect(getKeyLabel('backspace', 'apple')).toBe('⌫')
    expect(getKeyLabel('backspace', 'other')).toBe('Backspace')
    expect(getKeyLabel('delete', 'apple')).toBe('⌦')
    expect(getKeyLabel('delete', 'other')).toBe('Del')
    expect(getKeyLabel('tab', 'apple')).toBe('⇥')
    expect(getKeyLabel('tab', 'other')).toBe('Tab')
    expect(getKeyLabel('arrowup', 'other')).toBe('↑')
  })
})

describe('getChordLabels', () => {
  it('resolves mod and orders modifiers per platform', () => {
    const chord = parseKeybinding('mod+shift+o').chords[0]

    expect(getChordLabels(chord, 'apple')).toEqual(['⇧', '⌘', 'O'])
    expect(getChordLabels(chord, 'other')).toEqual(['Ctrl', 'Shift', 'O'])
  })

  it('dedupes resolved mod modifiers', () => {
    expect(
      getChordLabels(parseKeybinding('mod+cmd+k').chords[0], 'apple'),
    ).toEqual(['⌘', 'K'])
    expect(
      getChordLabels(parseKeybinding('mod+ctrl+k').chords[0], 'other'),
    ).toEqual(['Ctrl', 'K'])
  })
})
