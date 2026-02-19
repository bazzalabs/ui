import { describe, expect, it } from 'vitest'
import {
  getSmoothedHeading,
  resolveAnchorSide,
  willHitSubmenu,
} from './aim-guard.js'

// ============================================================================
// Test Helpers
// ============================================================================

function createDOMRect(
  x: number,
  y: number,
  width: number,
  height: number,
): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    toJSON: () => ({}),
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('aim-guard', () => {
  describe('resolveAnchorSide', () => {
    it('returns "right" when trigger is closer to submenu right edge', () => {
      // Submenu rect at x=100-300
      const rect = createDOMRect(100, 100, 200, 300)
      // Trigger center at x=400 - closer to submenu's right edge (300) than left (100)
      const triggerRect = createDOMRect(350, 150, 100, 40)

      const result = resolveAnchorSide(rect, triggerRect, 0)

      expect(result).toBe('right')
    })

    it('returns "left" when trigger is closer to submenu left edge', () => {
      // Submenu rect at x=400-600
      const rect = createDOMRect(400, 100, 200, 300)
      // Trigger center at x=150 - closer to submenu's left edge (400) than right (600)
      const triggerRect = createDOMRect(100, 150, 100, 40)

      const result = resolveAnchorSide(rect, triggerRect, 0)

      expect(result).toBe('left')
    })

    it('uses mouse position when no trigger rect provided', () => {
      const rect = createDOMRect(200, 100, 200, 300)

      // Mouse to the left of submenu
      expect(resolveAnchorSide(rect, null, 100)).toBe('left')

      // Mouse to the right of submenu
      expect(resolveAnchorSide(rect, null, 500)).toBe('right')
    })

    it('handles trigger centered on submenu edge', () => {
      const rect = createDOMRect(200, 100, 200, 300)
      // Trigger centered exactly on left edge (x=200)
      const triggerRect = createDOMRect(150, 150, 100, 40) // center at 200

      const result = resolveAnchorSide(rect, triggerRect, 0)

      expect(result).toBe('left')
    })

    it('returns "top" when trigger is above submenu', () => {
      const rect = createDOMRect(200, 200, 200, 160)
      const triggerRect = createDOMRect(230, 100, 80, 40)

      const result = resolveAnchorSide(rect, triggerRect, 0)

      expect(result).toBe('top')
    })

    it('returns "bottom" when trigger is below submenu', () => {
      const rect = createDOMRect(200, 120, 200, 160)
      const triggerRect = createDOMRect(230, 320, 80, 40)

      const result = resolveAnchorSide(rect, triggerRect, 0)

      expect(result).toBe('bottom')
    })

    it('uses both x and y mouse fallback when no trigger rect is provided', () => {
      const rect = createDOMRect(200, 120, 200, 160)

      expect(resolveAnchorSide(rect, null, 260, 80)).toBe('top')
      expect(resolveAnchorSide(rect, null, 260, 340)).toBe('bottom')
    })
  })

  describe('getSmoothedHeading', () => {
    it('calculates heading from mouse trail', () => {
      const trail: [number, number][] = [
        [100, 100],
        [110, 105],
        [120, 110],
        [130, 115],
        [140, 120],
      ]
      const rect = createDOMRect(200, 100, 200, 200)

      const result = getSmoothedHeading(trail, 140, 120, 'right', null, rect)

      // Should have positive dx (moving right) and positive dy (moving down)
      expect(result.dx).toBeGreaterThan(0)
      expect(result.dy).toBeGreaterThan(0)
    })

    it('infers direction toward submenu when movement is slow', () => {
      // Very short trail with minimal movement
      const trail: [number, number][] = [
        [100, 150],
        [100.1, 150.1],
      ]
      const rect = createDOMRect(200, 100, 200, 200) // Submenu to the right
      const triggerRect = createDOMRect(50, 140, 100, 40)

      const result = getSmoothedHeading(
        trail,
        100,
        150,
        'right',
        triggerRect,
        rect,
      )

      // Should infer direction toward the submenu (positive dx toward right edge)
      expect(result.dx).not.toBe(0)
    })

    it('handles empty trail', () => {
      const trail: [number, number][] = []
      const rect = createDOMRect(200, 100, 200, 200)

      const result = getSmoothedHeading(trail, 100, 150, 'right', null, rect)

      // Should still return a heading (inferred)
      expect(result).toHaveProperty('dx')
      expect(result).toHaveProperty('dy')
    })

    it('handles single point trail', () => {
      const trail: [number, number][] = [[100, 150]]
      const rect = createDOMRect(200, 100, 200, 200)

      const result = getSmoothedHeading(trail, 100, 150, 'right', null, rect)

      expect(result).toHaveProperty('dx')
      expect(result).toHaveProperty('dy')
    })

    it('infers vertical heading for top anchored submenu when movement is slow', () => {
      const trail: [number, number][] = [
        [220, 120],
        [220.05, 120.05],
      ]
      const rect = createDOMRect(160, 200, 180, 140)
      const triggerRect = createDOMRect(210, 120, 40, 40)

      const result = getSmoothedHeading(
        trail,
        220,
        120,
        'top',
        triggerRect,
        rect,
      )

      expect(result.dy).toBeGreaterThan(0)
    })
  })

  describe('willHitSubmenu', () => {
    // Note on anchor semantics:
    // - anchor='left' means trigger is on the LEFT of the submenu (user moves RIGHT toward it)
    // - anchor='right' means trigger is on the RIGHT of the submenu (user moves LEFT toward it)
    const submenuRect = createDOMRect(300, 100, 200, 200) // Submenu at x=300-500, y=100-300

    describe('with anchor="left" (trigger to the left, submenu to the right)', () => {
      it('returns true when heading toward submenu (moving right)', () => {
        // Trigger is to the left of submenu, user moves right toward it
        const result = willHitSubmenu(
          200, // exitX - to the left of submenu
          200, // exitY - vertically centered
          { dx: 10, dy: 0 }, // heading right toward submenu
          submenuRect,
          'left', // trigger anchored to submenu's left edge
          null,
        )

        expect(result).toBe(true)
      })

      it('returns false when heading away from submenu (moving left)', () => {
        const result = willHitSubmenu(
          200,
          200,
          { dx: -10, dy: 0 }, // heading left (away from submenu)
          submenuRect,
          'left',
          null,
        )

        expect(result).toBe(false)
      })

      it('returns false when heading above submenu', () => {
        const result = willHitSubmenu(
          200,
          200,
          { dx: 10, dy: -50 }, // heading right but steeply up
          submenuRect,
          'left',
          null,
        )

        expect(result).toBe(false)
      })

      it('returns false when heading below submenu', () => {
        const result = willHitSubmenu(
          200,
          200,
          { dx: 10, dy: 50 }, // heading right but steeply down
          submenuRect,
          'left',
          null,
        )

        expect(result).toBe(false)
      })

      it('returns true with slight vertical deviation toward submenu', () => {
        const result = willHitSubmenu(
          200,
          150, // slightly above center
          { dx: 10, dy: 2 }, // heading right with slight downward angle
          submenuRect,
          'left',
          null,
        )

        expect(result).toBe(true)
      })
    })

    describe('with anchor="right" (trigger to the right, submenu to the left)', () => {
      const leftSubmenuRect = createDOMRect(50, 100, 150, 200) // x=50-200

      it('returns true when heading toward submenu (moving left)', () => {
        const result = willHitSubmenu(
          300, // to the right of submenu
          200,
          { dx: -10, dy: 0 }, // heading left toward submenu
          leftSubmenuRect,
          'right', // trigger anchored to submenu's right edge
          null,
        )

        expect(result).toBe(true)
      })

      it('returns false when heading away from submenu (moving right)', () => {
        const result = willHitSubmenu(
          300,
          200,
          { dx: 10, dy: 0 }, // heading right (away from submenu)
          leftSubmenuRect,
          'right',
          null,
        )

        expect(result).toBe(false)
      })
    })

    describe('with anchor="top" (trigger above, submenu below)', () => {
      const belowSubmenuRect = createDOMRect(120, 200, 220, 160)

      it('returns true when heading down toward submenu', () => {
        const result = willHitSubmenu(
          220,
          120,
          { dx: 0, dy: 12 },
          belowSubmenuRect,
          'top',
          null,
        )

        expect(result).toBe(true)
      })

      it('returns false when heading away from submenu', () => {
        const result = willHitSubmenu(
          220,
          120,
          { dx: 0, dy: -12 },
          belowSubmenuRect,
          'top',
          null,
        )

        expect(result).toBe(false)
      })
    })

    describe('with anchor="bottom" (trigger below, submenu above)', () => {
      const aboveSubmenuRect = createDOMRect(120, 60, 220, 160)

      it('returns true when heading up toward submenu', () => {
        const result = willHitSubmenu(
          220,
          280,
          { dx: 0, dy: -10 },
          aboveSubmenuRect,
          'bottom',
          null,
        )

        expect(result).toBe(true)
      })

      it('returns false when heading away from submenu', () => {
        const result = willHitSubmenu(
          220,
          280,
          { dx: 0, dy: 10 },
          aboveSubmenuRect,
          'bottom',
          null,
        )

        expect(result).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('returns false when dx is near zero (no horizontal movement)', () => {
        const result = willHitSubmenu(
          200,
          200,
          { dx: 0.001, dy: 10 },
          submenuRect,
          'left', // trigger to the left, moving right
          null,
        )

        expect(result).toBe(false)
      })

      it('returns false when already past the submenu edge', () => {
        const result = willHitSubmenu(
          350, // already inside submenu x range (past left edge at 300)
          200,
          { dx: 10, dy: 0 }, // moving right
          submenuRect,
          'left', // trigger was to the left
          null,
        )

        // t would be negative since we're already past the left edge
        expect(result).toBe(false)
      })

      it('uses trigger rect for extra band calculation when provided', () => {
        const triggerRect = createDOMRect(100, 180, 80, 40) // trigger to the left

        // Test that the safe zone extends beyond the submenu bounds
        // With triggerRect.height=40, baseBand=30, extra=max(12, min(36, 30))=30
        // top = 100 - 30*0.25 = 92.5, bottom = 300 + 30*0.25 = 307.5
        const result = willHitSubmenu(
          200,
          95, // slightly above submenu top (100), but within extra band (92.5)
          { dx: 10, dy: 0.5 }, // heading right toward submenu
          submenuRect,
          'left', // trigger to the left
          triggerRect,
        )

        // Should still hit due to the extra band from trigger height
        expect(result).toBe(true)
      })
    })
  })
})
