import { describe, expect, it } from 'vitest'
import {
  bigIntType,
  booleanType,
  builtInColumnTypes,
  dateType,
  defineColumnType,
  multiOptionType,
  numberType,
  optionType,
  textType,
} from '../core/column-types.js'
import { defineOperators } from '../core/operator-set.js'
import {
  bigIntOperators,
  booleanOperators,
  dateOperators,
  multiOptionOperators,
  numberOperators,
  optionOperators,
  textOperators,
} from '../core/operator-sets.js'

describe('core/column-types', () => {
  describe('defineColumnType', () => {
    it('should create a ColumnType with all provided properties', () => {
      const ops = defineOperators({
        eq: { label: 'equals', target: 'single', match: (a, b) => a === b[0] },
      })
      const type = defineColumnType<number>({
        id: 'custom-number',
        operators: ops,
        normalizeValues: (vals) => vals.sort((a, b) => a - b),
        serialize: (v) => v,
        deserialize: (raw) => Number(raw),
      })

      expect(type.id).toBe('custom-number')
      expect(type.operators).toBe(ops)
      expect(type.normalizeValues([3, 1, 2])).toEqual([1, 2, 3])
      expect(type.serialize!(42)).toBe(42)
      expect(type.deserialize!('42')).toBe(42)
    })

    it('should default normalizeValues to identity if not provided', () => {
      const ops = defineOperators({
        eq: { label: 'equals', target: 'single' },
      })
      const type = defineColumnType({
        id: 'minimal',
        operators: ops,
      })

      const values = [1, 2, 3]
      expect(type.normalizeValues(values)).toBe(values) // Same reference
    })

    it('should leave serialize/deserialize undefined if not provided', () => {
      const ops = defineOperators({
        eq: { label: 'equals', target: 'single' },
      })
      const type = defineColumnType({
        id: 'no-serde',
        operators: ops,
      })

      expect(type.serialize).toBeUndefined()
      expect(type.deserialize).toBeUndefined()
    })
  })

  describe('built-in column types', () => {
    describe('textType', () => {
      it('should have id "text"', () => {
        expect(textType.id).toBe('text')
      })

      it('should use textOperators', () => {
        expect(textType.operators).toBe(textOperators)
      })

      it('should have identity normalizeValues', () => {
        const vals = ['a', 'b']
        expect(textType.normalizeValues(vals)).toBe(vals)
      })

      it('should not have serialize/deserialize', () => {
        expect(textType.serialize).toBeUndefined()
        expect(textType.deserialize).toBeUndefined()
      })
    })

    describe('numberType', () => {
      it('should have id "number"', () => {
        expect(numberType.id).toBe('number')
      })

      it('should use numberOperators', () => {
        expect(numberType.operators).toBe(numberOperators)
      })

      it('should normalize number ranges', () => {
        expect(numberType.normalizeValues([10, 5])).toEqual([5, 10])
        expect(numberType.normalizeValues([42])).toEqual([42])
        expect(numberType.normalizeValues([])).toEqual([])
      })
    })

    describe('bigIntType', () => {
      it('should have id "bigint"', () => {
        expect(bigIntType.id).toBe('bigint')
      })

      it('should use bigIntOperators', () => {
        expect(bigIntType.operators).toBe(bigIntOperators)
      })

      it('should normalize bigint ranges', () => {
        expect(bigIntType.normalizeValues([10n, 5n])).toEqual([5n, 10n])
        expect(bigIntType.normalizeValues([42n])).toEqual([42n])
      })

      it('should serialize to string', () => {
        expect(bigIntType.serialize!(42n)).toBe('42')
      })

      it('should deserialize from string', () => {
        expect(bigIntType.deserialize!('42')).toBe(42n)
      })
    })

    describe('dateType', () => {
      it('should have id "date"', () => {
        expect(dateType.id).toBe('date')
      })

      it('should use dateOperators', () => {
        expect(dateType.operators).toBe(dateOperators)
      })

      it('should normalize date ranges', () => {
        const d1 = new Date(2025, 0, 5)
        const d2 = new Date(2025, 0, 1)
        const result = dateType.normalizeValues([d1, d2])
        // Should be sorted: earlier first
        expect(result[0]).toBe(d2)
        expect(result[1]).toBe(d1)
      })

      it('should serialize to ISO string', () => {
        const d = new Date(2025, 0, 1, 12, 0, 0)
        expect(typeof dateType.serialize!(d)).toBe('string')
      })

      it('should deserialize from ISO string', () => {
        const iso = '2025-01-01T12:00:00.000Z'
        const result = dateType.deserialize!(iso)
        expect(result).toBeInstanceOf(Date)
        expect(result.toISOString()).toBe(iso)
      })
    })

    describe('booleanType', () => {
      it('should have id "boolean"', () => {
        expect(booleanType.id).toBe('boolean')
      })

      it('should use booleanOperators', () => {
        expect(booleanType.operators).toBe(booleanOperators)
      })

      it('should have identity normalizeValues', () => {
        const vals = [true, false]
        expect(booleanType.normalizeValues(vals)).toBe(vals)
      })
    })

    describe('optionType', () => {
      it('should have id "option"', () => {
        expect(optionType.id).toBe('option')
      })

      it('should use optionOperators', () => {
        expect(optionType.operators).toBe(optionOperators)
      })
    })

    describe('multiOptionType', () => {
      it('should have id "multiOption"', () => {
        expect(multiOptionType.id).toBe('multiOption')
      })

      it('should use multiOptionOperators', () => {
        expect(multiOptionType.operators).toBe(multiOptionOperators)
      })
    })
  })

  describe('builtInColumnTypes map', () => {
    it('should map all 7 built-in types', () => {
      expect(Object.keys(builtInColumnTypes)).toHaveLength(7)
      expect(builtInColumnTypes.text).toBe(textType)
      expect(builtInColumnTypes.number).toBe(numberType)
      expect(builtInColumnTypes.bigint).toBe(bigIntType)
      expect(builtInColumnTypes.date).toBe(dateType)
      expect(builtInColumnTypes.boolean).toBe(booleanType)
      expect(builtInColumnTypes.option).toBe(optionType)
      expect(builtInColumnTypes.multiOption).toBe(multiOptionType)
    })
  })
})
