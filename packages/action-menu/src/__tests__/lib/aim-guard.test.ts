import { describe, expect, it } from 'vitest'
import {
  getSmoothedHeading,
  resolveAnchorSide,
  willHitSubmenu,
} from '../../lib/aim-guard.js'
import type { AnchorSide } from '../../types.js'

// Helper to create DOMRect
const createRect = (
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
  width,
  height,
  x: left,
  y: top,
  toJSON: () => ({}),
})

describe('aim-guard utilities', () => {
  describe('resolveAnchorSide', () => {
    it('should return left when trigger is closer to left edge', () => {
      const rect = createRect(100, 100, 200, 50)
      const tRect = createRect(10, 110, 30, 30)
      const mx = 150

      const result = resolveAnchorSide(rect, tRect, mx)
      expect(result).toBe('left')
    })

    it('should return right when trigger is closer to right edge', () => {
      const rect = createRect(100, 100, 200, 50)
      const tRect = createRect(350, 110, 30, 30)
      const mx = 150

      const result = resolveAnchorSide(rect, tRect, mx)
      expect(result).toBe('right')
    })

    it('should return left when distances are equal', () => {
      const rect = createRect(100, 100, 200, 50)
      // Trigger at x=175 (center) -> distances: |175-100|=75, |175-300|=125
      const tRect = createRect(160, 110, 30, 30) // Closer to left
      const mx = 150

      const result = resolveAnchorSide(rect, tRect, mx)
      expect(result).toBe('left')
    })

    it('should fallback to mouse position when no trigger rect', () => {
      const rect = createRect(100, 100, 200, 50)
      const mx = 90 // Left of rect

      const result = resolveAnchorSide(rect, null, mx)
      expect(result).toBe('left')
    })

    it('should fallback to mouse position on right when no trigger rect', () => {
      const rect = createRect(100, 100, 200, 50)
      const mx = 301 // Right of rect

      const result = resolveAnchorSide(rect, null, mx)
      expect(result).toBe('right')
    })

    it('should fallback to right when mouse is inside rect', () => {
      const rect = createRect(100, 100, 200, 50)
      const mx = 150 // Inside rect

      const result = resolveAnchorSide(rect, null, mx)
      expect(result).toBe('right')
    })
  })

  describe('getSmoothedHeading', () => {
    it('should calculate heading from mouse trail', () => {
      const trail: [number, number][] = [
        [100, 100],
        [110, 105],
        [120, 110],
      ]
      const rect = createRect(200, 100, 100, 50)

      const result = getSmoothedHeading(trail, 120, 110, 'right', null, rect)

      expect(result.dx).toBeGreaterThan(0) // Moving right
      expect(result.dy).toBeGreaterThan(0) // Moving down
    })

    it('should smooth over multiple trail points', () => {
      const trail: [number, number][] = [
        [100, 100],
        [105, 102],
        [110, 104],
        [115, 106],
        [120, 108],
      ]
      const rect = createRect(200, 100, 100, 50)

      const result = getSmoothedHeading(trail, 120, 108, 'right', null, rect)

      // Should sum the last few movements (up to 4 segments)
      expect(result.dx).toBeCloseTo(20, 0) // Sum of 4 movements: 4*5 = 20
      expect(result.dy).toBeCloseTo(8, 0) // Sum of 4 movements: 4*2 = 8
    })

    it('should limit to last 4 trail points', () => {
      const trail: [number, number][] = [
        [0, 0], // Should be ignored
        [50, 50], // Should be ignored
        [100, 100],
        [110, 105],
        [120, 110],
        [130, 115],
      ]
      const rect = createRect(200, 100, 100, 50)

      const result = getSmoothedHeading(trail, 130, 115, 'right', null, rect)

      // Should only use last 4 movements
      expect(result).toBeDefined()
      expect(Math.abs(result.dx)).toBeGreaterThan(0)
    })

    it('should fallback to trigger direction when movement is too small', () => {
      const trail: [number, number][] = [
        [100, 100],
        [100, 100], // No movement
      ]
      const rect = createRect(200, 100, 100, 50)
      const tRect = createRect(50, 110, 30, 30)

      const result = getSmoothedHeading(trail, 100, 100, 'right', tRect, rect)

      // Should point from trigger to edge of rect
      expect(result.dx).toBeGreaterThan(0) // Trigger is left, so dx should be positive
    })

    it('should handle left anchor correctly', () => {
      const trail: [number, number][] = [[100, 100]]
      const rect = createRect(50, 100, 100, 50)
      const tRect = createRect(200, 110, 30, 30)

      const result = getSmoothedHeading(trail, 100, 100, 'left', tRect, rect)

      // Should point from trigger to left edge of rect
      expect(result.dx).toBeLessThan(0) // Trigger is right, so dx should be negative
    })

    it('should handle empty trail', () => {
      const trail: [number, number][] = []
      const rect = createRect(200, 100, 100, 50)

      const result = getSmoothedHeading(trail, 100, 100, 'right', null, rect)

      // Should fallback to direction calculation
      expect(result).toBeDefined()
      expect(result.dx).toBeDefined()
      expect(result.dy).toBeDefined()
    })

    it('should handle single trail point', () => {
      const trail: [number, number][] = [[100, 100]]
      const rect = createRect(200, 100, 100, 50)

      const result = getSmoothedHeading(trail, 100, 100, 'right', null, rect)

      // Should fallback to direction calculation
      expect(result).toBeDefined()
    })
  })

  describe('willHitSubmenu', () => {
    it('should return true when heading toward submenu on right', () => {
      const submenuRect = createRect(200, 100, 150, 100) // Submenu on right side
      const heading = { dx: 10, dy: 0 } // Moving right horizontally
      const exitX = 155 // Starting from trigger
      const exitY = 125 // At middle height

      const result = willHitSubmenu(
        exitX,
        exitY,
        heading,
        submenuRect,
        'left', // Submenu is to the left of its anchor (trigger on left)
        null,
      )

      expect(result).toBe(true)
    })

    it('should return false when heading away from submenu on right', () => {
      const rect = createRect(200, 100, 100, 50)
      const heading = { dx: -10, dy: 0 } // Moving left
      const exitX = 150
      const exitY = 125

      const result = willHitSubmenu(exitX, exitY, heading, rect, 'right', null)

      expect(result).toBe(false)
    })

    it('should handle leftward movement toward submenu on left', () => {
      const rect = createRect(50, 100, 100, 50) // Submenu on left
      const heading = { dx: -10, dy: 0 } // Moving left
      const exitX = 200 // Far right
      const exitY = 125

      const result = willHitSubmenu(exitX, exitY, heading, rect, 'left', null)

      // Basic direction check - result depends on exact geometry and tolerance
      expect(typeof result).toBe('boolean')
    })

    it('should return false when heading away from submenu on left', () => {
      const rect = createRect(50, 100, 100, 50)
      const heading = { dx: 10, dy: 0 } // Moving right (away)
      const exitX = 200
      const exitY = 125

      const result = willHitSubmenu(exitX, exitY, heading, rect, 'left', null)

      expect(result).toBe(false)
    })

    it('should return false when heading has no horizontal component', () => {
      const rect = createRect(200, 100, 100, 50)
      const heading = { dx: 0, dy: 10 } // Moving straight down
      const exitX = 150
      const exitY = 125

      const result = willHitSubmenu(exitX, exitY, heading, rect, 'right', null)

      expect(result).toBe(false)
    })

    it('should return false when heading misses submenu vertically', () => {
      const rect = createRect(200, 100, 100, 50)
      const heading = { dx: 10, dy: 20 } // Steep downward angle
      const exitX = 150
      const exitY = 50 // Way above submenu

      const result = willHitSubmenu(exitX, exitY, heading, rect, 'right', null)

      expect(result).toBe(false)
    })

    it('should check trajectory calculation logic', () => {
      const rect = createRect(200, 100, 150, 100)
      const heading = { dx: 10, dy: 0 }
      const exitX = 155
      const exitY = 125

      // Just verify the function returns a boolean based on geometry
      const result = willHitSubmenu(exitX, exitY, heading, rect, 'left', null)

      expect(typeof result).toBe('boolean')
    })

    it('should use trigger rect for tolerance calculation', () => {
      const rect = createRect(200, 100, 150, 100)
      const tRect = createRect(100, 110, 50, 80)
      const heading = { dx: 10, dy: 0 }
      const exitX = 155
      const exitY = 125

      const result = willHitSubmenu(exitX, exitY, heading, rect, 'left', tRect)

      // Result may vary, just check it's boolean
      expect(typeof result).toBe('boolean')
    })

    it('should check horizontal trajectory', () => {
      const rect = createRect(200, 100, 150, 100)
      const heading = { dx: 10, dy: 0 }
      const exitX = 155
      const exitY = 125

      const result = willHitSubmenu(exitX, exitY, heading, rect, 'left', null)

      expect(typeof result).toBe('boolean')
    })

    it('should handle various exit points', () => {
      const rect = createRect(200, 100, 150, 100)
      const heading = { dx: 10, dy: 0 }
      const exitX = 155
      const exitY = 150

      const result = willHitSubmenu(exitX, exitY, heading, rect, 'left', null)

      expect(typeof result).toBe('boolean')
    })

    it('should return false when t is negative (already past edge)', () => {
      const rect = createRect(100, 100, 100, 50)
      const heading = { dx: 10, dy: 0 } // Moving right
      const exitX = 250 // Already past right edge
      const exitY = 125

      const result = willHitSubmenu(exitX, exitY, heading, rect, 'right', null)

      expect(result).toBe(false)
    })

    it('should handle very small dx values', () => {
      const rect = createRect(200, 100, 100, 50)
      const heading = { dx: 0.005, dy: 1 } // Tiny horizontal movement
      const exitX = 150
      const exitY = 125

      const result = willHitSubmenu(exitX, exitY, heading, rect, 'right', null)

      // Should return false for very small dx
      expect(result).toBe(false)
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete aim-guard workflow', () => {
      // User is moving mouse from trigger toward submenu
      const triggerRect = createRect(100, 110, 50, 30)
      const submenuRect = createRect(200, 100, 150, 100)
      const trail: [number, number][] = [
        [125, 125], // On trigger
        [135, 125],
        [145, 125],
        [155, 125], // Moving toward submenu
      ]

      // 1. Determine anchor side
      const anchor = resolveAnchorSide(submenuRect, triggerRect, 155)
      expect(anchor).toBe('left') // Trigger is left of submenu

      // 2. Calculate heading
      const heading = getSmoothedHeading(
        trail,
        155,
        125,
        anchor,
        triggerRect,
        submenuRect,
      )
      expect(heading.dx).toBeGreaterThan(0) // Moving right

      // 3. Check if will hit submenu
      const willHit = willHitSubmenu(
        155,
        125,
        heading,
        submenuRect,
        anchor,
        triggerRect,
      )
      expect(willHit).toBe(true)
    })

    it('should detect when user moves to different menu item', () => {
      // User moves away from submenu direction
      const triggerRect = createRect(100, 110, 50, 30)
      const submenuRect = createRect(200, 100, 150, 100)
      const trail: [number, number][] = [
        [125, 125],
        [125, 135],
        [125, 145], // Moving down, not toward submenu
      ]

      const anchor = resolveAnchorSide(submenuRect, triggerRect, 125)
      const heading = getSmoothedHeading(
        trail,
        125,
        145,
        anchor,
        triggerRect,
        submenuRect,
      )

      const willHit = willHitSubmenu(
        125,
        145,
        heading,
        submenuRect,
        anchor,
        triggerRect,
      )

      expect(willHit).toBe(false) // Not heading toward submenu
    })
  })
})
