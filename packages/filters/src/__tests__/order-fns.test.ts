import { describe, expect, it } from 'vitest'
import { createColumnConfigHelper } from '../core/columns/index.js'
import type { ColumnOption, TCustomOrderFn } from '../core/types.js'
import {
  applyOrderFns,
  isBuiltInOrderFnName,
  isBuiltInOrderFnTuple,
  isCustomOrderFn,
  isOrderDirection,
  isOrderFnArg,
  orderFns,
} from '../lib/order-fns.js'

// Test data
const testOptions: ColumnOption[] = [
  { value: 'apple', label: 'Apple', count: 5 },
  { value: 'banana', label: 'Banana', count: 3 },
  { value: 'cherry', label: 'Cherry', count: 8 },
  { value: 'date', label: 'Date', count: 1 },
  { value: 'elderberry', label: 'Elderberry', count: 3 }, // Same count as banana
]

type TestData = {
  fruit: string
}

const helper = createColumnConfigHelper<TestData>()

describe('lib/order-fns', () => {
  describe('Built-in order functions', () => {
    describe('count function', () => {
      it('should sort by count ascending', () => {
        const result = orderFns.count(
          { value: 'a', label: 'A', count: 5 },
          { value: 'b', label: 'B', count: 3 },
          'asc',
        )
        expect(result).toBeGreaterThan(0)
      })

      it('should sort by count descending', () => {
        const result = orderFns.count(
          { value: 'a', label: 'A', count: 5 },
          { value: 'b', label: 'B', count: 3 },
          'desc',
        )
        expect(result).toBeLessThan(0)
      })

      it('should handle undefined count as 0', () => {
        const result = orderFns.count(
          { value: 'a', label: 'A' }, // No count property
          { value: 'b', label: 'B', count: 3 },
          'asc',
        )
        expect(result).toBeLessThan(0)
      })

      it('should return 0 for equal counts', () => {
        const result = orderFns.count(
          { value: 'a', label: 'A', count: 5 },
          { value: 'b', label: 'B', count: 5 },
          'asc',
        )
        expect(result).toBe(0)
      })
    })

    describe('label function', () => {
      it('should sort by label ascending', () => {
        const result = orderFns.label(
          { value: 'b', label: 'Banana' },
          { value: 'a', label: 'Apple' },
          'asc',
        )
        expect(result).toBeGreaterThan(0) // 'banana' > 'apple'
      })

      it('should sort by label descending', () => {
        const result = orderFns.label(
          { value: 'a', label: 'Apple' },
          { value: 'b', label: 'Banana' },
          'desc',
        )
        expect(result).toBeGreaterThan(0) // 'banana' > 'apple' (reversed)
      })

      it('should be case insensitive', () => {
        const result = orderFns.label(
          { value: 'a', label: 'APPLE' },
          { value: 'b', label: 'banana' },
          'asc',
        )
        expect(result).toBeLessThan(0) // 'apple' < 'banana'
      })

      it('should return 0 for equal labels', () => {
        const result = orderFns.label(
          { value: 'a', label: 'Apple' },
          { value: 'b', label: 'Apple' },
          'asc',
        )
        expect(result).toBe(0)
      })
    })
  })

  describe('Type guards', () => {
    describe('isBuiltInOrderFnName', () => {
      it('should return true for valid built-in function names', () => {
        expect(isBuiltInOrderFnName('count')).toBe(true)
        expect(isBuiltInOrderFnName('label')).toBe(true)
      })

      it('should return false for invalid function names', () => {
        expect(isBuiltInOrderFnName('invalid')).toBe(false)
        expect(isBuiltInOrderFnName('')).toBe(false)
        expect(isBuiltInOrderFnName(123)).toBe(false)
        expect(isBuiltInOrderFnName(null)).toBe(false)
        expect(isBuiltInOrderFnName(undefined)).toBe(false)
      })
    })

    describe('isOrderDirection', () => {
      it('should return true for valid directions', () => {
        expect(isOrderDirection('asc')).toBe(true)
        expect(isOrderDirection('desc')).toBe(true)
      })

      it('should return false for invalid directions', () => {
        expect(isOrderDirection('ascending')).toBe(false)
        expect(isOrderDirection('up')).toBe(false)
        expect(isOrderDirection('')).toBe(false)
        expect(isOrderDirection(123)).toBe(false)
        expect(isOrderDirection(null)).toBe(false)
        expect(isOrderDirection(undefined)).toBe(false)
      })
    })

    describe('isCustomOrderFn', () => {
      const validCustomFn: TCustomOrderFn = (a, b) =>
        a.label.localeCompare(b.label)
      const invalidFn = (a: any) => a // Wrong arity

      it('should return true for valid custom functions', () => {
        expect(isCustomOrderFn(validCustomFn)).toBe(true)
      })

      it('should return false for functions with wrong arity', () => {
        expect(isCustomOrderFn(invalidFn)).toBe(false)
        expect(isCustomOrderFn(() => 0)).toBe(false) // 0 parameters
        expect(isCustomOrderFn((_a: any, _b: any, _c: any) => 0)).toBe(false) // 3 parameters
      })

      it('should return false for non-functions', () => {
        expect(isCustomOrderFn('not a function')).toBe(false)
        expect(isCustomOrderFn(123)).toBe(false)
        expect(isCustomOrderFn(null)).toBe(false)
        expect(isCustomOrderFn(undefined)).toBe(false)
        expect(isCustomOrderFn({})).toBe(false)
      })
    })

    describe('isBuiltInOrderFnTuple', () => {
      it('should return true for valid tuples', () => {
        expect(isBuiltInOrderFnTuple(['count', 'asc'])).toBe(true)
        expect(isBuiltInOrderFnTuple(['label', 'desc'])).toBe(true)
      })

      it('should return false for invalid tuples', () => {
        expect(isBuiltInOrderFnTuple(['invalid', 'asc'])).toBe(false)
        expect(isBuiltInOrderFnTuple(['count', 'invalid'])).toBe(false)
        expect(isBuiltInOrderFnTuple(['count'])).toBe(false) // Wrong length
        expect(isBuiltInOrderFnTuple(['count', 'asc', 'extra'])).toBe(false) // Wrong length
        expect(isBuiltInOrderFnTuple('not an array')).toBe(false)
        expect(isBuiltInOrderFnTuple(null)).toBe(false)
        expect(isBuiltInOrderFnTuple(undefined)).toBe(false)
      })
    })

    describe('isOrderFnArg', () => {
      const validCustomFn: TCustomOrderFn = (a, b) =>
        a.label.localeCompare(b.label)

      it('should return true for valid built-in tuples', () => {
        expect(isOrderFnArg(['count', 'asc'])).toBe(true)
        expect(isOrderFnArg(['label', 'desc'])).toBe(true)
      })

      it('should return true for valid custom functions', () => {
        expect(isOrderFnArg(validCustomFn)).toBe(true)
      })

      it('should return false for invalid arguments', () => {
        expect(isOrderFnArg(['invalid', 'asc'])).toBe(false)
        expect(isOrderFnArg('not valid')).toBe(false)
        expect(isOrderFnArg(123)).toBe(false)
        expect(isOrderFnArg(null)).toBe(false)
        expect(isOrderFnArg(undefined)).toBe(false)
      })
    })
  })

  describe('applyOrderFns', () => {
    it('should apply single order function', () => {
      const orderFunctions = [
        (a: ColumnOption, b: ColumnOption) => orderFns.count(a, b, 'asc'),
      ]

      const result = applyOrderFns(orderFunctions, [...testOptions])

      expect(result.map((o) => o.value)).toEqual([
        'date', // count: 1
        'banana', // count: 3
        'elderberry', // count: 3
        'apple', // count: 5
        'cherry', // count: 8
      ])
    })

    it('should apply multiple order functions in sequence', () => {
      const orderFunctions = [
        // First sort by count (asc)
        (a: ColumnOption, b: ColumnOption) => orderFns.count(a, b, 'asc'),
        // Then sort by label (asc) for ties
        (a: ColumnOption, b: ColumnOption) => orderFns.label(a, b, 'asc'),
      ]

      const result = applyOrderFns(orderFunctions, [...testOptions])

      expect(result.map((o) => o.value)).toEqual([
        'date', // count: 1
        'banana', // count: 3, label: 'Banana'
        'elderberry', // count: 3, label: 'Elderberry'
        'apple', // count: 5
        'cherry', // count: 8
      ])
    })

    it('should handle empty order functions array', () => {
      const result = applyOrderFns([], [...testOptions])

      // Should return original order
      expect(result.map((o) => o.value)).toEqual([
        'apple',
        'banana',
        'cherry',
        'date',
        'elderberry',
      ])
    })

    it('should handle all equal comparisons', () => {
      const sameOptions = [
        { value: 'a', label: 'Same', count: 5 },
        { value: 'b', label: 'Same', count: 5 },
        { value: 'c', label: 'Same', count: 5 },
      ]

      const orderFunctions = [
        (a: ColumnOption, b: ColumnOption) => orderFns.count(a, b, 'asc'),
        (a: ColumnOption, b: ColumnOption) => orderFns.label(a, b, 'asc'),
      ]

      const result = applyOrderFns(orderFunctions, sameOptions)

      // Should maintain original order when all comparisons are equal
      expect(result.map((o) => o.value)).toEqual(['a', 'b', 'c'])
    })

    it('should work with custom order functions', () => {
      const customOrderFn: TCustomOrderFn = (a, b) => {
        // Sort by value length, then alphabetically
        const lengthDiff = a.value.length - b.value.length
        if (lengthDiff !== 0) return lengthDiff
        return a.value.localeCompare(b.value)
      }

      const orderFunctions = [customOrderFn]
      const result = applyOrderFns(orderFunctions, [...testOptions])

      expect(result.map((o) => o.value)).toEqual([
        'date', // length: 4
        'apple', // length: 5
        'banana', // length: 6
        'cherry', // length: 6
        'elderberry', // length: 10
      ])
    })

    it('should handle complex chaining scenario', () => {
      const complexOptions: ColumnOption[] = [
        { value: 'a1', label: 'Zebra', count: 1 },
        { value: 'a2', label: 'Apple', count: 1 },
        { value: 'b1', label: 'Zebra', count: 2 },
        { value: 'b2', label: 'Apple', count: 2 },
      ]

      const orderFunctions = [
        // Sort by count desc
        (a: ColumnOption, b: ColumnOption) => orderFns.count(a, b, 'desc'),
        // Then by label asc
        (a: ColumnOption, b: ColumnOption) => orderFns.label(a, b, 'asc'),
        // Then by value asc (custom)
        (a: ColumnOption, b: ColumnOption) => a.value.localeCompare(b.value),
      ]

      const result = applyOrderFns(orderFunctions, complexOptions)

      expect(result.map((o) => o.value)).toEqual([
        'b2', // count: 2, label: 'Apple', value: 'b2'
        'b1', // count: 2, label: 'Zebra', value: 'b1'
        'a2', // count: 1, label: 'Apple', value: 'a2'
        'a1', // count: 1, label: 'Zebra', value: 'a1'
      ])
    })
  })

  describe('Column config builder orderFn', () => {
    it('should accept built-in function with direction as separate arguments', () => {
      const config = helper
        .option()
        .id('test')
        .accessor(() => 'test')
        .displayName('Test')
        .orderFn('count', 'asc')
        .build()

      expect(config.orderFn).toBeDefined()
      expect(config.orderFn!).toHaveLength(1)

      // Test the function works
      const testOptions = [
        { value: 'a', label: 'A', count: 5 },
        { value: 'b', label: 'B', count: 3 },
      ]
      const result = applyOrderFns(config.orderFn!, testOptions)
      expect(result[0]!.value).toBe('b') // Lower count first
    })

    it('should accept custom function', () => {
      const customFn: TCustomOrderFn = (a, b) => a.label.localeCompare(b.label)

      const config = helper
        .option()
        .id('test')
        .accessor(() => 'test')
        .displayName('Test')
        .orderFn(customFn)
        .build()

      expect(config.orderFn).toBeDefined()
      expect(config.orderFn!).toHaveLength(1)
      expect(config.orderFn![0]).toBe(customFn)
    })

    it('should accept multiple order functions as rest parameters', () => {
      const customFn: TCustomOrderFn = (a, b) => a.value.localeCompare(b.value)

      const config = helper
        .option()
        .id('test')
        .accessor(() => 'test')
        .displayName('Test')
        .orderFn(['count', 'desc'], customFn, ['label', 'asc'])
        .build()

      expect(config.orderFn).toBeDefined()
      expect(config.orderFn!).toHaveLength(3)
    })

    it('should throw error for invalid built-in function name', () => {
      expect(() => {
        helper
          .option()
          .id('test')
          .accessor(() => 'test')
          .displayName('Test')
          // @ts-expect-error - testing invalid function name
          .orderFn('invalid', 'asc')
          .build()
      }).toThrow()
    })

    it('should throw error for invalid direction', () => {
      expect(() => {
        helper
          .option()
          .id('test')
          .accessor(() => 'test')
          .displayName('Test')
          // @ts-expect-error - testing invalid direction
          .orderFn('count', 'invalid')
          .build()
      }).toThrow()
    })

    it('should throw error when used on non-option column', () => {
      expect(() => {
        helper
          .text()
          .id('test')
          .accessor(() => 'test')
          .displayName('Test')
          .orderFn('count', 'asc')
          .build()
      }).toThrow(
        'orderFn() is only applicable to option or multiOption columns',
      )
    })

    it('should work with multiOption columns', () => {
      const config = helper
        .multiOption()
        .id('test')
        .accessor(() => ['test'])
        .displayName('Test')
        .orderFn('label', 'desc')
        .build()

      expect(config.orderFn).toBeDefined()
      expect(config.orderFn!).toHaveLength(1)
    })

    it('should handle mixed valid and invalid arguments', () => {
      const validCustomFn: TCustomOrderFn = (a, b) =>
        a.value.localeCompare(b.value)
      const invalidArg = 'not valid'

      expect(() => {
        helper
          .option()
          .id('test')
          .accessor(() => 'test')
          .displayName('Test')
          .orderFn(['count', 'asc'], validCustomFn, invalidArg as any)
          .build()
      }).toThrow('Invalid argument')
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle sorting priority list (count desc, then label asc)', () => {
      const priorityOptions: ColumnOption[] = [
        { value: 'medium', label: 'Medium Priority', count: 15 },
        { value: 'high', label: 'High Priority', count: 5 },
        { value: 'low', label: 'Low Priority', count: 25 },
        { value: 'urgent', label: 'Urgent', count: 5 }, // Same count as high
        { value: 'critical', label: 'Critical', count: 2 },
      ]

      const orderFunctions = [
        (a: ColumnOption, b: ColumnOption) => orderFns.count(a, b, 'desc'),
        (a: ColumnOption, b: ColumnOption) => orderFns.label(a, b, 'asc'),
      ]

      const result = applyOrderFns(orderFunctions, priorityOptions)

      expect(result.map((o) => o.value)).toEqual([
        'low', // count: 25
        'medium', // count: 15
        'high', // count: 5, label: 'High Priority'
        'urgent', // count: 5, label: 'Urgent'
        'critical', // count: 2
      ])
    })

    it('should handle alphabetical with case insensitive fallback', () => {
      const mixedCaseOptions: ColumnOption[] = [
        { value: 'zebra', label: 'zebra' },
        { value: 'Apple', label: 'Apple' },
        { value: 'banana', label: 'BANANA' },
        { value: 'Cherry', label: 'Cherry' },
      ]

      const orderFunctions = [
        (a: ColumnOption, b: ColumnOption) => orderFns.label(a, b, 'asc'),
      ]

      const result = applyOrderFns(orderFunctions, mixedCaseOptions)

      expect(result.map((o) => o.value)).toEqual([
        'Apple', // 'apple'
        'banana', // 'banana'
        'Cherry', // 'cherry'
        'zebra', // 'zebra'
      ])
    })

    it('should handle empty or missing data gracefully', () => {
      const incompleteOptions: ColumnOption[] = [
        { value: 'complete', label: 'Complete', count: 10 },
        { value: 'no-count', label: 'No Count' }, // No count property
        { value: 'empty-label', label: '', count: 5 },
        { value: 'minimal', label: 'Minimal' }, // No count
      ]

      const orderFunctions = [
        (a: ColumnOption, b: ColumnOption) => orderFns.count(a, b, 'desc'),
        (a: ColumnOption, b: ColumnOption) => orderFns.label(a, b, 'asc'),
      ]

      const result = applyOrderFns(orderFunctions, incompleteOptions)

      expect(result.map((o) => o.value)).toEqual([
        'complete', // count: 10
        'empty-label', // count: 5
        'minimal', // count: 0 (undefined), label: 'Minimal'
        'no-count', // count: 0 (undefined), label: 'No Count'
      ])
    })
  })
})
