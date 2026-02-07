import { describe, expect, it } from 'vitest'
import { sortOperations } from '../core/sort.js'
import type { SortState } from '../core/types.js'

// ── sortOperations ──────────────────────────────────────────

describe('core/sort', () => {
  // ── toggleColumnSort ────────────────────────────────────────

  describe('sortOperations.toggleColumnSort', () => {
    it('should add a desc sort when column has no existing sort', () => {
      const sort: SortState = []
      const result = sortOperations.toggleColumnSort(sort, 'name')
      expect(result).toEqual([
        { type: 'column', columnId: 'name', direction: 'desc' },
      ])
    })

    it('should toggle desc → asc', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'name', direction: 'desc' },
      ]
      const result = sortOperations.toggleColumnSort(sort, 'name')
      expect(result).toEqual([
        { type: 'column', columnId: 'name', direction: 'asc' },
      ])
    })

    it('should toggle asc → none (removal)', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'name', direction: 'asc' },
      ]
      const result = sortOperations.toggleColumnSort(sort, 'name')
      expect(result).toEqual([])
    })

    it('should preserve custom sorts when toggling column sort', () => {
      const sort: SortState = [
        { type: 'custom', id: 'relevance', enabled: true },
      ]
      const result = sortOperations.toggleColumnSort(sort, 'name')
      expect(result).toEqual([
        { type: 'custom', id: 'relevance', enabled: true },
        { type: 'column', columnId: 'name', direction: 'desc' },
      ])
    })

    it('should preserve custom sorts when removing column sort', () => {
      const sort: SortState = [
        { type: 'custom', id: 'relevance', enabled: true },
        { type: 'column', columnId: 'name', direction: 'asc' },
      ]
      const result = sortOperations.toggleColumnSort(sort, 'name')
      expect(result).toEqual([
        { type: 'custom', id: 'relevance', enabled: true },
      ])
    })

    it('should support multi-column sort (add second column)', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'name', direction: 'desc' },
      ]
      const result = sortOperations.toggleColumnSort(sort, 'age')
      expect(result).toEqual([
        { type: 'column', columnId: 'name', direction: 'desc' },
        { type: 'column', columnId: 'age', direction: 'desc' },
      ])
    })

    it('should toggle one column without affecting others', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'name', direction: 'desc' },
        { type: 'column', columnId: 'age', direction: 'desc' },
      ]
      const result = sortOperations.toggleColumnSort(sort, 'name')
      expect(result).toEqual([
        { type: 'column', columnId: 'name', direction: 'asc' },
        { type: 'column', columnId: 'age', direction: 'desc' },
      ])
    })

    it('should use custom defaultDirection parameter', () => {
      const sort: SortState = []
      const result = sortOperations.toggleColumnSort(sort, 'name', 'asc')
      expect(result).toEqual([
        { type: 'column', columnId: 'name', direction: 'asc' },
      ])
    })

    it('should cycle with custom defaultDirection: asc → none (removal)', () => {
      // When defaultDirection is 'asc', the cycle is: none → asc → none
      // But nextDirection returns: undefined → defaultDirection, desc → asc, asc → undefined
      // So with defaultDirection 'asc': none → asc, then asc → undefined (removal)
      const sort: SortState = [
        { type: 'column', columnId: 'name', direction: 'asc' },
      ]
      const result = sortOperations.toggleColumnSort(sort, 'name', 'asc')
      expect(result).toEqual([])
    })

    it('should not mutate the original sort array', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'name', direction: 'desc' },
      ]
      const original = [...sort]
      sortOperations.toggleColumnSort(sort, 'name')
      expect(sort).toEqual(original)
    })
  })

  // ── setCustomSort ────────────────────────────────────────────

  describe('sortOperations.setCustomSort', () => {
    it('should add a new custom sort rule', () => {
      const sort: SortState = []
      const result = sortOperations.setCustomSort(sort, 'relevance', true)
      expect(result).toEqual([
        { type: 'custom', id: 'relevance', enabled: true },
      ])
    })

    it('should update an existing custom sort rule', () => {
      const sort: SortState = [
        { type: 'custom', id: 'relevance', enabled: true },
      ]
      const result = sortOperations.setCustomSort(sort, 'relevance', true)
      expect(result).toEqual([
        { type: 'custom', id: 'relevance', enabled: true },
      ])
    })

    it('should remove a custom sort when enabled is false', () => {
      const sort: SortState = [
        { type: 'custom', id: 'relevance', enabled: true },
      ]
      const result = sortOperations.setCustomSort(sort, 'relevance', false)
      expect(result).toEqual([])
    })

    it('should return same array when removing non-existent custom sort', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'name', direction: 'desc' },
      ]
      const result = sortOperations.setCustomSort(sort, 'relevance', false)
      expect(result).toBe(sort) // same reference
    })

    it('should preserve column sorts when adding custom sort', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'name', direction: 'desc' },
      ]
      const result = sortOperations.setCustomSort(sort, 'relevance', true)
      expect(result).toEqual([
        { type: 'column', columnId: 'name', direction: 'desc' },
        { type: 'custom', id: 'relevance', enabled: true },
      ])
    })

    it('should preserve column sorts when removing custom sort', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'name', direction: 'desc' },
        { type: 'custom', id: 'relevance', enabled: true },
      ]
      const result = sortOperations.setCustomSort(sort, 'relevance', false)
      expect(result).toEqual([
        { type: 'column', columnId: 'name', direction: 'desc' },
      ])
    })

    it('should not mutate the original sort array', () => {
      const sort: SortState = []
      sortOperations.setCustomSort(sort, 'relevance', true)
      expect(sort).toEqual([])
    })
  })

  // ── setSort ──────────────────────────────────────────────────

  describe('sortOperations.setSort', () => {
    it('should return the provided sort state', () => {
      const newSort: SortState = [
        { type: 'column', columnId: 'name', direction: 'asc' },
        { type: 'custom', id: 'relevance', enabled: true },
      ]
      const result = sortOperations.setSort(newSort)
      expect(result).toBe(newSort) // same reference
    })

    it('should replace the entire sort state', () => {
      const newSort: SortState = [
        { type: 'column', columnId: 'age', direction: 'desc' },
      ]
      const result = sortOperations.setSort(newSort)
      expect(result).toEqual([
        { type: 'column', columnId: 'age', direction: 'desc' },
      ])
    })

    it('should allow setting an empty sort state', () => {
      const result = sortOperations.setSort([])
      expect(result).toEqual([])
    })
  })

  // ── clearSort ────────────────────────────────────────────────

  describe('sortOperations.clearSort', () => {
    it('should return an empty array', () => {
      const result = sortOperations.clearSort()
      expect(result).toEqual([])
    })

    it('should return a new empty array each time', () => {
      const a = sortOperations.clearSort()
      const b = sortOperations.clearSort()
      expect(a).toEqual(b)
      expect(a).not.toBe(b) // different references
    })
  })
})
