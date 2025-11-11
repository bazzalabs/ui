import { describe, expect, it } from 'vitest'
import { isInBounds } from '../../lib/dom-utils.js'

describe('isInBounds', () => {
  // Helper to create a DOMRect-like object
  const createRect = (
    left: number,
    top: number,
    right: number,
    bottom: number,
  ): DOMRect => ({
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    x: left,
    y: top,
    toJSON: () => ({}),
  })

  describe('point inside bounds', () => {
    it('should return true when point is clearly inside bounds', () => {
      const rect = createRect(0, 0, 100, 100)
      expect(isInBounds(50, 50, rect)).toBe(true)
    })

    it('should return true when point is inside bounds with negative coordinates', () => {
      const rect = createRect(-100, -100, 0, 0)
      expect(isInBounds(-50, -50, rect)).toBe(true)
    })

    it('should return true when point is inside bounds with mixed coordinates', () => {
      const rect = createRect(-50, -50, 50, 50)
      expect(isInBounds(0, 0, rect)).toBe(true)
    })
  })

  describe('point on boundary', () => {
    const rect = createRect(0, 0, 100, 100)

    it('should return true when point is on left edge', () => {
      expect(isInBounds(0, 50, rect)).toBe(true)
    })

    it('should return true when point is on right edge', () => {
      expect(isInBounds(100, 50, rect)).toBe(true)
    })

    it('should return true when point is on top edge', () => {
      expect(isInBounds(50, 0, rect)).toBe(true)
    })

    it('should return true when point is on bottom edge', () => {
      expect(isInBounds(50, 100, rect)).toBe(true)
    })

    it('should return true when point is on top-left corner', () => {
      expect(isInBounds(0, 0, rect)).toBe(true)
    })

    it('should return true when point is on bottom-right corner', () => {
      expect(isInBounds(100, 100, rect)).toBe(true)
    })
  })

  describe('point outside bounds', () => {
    const rect = createRect(0, 0, 100, 100)

    it('should return false when point is left of bounds', () => {
      expect(isInBounds(-1, 50, rect)).toBe(false)
    })

    it('should return false when point is right of bounds', () => {
      expect(isInBounds(101, 50, rect)).toBe(false)
    })

    it('should return false when point is above bounds', () => {
      expect(isInBounds(50, -1, rect)).toBe(false)
    })

    it('should return false when point is below bounds', () => {
      expect(isInBounds(50, 101, rect)).toBe(false)
    })

    it('should return false when point is far outside bounds', () => {
      expect(isInBounds(200, 200, rect)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle zero-width rectangle', () => {
      const rect = createRect(50, 0, 50, 100)
      expect(isInBounds(50, 50, rect)).toBe(true)
      expect(isInBounds(49, 50, rect)).toBe(false)
      expect(isInBounds(51, 50, rect)).toBe(false)
    })

    it('should handle zero-height rectangle', () => {
      const rect = createRect(0, 50, 100, 50)
      expect(isInBounds(50, 50, rect)).toBe(true)
      expect(isInBounds(50, 49, rect)).toBe(false)
      expect(isInBounds(50, 51, rect)).toBe(false)
    })

    it('should handle single-point rectangle', () => {
      const rect = createRect(50, 50, 50, 50)
      expect(isInBounds(50, 50, rect)).toBe(true)
      expect(isInBounds(49, 50, rect)).toBe(false)
      expect(isInBounds(51, 50, rect)).toBe(false)
      expect(isInBounds(50, 49, rect)).toBe(false)
      expect(isInBounds(50, 51, rect)).toBe(false)
    })

    it('should handle floating point coordinates', () => {
      const rect = createRect(0, 0, 100, 100)
      expect(isInBounds(50.5, 50.5, rect)).toBe(true)
      expect(isInBounds(0.1, 0.1, rect)).toBe(true)
      expect(isInBounds(99.9, 99.9, rect)).toBe(true)
      expect(isInBounds(-0.1, 50, rect)).toBe(false)
      expect(isInBounds(100.1, 50, rect)).toBe(false)
    })
  })
})
