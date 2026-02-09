import { describe, expect, it } from 'vitest'
import {
  compareValues,
  filterDataByColumns,
  filterRowByColumns,
  processData,
  sortDataByColumns,
} from '../core/client.js'
import type {
  Column,
  DataViewState,
  FiltersState,
  SortState,
} from '../core/types.js'

// ── Test Types ──────────────────────────────────────────────

type TestRow = {
  id: number
  title: string
  status: string
  tags: string[]
  priority: number
  startDate: Date | null
  active: boolean
}

// ── Helpers ─────────────────────────────────────────────────

function makeColumn<T extends string>(
  id: string,
  type: T,
  accessor: (row: TestRow) => unknown,
): Column<TestRow, any> {
  return {
    id,
    type,
    accessor,
    displayName: id,
  } as any
}

const columns: Column<TestRow>[] = [
  makeColumn('title', 'text', (r) => r.title),
  makeColumn('status', 'option', (r) => r.status),
  makeColumn('tags', 'multiOption', (r) => r.tags),
  makeColumn('priority', 'number', (r) => r.priority),
  makeColumn('startDate', 'date', (r) => r.startDate),
  makeColumn('active', 'boolean', (r) => r.active),
]

const testData: TestRow[] = [
  {
    id: 1,
    title: 'Alpha',
    status: 'open',
    tags: ['bug', 'urgent'],
    priority: 3,
    startDate: new Date('2024-03-15'),
    active: true,
  },
  {
    id: 2,
    title: 'Beta',
    status: 'closed',
    tags: ['feature'],
    priority: 1,
    startDate: new Date('2024-01-01'),
    active: false,
  },
  {
    id: 3,
    title: 'Gamma',
    status: 'open',
    tags: ['bug'],
    priority: 5,
    startDate: null,
    active: true,
  },
  {
    id: 4,
    title: 'Delta',
    status: 'pending',
    tags: [],
    priority: 2,
    startDate: new Date('2024-06-20'),
    active: false,
  },
]

// ── compareValues ───────────────────────────────────────────

