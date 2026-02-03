import { describe, expect, it } from 'vitest'
import {
  compareItemEquality,
  defaultItemEquality,
  findItemIndex,
  itemIncludes,
  removeItem,
} from './item-equality.js'

describe('item-equality utilities', () => {
  describe('defaultItemEquality', () => {
    it('returns true for identical primitives', () => {
      expect(defaultItemEquality('apple', 'apple')).toBe(true)
      expect(defaultItemEquality(1, 1)).toBe(true)
      expect(defaultItemEquality(true, true)).toBe(true)
    })

    it('returns false for different primitives', () => {
      expect(defaultItemEquality('apple', 'banana')).toBe(false)
      expect(defaultItemEquality(1, 2)).toBe(false)
      expect(defaultItemEquality(true, false)).toBe(false)
    })

    it('returns true for same object reference', () => {
      const obj = { id: 1, name: 'Apple' }
      expect(defaultItemEquality(obj, obj)).toBe(true)
    })

    it('returns false for different object references with same content', () => {
      const obj1 = { id: 1, name: 'Apple' }
      const obj2 = { id: 1, name: 'Apple' }
      expect(defaultItemEquality(obj1, obj2)).toBe(false)
    })

    it('handles null and undefined', () => {
      expect(defaultItemEquality(null, null)).toBe(true)
      expect(defaultItemEquality(undefined, undefined)).toBe(true)
      expect(defaultItemEquality(null, undefined)).toBe(false)
      expect(defaultItemEquality('apple', null)).toBe(false)
    })

    it('handles NaN correctly (Object.is behavior)', () => {
      expect(defaultItemEquality(Number.NaN, Number.NaN)).toBe(true)
    })

    it('distinguishes +0 and -0 (Object.is behavior)', () => {
      expect(defaultItemEquality(0, -0)).toBe(false)
    })
  })

  describe('compareItemEquality', () => {
    it('uses the provided comparer for non-null values', () => {
      const idComparer = (a: { id: number }, b: { id: number }) => a.id === b.id
      const obj1 = { id: 1, name: 'Apple' }
      const obj2 = { id: 1, name: 'Different Name' }
      const obj3 = { id: 2, name: 'Banana' }

      expect(compareItemEquality(obj1, obj2, idComparer)).toBe(true)
      expect(compareItemEquality(obj1, obj3, idComparer)).toBe(false)
    })

    it('uses Object.is for null values regardless of comparer', () => {
      const customComparer = () => true // Always return true
      expect(compareItemEquality(null, null, customComparer)).toBe(true)
      expect(compareItemEquality(null, 'apple', customComparer)).toBe(false)
      expect(compareItemEquality('apple', null, customComparer)).toBe(false)
    })

    it('uses Object.is for undefined values regardless of comparer', () => {
      const customComparer = () => true
      expect(compareItemEquality(undefined, undefined, customComparer)).toBe(
        true,
      )
      expect(compareItemEquality(undefined, 'apple', customComparer)).toBe(
        false,
      )
    })
  })

  describe('itemIncludes', () => {
    it('returns true when value is found with default equality', () => {
      const fruits = ['apple', 'banana', 'cherry']
      expect(itemIncludes(fruits, 'banana', defaultItemEquality)).toBe(true)
    })

    it('returns false when value is not found', () => {
      const fruits = ['apple', 'banana', 'cherry']
      expect(itemIncludes(fruits, 'mango', defaultItemEquality)).toBe(false)
    })

    it('returns false for empty collection', () => {
      expect(itemIncludes([], 'apple', defaultItemEquality)).toBe(false)
    })

    it('returns false for null/undefined collection', () => {
      expect(itemIncludes(null, 'apple', defaultItemEquality)).toBe(false)
      expect(itemIncludes(undefined, 'apple', defaultItemEquality)).toBe(false)
    })

    it('finds objects using custom equality comparer', () => {
      const items = [
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Banana' },
        { id: 3, name: 'Cherry' },
      ]
      const idComparer = (a: { id: number }, b: { id: number }) => a.id === b.id

      expect(
        itemIncludes(items, { id: 2, name: 'Different' }, idComparer),
      ).toBe(true)
      expect(itemIncludes(items, { id: 99, name: 'Missing' }, idComparer)).toBe(
        false,
      )
    })

    it('skips undefined items in collection', () => {
      const items = ['apple', undefined, 'cherry'] as (string | undefined)[]
      expect(itemIncludes(items, 'apple', defaultItemEquality)).toBe(true)
      expect(itemIncludes(items, 'banana', defaultItemEquality)).toBe(false)
    })
  })

  describe('findItemIndex', () => {
    it('returns correct index when value is found', () => {
      const fruits = ['apple', 'banana', 'cherry']
      expect(findItemIndex(fruits, 'apple', defaultItemEquality)).toBe(0)
      expect(findItemIndex(fruits, 'banana', defaultItemEquality)).toBe(1)
      expect(findItemIndex(fruits, 'cherry', defaultItemEquality)).toBe(2)
    })

    it('returns -1 when value is not found', () => {
      const fruits = ['apple', 'banana', 'cherry']
      expect(findItemIndex(fruits, 'mango', defaultItemEquality)).toBe(-1)
    })

    it('returns -1 for empty collection', () => {
      expect(findItemIndex([], 'apple', defaultItemEquality)).toBe(-1)
    })

    it('returns -1 for null/undefined collection', () => {
      expect(findItemIndex(null, 'apple', defaultItemEquality)).toBe(-1)
      expect(findItemIndex(undefined, 'apple', defaultItemEquality)).toBe(-1)
    })

    it('finds objects using custom equality comparer', () => {
      const items = [
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Banana' },
        { id: 3, name: 'Cherry' },
      ]
      const idComparer = (a: { id: number }, b: { id: number }) => a.id === b.id

      expect(
        findItemIndex(items, { id: 2, name: 'Different' }, idComparer),
      ).toBe(1)
      expect(
        findItemIndex(items, { id: 99, name: 'Missing' }, idComparer),
      ).toBe(-1)
    })
  })

  describe('removeItem', () => {
    it('removes matching item from collection', () => {
      const fruits = ['apple', 'banana', 'cherry']
      const result = removeItem(fruits, 'banana', defaultItemEquality)

      expect(result).toEqual(['apple', 'cherry'])
      // Original array should be unchanged
      expect(fruits).toEqual(['apple', 'banana', 'cherry'])
    })

    it('returns same items if value not found', () => {
      const fruits = ['apple', 'banana', 'cherry']
      const result = removeItem(fruits, 'mango', defaultItemEquality)

      expect(result).toEqual(['apple', 'banana', 'cherry'])
    })

    it('removes only first matching item with reference equality', () => {
      const fruits = ['apple', 'banana', 'apple', 'cherry']
      const result = removeItem(fruits, 'apple', defaultItemEquality)

      // Both 'apple' strings are equal, so both should be removed
      expect(result).toEqual(['banana', 'cherry'])
    })

    it('removes objects using custom equality comparer', () => {
      const items = [
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Banana' },
        { id: 3, name: 'Cherry' },
      ]
      const idComparer = (a: { id: number }, b: { id: number }) => a.id === b.id

      const result = removeItem(
        items,
        { id: 2, name: 'Different Name' },
        idComparer,
      )

      expect(result).toHaveLength(2)
      expect(result.map((i) => i.id)).toEqual([1, 3])
    })

    it('returns empty array when removing from empty collection', () => {
      const result = removeItem([], 'apple', defaultItemEquality)
      expect(result).toEqual([])
    })
  })

  describe('real-world object value scenarios', () => {
    interface Fruit {
      id: number
      name: string
      color: string
    }

    const fruits: Fruit[] = [
      { id: 1, name: 'Apple', color: 'red' },
      { id: 2, name: 'Banana', color: 'yellow' },
      { id: 3, name: 'Cherry', color: 'red' },
    ]

    const byId = (a: Fruit, b: Fruit) => a.id === b.id

    it('supports selection by ID even when object reference differs', () => {
      const selectedValue = { id: 2, name: 'Banana', color: 'yellow' }
      const newReference = { id: 2, name: 'Updated Banana', color: 'yellow' }

      // Even though the object reference changed, selection should match by ID
      expect(itemIncludes(fruits, newReference, byId)).toBe(true)
      expect(compareItemEquality(selectedValue, newReference, byId)).toBe(true)
    })

    it('supports multi-select toggle with object values', () => {
      let selectedValues: Fruit[] = []

      // Select first fruit
      const fruit1 = { id: 1, name: 'Apple', color: 'red' }
      if (!itemIncludes(selectedValues, fruit1, byId)) {
        selectedValues = [...selectedValues, fruit1]
      }
      expect(selectedValues).toHaveLength(1)

      // Select second fruit
      const fruit2 = { id: 2, name: 'Banana', color: 'yellow' }
      if (!itemIncludes(selectedValues, fruit2, byId)) {
        selectedValues = [...selectedValues, fruit2]
      }
      expect(selectedValues).toHaveLength(2)

      // Deselect first fruit (using different object reference)
      const fruit1Again = { id: 1, name: 'Apple Updated', color: 'red' }
      if (itemIncludes(selectedValues, fruit1Again, byId)) {
        selectedValues = removeItem(selectedValues, fruit1Again, byId)
      }
      expect(selectedValues).toHaveLength(1)
      expect(selectedValues[0].id).toBe(2)
    })
  })
})
