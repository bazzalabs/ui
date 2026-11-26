import { describe, expect, it } from 'vitest'
import { toForwardedReactEvent } from './use-forwarded-key-down.js'

// Forwarded keys are covered through SuggestionMenu's handle in
// `suggestion-menu/suggestion-menu.forwarded-keys.test.tsx`. This covers the
// event adapter on its own: no menu reads modifier state through it yet.
describe('toForwardedReactEvent', () => {
  it('reads modifier state through the forwarded event', () => {
    const forwarded = toForwardedReactEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true }),
    )
    expect(forwarded.event.getModifierState('Shift')).toBe(true)
  })
})