describe('core/client', () => {
  describe('compareValues', () => {
    it('should compare strings', () => {
      expect(compareValues('apple', 'banana')).toBeLessThan(0)
      expect(compareValues('banana', 'apple')).toBeGreaterThan(0)
      expect(compareValues('same', 'same')).toBe(0)
    })

    it('should compare numbers', () => {
      expect(compareValues(1, 2)).toBeLessThan(0)
      expect(compareValues(10, 3)).toBeGreaterThan(0)
      expect(compareValues(5, 5)).toBe(0)
    })

    it('should compare bigints', () => {
      expect(compareValues(1n, 2n)).toBeLessThan(0)
      expect(compareValues(100n, 50n)).toBeGreaterThan(0)
      expect(compareValues(7n, 7n)).toBe(0)
    })

    it('should compare dates', () => {
      const d1 = new Date('2024-01-01')
      const d2 = new Date('2024-06-15')
      expect(compareValues(d1, d2)).toBeLessThan(0)
      expect(compareValues(d2, d1)).toBeGreaterThan(0)
      expect(compareValues(d1, d1)).toBe(0)
    })

    it('should compare booleans', () => {
      expect(compareValues(false, true)).toBeLessThan(0)
      expect(compareValues(true, false)).toBeGreaterThan(0)
      expect(compareValues(true, true)).toBe(0)
    })

    it('should compare arrays by length', () => {
      expect(compareValues([1], [1, 2, 3])).toBeLessThan(0)
      expect(compareValues([1, 2, 3], [1])).toBeGreaterThan(0)
      expect(compareValues([1, 2], [3, 4])).toBe(0)
    })

    it('should sort nulls last', () => {
      expect(compareValues(null, 'a')).toBeGreaterThan(0)
      expect(compareValues('a', null)).toBeLessThan(0)
      expect(compareValues(undefined, 5)).toBeGreaterThan(0)
      expect(compareValues(5, undefined)).toBeLessThan(0)
      expect(compareValues(null, null)).toBe(0)
      expect(compareValues(undefined, undefined)).toBe(0)
    })

    it('should fall back to string comparison for mixed types', () => {
      const result = compareValues('abc', 'def')
      expect(result).toBeLessThan(0)
    })
  })

  // ── filterRowByColumns ──────────────────────────────────────

  describe('filterRowByColumns', () => {
    it('should pass row when no filters', () => {
      expect(filterRowByColumns(testData[0]!, columns, [])).toBe(true)
    })

    it('should filter by option column (is)', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['open'],
        },
      ]
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true)
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false)
    })

    it('should filter by option column (is any of)', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is_any_of',
          values: ['open', 'pending'],
        },
      ]
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true) // open
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false) // closed
      expect(filterRowByColumns(testData[3]!, columns, filters)).toBe(true) // pending
    })

    it('should filter by multiOption column (include)', () => {
      const filters: FiltersState = [
        {
          columnId: 'tags',
          type: 'multiOption',
          operator: 'include',
          values: ['bug'],
        },
      ]
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true) // has bug
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false) // only feature
    })

    it('should filter by text column (contains)', () => {
      const filters: FiltersState = [
        {
          columnId: 'title',
          type: 'text',
          operator: 'contains',
          values: ['alph'],
        },
      ]
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true) // Alpha
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false) // Beta
    })

    it('should filter by number column (is)', () => {
      const filters: FiltersState = [
        {
          columnId: 'priority',
          type: 'number',
          operator: 'is',
          values: [3],
        },
      ]
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true) // 3
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false) // 1
    })

    it('should filter by boolean column (is)', () => {
      const filters: FiltersState = [
        {
          columnId: 'active',
          type: 'boolean',
          operator: 'is',
          values: [true],
        },
      ]
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true) // active
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false) // not active
    })

    it('should AND multiple filters', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['open'],
        },
        { columnId: 'active', type: 'boolean', operator: 'is', values: [true] },
      ]
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true) // open + active
      expect(filterRowByColumns(testData[2]!, columns, filters)).toBe(true) // open + active
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false) // closed
    })

    it('should skip filters for unknown columns', () => {
      const filters: FiltersState = [
        {
          columnId: 'nonexistent',
          type: 'text',
          operator: 'contains',
          values: ['x'],
        },
      ]
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true)
    })
  })

  // ── filterDataByColumns ─────────────────────────────────────

  describe('filterDataByColumns', () => {
    it('should return original array when no filters', () => {
      const result = filterDataByColumns(testData, columns, [])
      expect(result).toBe(testData) // Same reference
    })

    it('should filter data by option column', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['open'],
        },
      ]
      const result = filterDataByColumns(testData, columns, filters)
      expect(result).toHaveLength(2)
      expect(result.map((r) => r.id)).toEqual([1, 3])
    })

    it('should filter by multiple criteria', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['open'],
        },
        {
          columnId: 'tags',
          type: 'multiOption',
          operator: 'include',
          values: ['urgent'],
        },
      ]
      const result = filterDataByColumns(testData, columns, filters)
      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe(1)
    })

    it('should return empty array when nothing matches', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['nonexistent'],
        },
      ]
      const result = filterDataByColumns(testData, columns, filters)
      expect(result).toHaveLength(0)
    })
  })

  // ── sortDataByColumns ───────────────────────────────────────

  describe('sortDataByColumns', () => {
    it('should return original array when no sort rules', () => {
      const result = sortDataByColumns(testData, columns, [])
      expect(result).toBe(testData) // Same reference
    })

    it('should sort by string column ascending', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'title', direction: 'asc' },
      ]
      const result = sortDataByColumns(testData, columns, sort)
      expect(result.map((r) => r.title)).toEqual([
        'Alpha',
        'Beta',
        'Delta',
        'Gamma',
      ])
    })

    it('should sort by string column descending', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'title', direction: 'desc' },
      ]
      const result = sortDataByColumns(testData, columns, sort)
      expect(result.map((r) => r.title)).toEqual([
        'Gamma',
        'Delta',
        'Beta',
        'Alpha',
      ])
    })

    it('should sort by number column ascending', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'priority', direction: 'asc' },
      ]
      const result = sortDataByColumns(testData, columns, sort)
      expect(result.map((r) => r.priority)).toEqual([1, 2, 3, 5])
    })

    it('should sort by number column descending', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'priority', direction: 'desc' },
      ]
      const result = sortDataByColumns(testData, columns, sort)
      expect(result.map((r) => r.priority)).toEqual([5, 3, 2, 1])
    })

    it('should sort by boolean column', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'active', direction: 'desc' },
      ]
      const result = sortDataByColumns(testData, columns, sort)
      // true (1,3) first, then false (2,4)
      expect(result.map((r) => r.active)).toEqual([true, true, false, false])
    })

    it('should sort by date column with nulls last', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'startDate', direction: 'asc' },
      ]
      const result = sortDataByColumns(testData, columns, sort)
      // 2024-01-01, 2024-03-15, 2024-06-20, null
      expect(result.map((r) => r.id)).toEqual([2, 1, 4, 3])
    })

    it('should handle multi-column sort', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'active', direction: 'desc' },
        { type: 'column', columnId: 'priority', direction: 'asc' },
      ]
      const result = sortDataByColumns(testData, columns, sort)
      // First sort by active desc (true first), then by priority asc
      expect(result.map((r) => r.id)).toEqual([1, 3, 2, 4])
    })

    it('should skip custom sort rules', () => {
      const sort: SortState = [
        { type: 'custom', id: 'my-sort', enabled: true },
        { type: 'column', columnId: 'priority', direction: 'asc' },
      ]
      const result = sortDataByColumns(testData, columns, sort)
      expect(result.map((r) => r.priority)).toEqual([1, 2, 3, 5])
    })

    it('should not mutate original array', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'priority', direction: 'desc' },
      ]
      const original = [...testData]
      sortDataByColumns(testData, columns, sort)
      expect(testData).toEqual(original)
    })

    it('should skip sort rules for unknown columns', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'nonexistent', direction: 'asc' },
      ]
      const result = sortDataByColumns(testData, columns, sort)
      // No actual sorting happens, but returns a new array since there's a column sort rule
      expect(result.map((r) => r.id)).toEqual([1, 2, 3, 4])
    })

    it('should sort by array column (by length)', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'tags', direction: 'desc' },
      ]
      const result = sortDataByColumns(testData, columns, sort)
      // ['bug','urgent']=2, ['feature']=1, ['bug']=1, []=0
      expect(result[0]!.id).toBe(1) // 2 tags
      expect(result[result.length - 1]!.id).toBe(4) // 0 tags
    })
  })

  // ── processData ───────────────────────────────────────────

  describe('processData', () => {
    it('should filter then sort', () => {
      const view: DataViewState = {
        filters: [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['open'],
          },
        ],
        sort: [{ type: 'column', columnId: 'priority', direction: 'asc' }],
      }
      const result = processData(testData, columns, view)
      // Only open: Alpha(3), Gamma(5) → sorted asc by priority
      expect(result).toHaveLength(2)
      expect(result.map((r) => r.id)).toEqual([1, 3])
    })

    it('should return original data when view is empty', () => {
      const view: DataViewState = { filters: [], sort: [] }
      const result = processData(testData, columns, view)
      expect(result).toBe(testData) // Same reference — no filters and no sort
    })

    it('should handle filters only (no sort)', () => {
      const view: DataViewState = {
        filters: [
          {
            columnId: 'active',
            type: 'boolean',
            operator: 'is',
            values: [false],
          },
        ],
        sort: [],
      }
      const result = processData(testData, columns, view)
      expect(result).toHaveLength(2)
      expect(result.map((r) => r.id)).toEqual([2, 4])
    })

    it('should handle sort only (no filters)', () => {
      const view: DataViewState = {
        filters: [],
        sort: [{ type: 'column', columnId: 'title', direction: 'desc' }],
      }
      const result = processData(testData, columns, view)
      expect(result.map((r) => r.title)).toEqual([
        'Gamma',
        'Delta',
        'Beta',
        'Alpha',
      ])
    })
  })
})
