import { describe, expect, it } from 'vitest'
import {
  dateType,
  defineColumnType,
  numberType,
  textType,
} from '../core/column-types.js'
import { createColumnBuilder } from '../core/columns/column-builder.js'
import { defineOperators } from '../core/operator-set.js'
import { numberOperators, optionOperators } from '../core/operator-sets.js'

type TestRow = {
  name: string
  age: number
  status: string
  price: number
  tags: string[]
  active: boolean
  createdAt: Date
  amount: bigint
}

const c = createColumnBuilder<TestRow>()

describe('core/columns/column-builder', () => {
  describe('existing methods', () => {
    it('should build a text column', () => {
      const col = c
        .text()
        .id('name')
        .accessor((r) => r.name)
        .displayName('Name')
        .build()

      expect(col.id).toBe('name')
      expect(col.type).toBe('text')
      expect(col.displayName).toBe('Name')
    })

    it('should build an option column with options', () => {
      const col = c
        .option()
        .id('status')
        .accessor((r) => r.status)
        .displayName('Status')
        .options([
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ])
        .build()

      expect(col.type).toBe('option')
      expect(col.options).toHaveLength(2)
    })

    it('should build a number column with min/max', () => {
      const col = c
        .number()
        .id('age')
        .accessor((r) => r.age)
        .displayName('Age')
        .min(0)
        .max(120)
        .build()

      expect(col.min).toBe(0)
      expect(col.max).toBe(120)
    })

    it('should throw for missing required fields', () => {
      expect(() => c.text().build()).toThrow('id is required')
      expect(() => c.text().id('x').build()).toThrow('accessor is required')
      expect(() =>
        c
          .text()
          .id('x')
          .accessor((r) => r.name)
          .build(),
      ).toThrow('displayName is required')
    })
  })

  describe('.sortable()', () => {
    it('should set sortable to true', () => {
      const col = c
        .text()
        .id('name')
        .accessor((r) => r.name)
        .displayName('Name')
        .sortable()
        .build()

      expect(col.sortable).toBe(true)
      expect(col.defaultSortDirection).toBeUndefined()
    })

    it('should set default sort direction', () => {
      const col = c
        .number()
        .id('age')
        .accessor((r) => r.age)
        .displayName('Age')
        .sortable({ default: { direction: 'desc' } })
        .build()

      expect(col.sortable).toBe(true)
      expect(col.defaultSortDirection).toBe('desc')
    })

    it('should be immutable (returns new instance)', () => {
      const base = c
        .text()
        .id('name')
        .accessor((r) => r.name)
        .displayName('Name')

      const sorted = base.sortable()
      const baseCfg = base.build()
      const sortedCfg = sorted.build()

      expect(baseCfg.sortable).toBeUndefined()
      expect(sortedCfg.sortable).toBe(true)
    })
  })

  describe('.operators()', () => {
    it('should set a custom OperatorSet on the column', () => {
      const customOps = optionOperators.only('is', 'is_not')
      const col = c
        .option()
        .id('status')
        .accessor((r) => r.status)
        .displayName('Status')
        .operators(customOps)
        .build()

      expect(col.operators).toBe(customOps)
      expect(col.operators!.size).toBe(2)
    })

    it('should be immutable (returns new instance)', () => {
      const customOps = optionOperators.only('is', 'is_not')
      const base = c
        .option()
        .id('status')
        .accessor((r) => r.status)
        .displayName('Status')

      const withOps = base.operators(customOps)
      const baseCfg = base.build()
      const withOpsCfg = withOps.build()

      expect(baseCfg.operators).toBeUndefined()
      expect(withOpsCfg.operators).toBe(customOps)
    })

    it('should override default operators when used after .custom()', () => {
      const currencyType = defineColumnType<number>({
        id: 'currency',
        operators: numberOperators,
      })
      const limitedOps = numberOperators.only('is', 'is_not')

      const col = c
        .custom(currencyType)
        .id('price')
        .accessor((r) => r.price)
        .displayName('Price')
        .operators(limitedOps)
        .build()

      expect(col.operators).toBe(limitedOps)
      expect(col.operators!.size).toBe(2)
    })
  })

  describe('.custom()', () => {
    it('should set type, operators, normalizeValues, and columnType', () => {
      const currencyType = defineColumnType<number>({
        id: 'currency',
        operators: numberOperators,
        normalizeValues: (vals) => vals.sort((a, b) => a - b),
      })

      const col = c
        .custom(currencyType)
        .id('price')
        .accessor((r) => r.price)
        .displayName('Price')
        .build()

      expect(col.type).toBe('currency')
      expect(col.operators).toBe(numberOperators)
      expect(col.columnType).toBe(currencyType)
      expect(col.normalizeValues).toBeDefined()
      expect(col.normalizeValues!([3, 1, 2])).toEqual([1, 2, 3])
    })

    it('should support chaining with .sortable() and .operators()', () => {
      const currencyType = defineColumnType<number>({
        id: 'currency',
        operators: numberOperators,
      })
      const customOps = numberOperators.only('is', 'is_between')

      const col = c
        .custom(currencyType)
        .id('price')
        .accessor((r) => r.price)
        .displayName('Price')
        .sortable({ default: { direction: 'desc' } })
        .operators(customOps)
        .build()

      expect(col.type).toBe('currency')
      expect(col.sortable).toBe(true)
      expect(col.defaultSortDirection).toBe('desc')
      expect(col.operators).toBe(customOps)
    })
  })

  describe('built-in types wire columnType', () => {
    it('should set columnType for .text()', () => {
      const col = c
        .text()
        .id('name')
        .accessor((r) => r.name)
        .displayName('Name')
        .build()

      expect(col.columnType).toBe(textType)
    })

    it('should set columnType for .number()', () => {
      const col = c
        .number()
        .id('age')
        .accessor((r) => r.age)
        .displayName('Age')
        .build()

      expect(col.columnType).toBe(numberType)
      expect(col.normalizeValues).toBeDefined()
    })

    it('should set columnType for .date()', () => {
      const col = c
        .date()
        .id('createdAt')
        .accessor((r) => r.createdAt)
        .displayName('Created')
        .build()

      expect(col.columnType).toBe(dateType)
      expect(col.normalizeValues).toBeDefined()
    })

    it('should set normalizeValues from numberType', () => {
      const col = c
        .number()
        .id('age')
        .accessor((r) => r.age)
        .displayName('Age')
        .build()

      // numberType.normalizeValues sorts range values
      expect(col.normalizeValues!([10, 5])).toEqual([5, 10])
    })
  })

  describe('.field()', () => {
    it('should set field on the config', () => {
      const col = c
        .date()
        .id('createdAt')
        .accessor((r) => r.createdAt)
        .displayName('Created')
        .field('created_at')
        .build()

      expect(col.field).toBe('created_at')
    })

    it('should be immutable (returns new instance)', () => {
      const base = c
        .text()
        .id('name')
        .accessor((r) => r.name)
        .displayName('Name')

      const withField = base.field('full_name')
      const baseCfg = base.build()
      const withFieldCfg = withField.build()

      expect(baseCfg.field).toBeUndefined()
      expect(withFieldCfg.field).toBe('full_name')
    })

    it('should work with dot notation for relations', () => {
      const col = c
        .option()
        .id('status')
        .accessor((r) => r.status)
        .displayName('Status')
        .field('status.name')
        .build()

      expect(col.field).toBe('status.name')
    })
  })
})
