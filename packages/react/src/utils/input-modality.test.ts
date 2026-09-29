import { describe, expect, it } from 'vitest'
import {
  deriveOpenMethod,
  ensureInputModalityTracking,
} from './input-modality.js'

describe('deriveOpenMethod', () => {
  it('uses the triggering event pointer type when present', () => {
    expect(deriveOpenMethod({ pointerType: 'touch' } as PointerEvent)).toBe(
      'touch',
    )
    expect(deriveOpenMethod({ pointerType: 'pen' } as PointerEvent)).toBe('pen')
    expect(deriveOpenMethod({ pointerType: 'mouse' } as PointerEvent)).toBe(
      'mouse',
    )
  })

  it('treats keyboard events as keyboard even after a touch', () => {
    ensureInputModalityTracking()
    const touch = new Event('pointerdown', { bubbles: true })
    Object.defineProperty(touch, 'pointerType', { value: 'touch' })
    document.dispatchEvent(touch)
    try {
      // With no event, the last observed pointer wins…
      expect(deriveOpenMethod()).toBe('touch')
      // …but an explicit keyboard event overrides it.
      expect(
        deriveOpenMethod(new KeyboardEvent('keydown', { key: 'Enter' })),
      ).toBe('keyboard')
    } finally {
      // A real keydown resets the tracked modality for later tests.
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    }
  })

  it('defaults to keyboard when there is no event and no observed modality', () => {
    expect(deriveOpenMethod()).toBe('keyboard')
    expect(deriveOpenMethod(null)).toBe('keyboard')
  })

  it('ignores an unknown pointer type and falls back', () => {
    // A click MouseEvent carries no pointerType; with no observed modality this
    // resolves to keyboard rather than throwing.
    expect(deriveOpenMethod(new MouseEvent('click'))).toBe('keyboard')
  })
})
