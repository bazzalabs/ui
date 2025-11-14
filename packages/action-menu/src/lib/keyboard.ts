import type * as React from 'react'
import type { Direction } from '../types.js'

export const SELECTION_KEYS = ['Enter'] as const
export const FIRST_KEYS = ['ArrowDown', 'PageUp', 'Home'] as const
export const LAST_KEYS = ['ArrowUp', 'PageDown', 'End'] as const

export const SUB_OPEN_KEYS: Record<Direction, readonly string[]> = {
  ltr: [...SELECTION_KEYS, 'ArrowRight'],
  rtl: [...SELECTION_KEYS, 'ArrowLeft'],
}
export const SUB_CLOSE_KEYS: Record<Direction, readonly string[]> = {
  ltr: ['ArrowLeft'],
  rtl: ['ArrowRight'],
}

export const isSelectionKey = (k: string) =>
  (SELECTION_KEYS as readonly string[]).includes(k)
export const isFirstKey = (k: string) =>
  (FIRST_KEYS as readonly string[]).includes(k)
export const isLastKey = (k: string) =>
  (LAST_KEYS as readonly string[]).includes(k)
export const isOpenKey = (dir: Direction, k: string) =>
  SUB_OPEN_KEYS[dir].includes(k)
export const isCloseKey = (dir: Direction, k: string) =>
  SUB_CLOSE_KEYS[dir].includes(k)
export const isVimNext = (e: React.KeyboardEvent) =>
  e.ctrlKey && (e.key === 'n' || e.key === 'j')
export const isVimPrev = (e: React.KeyboardEvent) =>
  e.ctrlKey && (e.key === 'p' || e.key === 'k')
export const isVimOpen = (e: React.KeyboardEvent) => e.ctrlKey && e.key === 'l'
export const isVimClose = (e: React.KeyboardEvent) => e.ctrlKey && e.key === 'h'

export const getDir = (explicit?: Direction): Direction => {
  if (explicit) return explicit
  if (typeof document !== 'undefined') {
    const d = document?.dir?.toLowerCase()
    if (d === 'rtl' || d === 'ltr') return d as Direction
  }
  return 'ltr'
}
