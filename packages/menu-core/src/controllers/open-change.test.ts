import { describe, expect, it } from 'vitest'
import { REASONS } from '../events/reasons.js'
import { decideOpenChange, type OpenChangeRequest } from './open-change.js'

const close = (
  reason: string,
  request: Partial<OpenChangeRequest<string, string>> = {},
): OpenChangeRequest<string, string> => ({
  open: false,
  reason,
  event: 'event',
  level: 'root',
  ...request,
})

describe('decideOpenChange', () => {
  it('allows a change no rule is about, with its own reason and event', () => {
    expect(
      decideOpenChange({
        open: true,
        reason: REASONS.triggerPress,
        event: 'click',
        level: 'root',
      }),
    ).toEqual({ type: 'allow', reason: REASONS.triggerPress, event: 'click' })
    expect(decideOpenChange(close(REASONS.itemPress))).toEqual({
      type: 'allow',
      reason: REASONS.itemPress,
      event: 'event',
    })
  })

  describe('disabled', () => {
    it('cancels any open', () => {
      for (const level of ['root', 'submenu', 'subpage'] as const) {
        expect(
          decideOpenChange({
            open: true,
            reason: REASONS.triggerHover,
            level,
            disabled: true,
          }),
        ).toEqual({ type: 'cancel' })
      }
    })

    it('cancels a root closing too, but lets a submenu close', () => {
      expect(
        decideOpenChange(close(REASONS.escapeKey, { disabled: true })),
      ).toEqual({ type: 'cancel' })
      expect(
        decideOpenChange(
          close(REASONS.none, { level: 'submenu', disabled: true }),
        ),
      ).toMatchObject({ type: 'allow' })
    })

    it('lets a close the engine makes through, but not an open', () => {
      for (const reason of [REASONS.itemPress, REASONS.escapeKey]) {
        expect(
          decideOpenChange(close(reason, { disabled: true, engine: true })),
        ).toEqual({ type: 'allow', reason, event: 'event' })
      }
      expect(
        decideOpenChange({
          open: true,
          reason: REASONS.none,
          level: 'root',
          disabled: true,
          engine: true,
        }),
      ).toEqual({ type: 'cancel' })
    })

    it('lets an imperative action through', () => {
      expect(
        decideOpenChange({
          open: true,
          reason: REASONS.imperativeAction,
          level: 'root',
          disabled: true,
        }),
      ).toMatchObject({ type: 'allow' })
      expect(
        decideOpenChange(close(REASONS.imperativeAction, { disabled: true })),
      ).toMatchObject({ type: 'allow' })
    })
  })

  describe('exempt targets', () => {
    it('cancels an outside press on an exempt element', () => {
      expect(
        decideOpenChange(close(REASONS.outsidePress, { exempt: true })),
      ).toEqual({ type: 'cancel' })
      expect(decideOpenChange(close(REASONS.outsidePress))).toMatchObject({
        type: 'allow',
      })
    })

    it('cancels focus moving to an exempt element', () => {
      expect(
        decideOpenChange(close(REASONS.focusOut, { exempt: true })),
      ).toEqual({ type: 'cancel' })
    })

    it('keeps a submenu open too, even with no outside press behind a focus-out', () => {
      for (const reason of [REASONS.outsidePress, REASONS.focusOut]) {
        expect(
          decideOpenChange(
            close(reason, {
              level: 'submenu',
              outsideTree: true,
              exempt: true,
            }),
          ),
        ).toEqual({ type: 'cancel' })
      }
    })

    it('reads exemption for presses and focus moves only', () => {
      expect(
        decideOpenChange(close(REASONS.escapeKey, { exempt: true })),
      ).toMatchObject({ type: 'allow' })
    })
  })

  describe('a dismissal from outside the tree', () => {
    it('is left to the root by a submenu when the root hears it too', () => {
      expect(
        decideOpenChange(
          close(REASONS.outsidePress, { level: 'submenu', outsideTree: true }),
        ),
      ).toEqual({ type: 'cancel' })
      expect(
        decideOpenChange(
          close(REASONS.focusOut, {
            level: 'submenu',
            outsideTree: true,
            outsidePress: 'pointer',
          }),
        ),
      ).toEqual({ type: 'cancel' })
    })

    it('closes a submenu on a focus-out no outside press caused', () => {
      expect(
        decideOpenChange(
          close(REASONS.focusOut, { level: 'submenu', outsideTree: true }),
        ),
      ).toEqual({ type: 'allow', reason: REASONS.focusOut, event: 'event' })
    })

    it('closes a submenu from inside the tree, and the root from anywhere', () => {
      expect(
        decideOpenChange(close(REASONS.focusOut, { level: 'submenu' })),
      ).toEqual({ type: 'allow', reason: REASONS.focusOut, event: 'event' })
      expect(
        decideOpenChange(close(REASONS.outsidePress, { outsideTree: true })),
      ).toEqual({ type: 'allow', reason: REASONS.outsidePress, event: 'event' })
    })

    it('reads the fact for presses and focus moves only', () => {
      expect(
        decideOpenChange(
          close(REASONS.triggerPress, { level: 'submenu', outsideTree: true }),
        ),
      ).toEqual({ type: 'allow', reason: REASONS.triggerPress, event: 'event' })
    })
  })

  it('cancels focus moving to another popup of the tree', () => {
    expect(
      decideOpenChange(close(REASONS.focusOut, { focusInTree: true })),
    ).toEqual({ type: 'cancel' })
    expect(
      decideOpenChange(close(REASONS.outsidePress, { focusInTree: true })),
    ).toMatchObject({ type: 'allow' })
  })

  it('reports a focus-out an outside press caused as that press', () => {
    expect(
      decideOpenChange(close(REASONS.focusOut, { outsidePress: 'pointer' })),
    ).toEqual({
      type: 'allow',
      reason: REASONS.outsidePress,
      event: 'pointer',
    })
    // Only a focus-out
    expect(
      decideOpenChange(close(REASONS.escapeKey, { outsidePress: 'pointer' })),
    ).toEqual({ type: 'allow', reason: REASONS.escapeKey, event: 'event' })
  })

  it('cancels a focus-out to an exempt element even after an outside press', () => {
    expect(
      decideOpenChange(
        close(REASONS.focusOut, { exempt: true, outsidePress: 'pointer' }),
      ),
    ).toEqual({ type: 'cancel' })
  })

  describe('Escape', () => {
    it('goes back a page in a subpage', () => {
      expect(
        decideOpenChange(close(REASONS.escapeKey, { level: 'subpage' })),
      ).toEqual({ type: 'back' })
    })

    it('closes the whole tree from a subpage with closeRootOnEsc', () => {
      expect(
        decideOpenChange(
          close(REASONS.escapeKey, { level: 'subpage', closeRootOnEsc: true }),
        ),
      ).toEqual({
        type: 'redirect',
        to: 'root',
        reason: REASONS.escapeKey,
        event: 'event',
      })
    })

    it('closes the whole tree from a submenu, unless closeRootOnEsc is off', () => {
      expect(
        decideOpenChange(close(REASONS.escapeKey, { level: 'submenu' })),
      ).toEqual({
        type: 'redirect',
        to: 'root',
        reason: REASONS.escapeKey,
        event: 'event',
      })
      expect(
        decideOpenChange(
          close(REASONS.escapeKey, { level: 'submenu', closeRootOnEsc: false }),
        ),
      ).toEqual({ type: 'allow', reason: REASONS.escapeKey, event: 'event' })
    })

    it('closes the root itself', () => {
      expect(
        decideOpenChange(close(REASONS.escapeKey, { closeRootOnEsc: true })),
      ).toEqual({ type: 'allow', reason: REASONS.escapeKey, event: 'event' })
    })

    it('decides nothing about other closes of a submenu or subpage', () => {
      for (const level of ['submenu', 'subpage'] as const) {
        expect(
          decideOpenChange(close(REASONS.listNavigation, { level })),
        ).toMatchObject({ type: 'allow' })
      }
    })
  })
})
