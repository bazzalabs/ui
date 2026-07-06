import { describe, expect, it } from 'vitest'
import {
  type ClientColumn,
  compareValues,
  evaluateFilterNode,
  filterDataByColumns,
  filterRowByColumns,
  processData,
  sortDataByColumns,
} from '../core/client.js'
import type {
  FilterCondition,
  FilterGroup,
  FilterNode,
  FiltersState,
} from '../core/filter-tree.js'
import { defineOperators } from '../core/operator-set.js'
import type { ColumnDataType, SortState } from '../core/types.js'

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

function makeColumn(
  id: string,
  type: ColumnDataType,
  accessor: (row: TestRow) => unknown,
): ClientColumn<TestRow> {
  return {
    id,
    type,
    accessor,
  }
}

function condition(
  id: string,
  columnId: string,
  type: ColumnDataType,
  operator: string,
  values: unknown[],
): FilterCondition {
  return {
    kind: 'condition',
    id,
    columnId,
    type,
    operator,
    values,
  }
}

function group(
  id: string,
  children: FilterNode[] = [],
  op: FilterGroup['op'] = 'and',
): FilterGroup {
  return { kind: 'group', id, op, children }
}

function root(
  children: FilterNode[] = [],
  op: FilterGroup['op'] = 'and',
): FiltersState {
  return group('root', children, op)
}

const columns: ClientColumn<TestRow>[] = [
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

    it('should treat null and undefined as equivalent', () => {
      expect(compareValues(null, undefined)).toBe(0)
      expect(compareValues(undefined, null)).toBe(0)
    })

    it('should fall back to string comparison for mixed types', () => {
      expect(compareValues(2, '10')).toBeGreaterThan(0)
      expect(compareValues(false, 'true')).toBeLessThan(0)
    })
  })

  // ── evaluateFilterNode / filterRowByColumns ────────────────

  describe('filterRowByColumns', () => {
    it('should pass row when no filters', () => {
      expect(filterRowByColumns(testData[0]!, columns, root())).toBe(true)
    })

    it('should evaluate a condition node directly', () => {
      const node = condition('c1', 'status', 'option', 'is', ['open'])

      expect(evaluateFilterNode(testData[0]!, node, columns)).toBe(true)
      expect(evaluateFilterNode(testData[1]!, node, columns)).toBe(false)
    })

    it('should filter by option column (is)', () => {
      const filters = root([
        condition('c1', 'status', 'option', 'is', ['open']),
      ])
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true)
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false)
    })

    it('should filter by option column (is any of)', () => {
      const filters = root([
        condition('c1', 'status', 'option', 'is_any_of', ['open', 'pending']),
      ])
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true) // open
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false) // closed
      expect(filterRowByColumns(testData[3]!, columns, filters)).toBe(true) // pending
    })

    it('should filter by multiOption column (include)', () => {
      const filters = root([
        condition('c1', 'tags', 'multiOption', 'include', ['bug']),
      ])
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true) // has bug
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false) // only feature
    })

    it('should filter by text column (contains)', () => {
      const filters = root([
        condition('c1', 'title', 'text', 'contains', ['alph']),
      ])
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true) // Alpha
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false) // Beta
    })

    it('should filter by number column (is)', () => {
      const filters = root([condition('c1', 'priority', 'number', 'is', [3])])
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true) // 3
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false) // 1
    })

    it('should filter by boolean column (is)', () => {
      const filters = root([condition('c1', 'active', 'boolean', 'is', [true])])
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true) // active
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false) // not active
    })

    it('should AND multiple filters', () => {
      const filters = root([
        condition('c1', 'status', 'option', 'is', ['open']),
        condition('c2', 'active', 'boolean', 'is', [true]),
      ])
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true) // open + active
      expect(filterRowByColumns(testData[2]!, columns, filters)).toBe(true) // open + active
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false) // closed
    })

    it('should evaluate nested or groups inside root and groups', () => {
      const filters = root([
        condition('c1', 'status', 'option', 'is', ['open']),
        group(
          'g1',
          [
            condition('c2', 'priority', 'number', 'is', [3]),
            condition('c3', 'title', 'text', 'contains', ['gamma']),
          ],
          'or',
        ),
      ])

      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true)
      expect(filterRowByColumns(testData[2]!, columns, filters)).toBe(true)
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false)
    })

    it('should pass an or group when one branch matches', () => {
      const filters = root(
        [
          condition('c1', 'status', 'option', 'is', ['pending']),
          condition('c2', 'title', 'text', 'contains', ['alpha']),
        ],
        'or',
      )

      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true)
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false)
      expect(filterRowByColumns(testData[3]!, columns, filters)).toBe(true)
    })

    it('should evaluate deep 3-level nesting', () => {
      const filters = root([
        condition('c1', 'status', 'option', 'is', ['open']),
        group(
          'g1',
          [
            condition('c2', 'title', 'text', 'contains', ['beta']),
            group(
              'g2',
              [
                condition('c3', 'active', 'boolean', 'is', [true]),
                group(
                  'g3',
                  [condition('c4', 'priority', 'number', 'is', [5])],
                  'and',
                ),
              ],
              'and',
            ),
          ],
          'or',
        ),
      ])

      expect(filterRowByColumns(testData[2]!, columns, filters)).toBe(true)
      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(false)
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false)
    })

    it('should treat empty groups as passing', () => {
      const filters = root([
        group('g1', [], 'and'),
        group('g2', [], 'or'),
        condition('c1', 'status', 'option', 'is', ['open']),
      ])

      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true)
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false)
    })

    it('should skip filters for unknown columns in and groups', () => {
      const filters = root([
        condition('c1', 'nonexistent', 'text', 'contains', ['x']),
        condition('c2', 'status', 'option', 'is', ['open']),
      ])

      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true)
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false)
    })

    it('should skip filters for unknown operators in and groups', () => {
      const filters = root([
        condition('c1', 'status', 'option', 'unknown_operator', ['closed']),
        condition('c2', 'active', 'boolean', 'is', [true]),
      ])

      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true)
      expect(filterRowByColumns(testData[1]!, columns, filters)).toBe(false)
    })

    it('should treat operators without match functions as passing', () => {
      const passthroughOperators = defineOperators({
        passthrough: { label: 'passthrough', target: 'single' },
      })
      const columnsWithPassthrough: ClientColumn<TestRow>[] = [
        ...columns,
        {
          id: 'passthrough',
          type: 'text',
          accessor: (row) => row.title,
          operators: passthroughOperators,
        },
      ]
      const filters = root([
        condition('c1', 'passthrough', 'text', 'passthrough', ['no-match']),
      ])

      expect(
        filterRowByColumns(testData[0]!, columnsWithPassthrough, filters),
      ).toBe(true)
    })

    it('should skip unknown columns inside or groups', () => {
      const filters = root([
        group(
          'g1',
          [
            condition('c1', 'nonexistent', 'text', 'contains', ['x']),
            condition('c2', 'status', 'option', 'is', ['closed']),
          ],
          'or',
        ),
      ])

      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true)
    })

    it('should skip unknown operators inside or groups', () => {
      const filters = root([
        group(
          'g1',
          [
            condition('c1', 'status', 'option', 'unknown_operator', ['open']),
            condition('c2', 'status', 'option', 'is', ['closed']),
          ],
          'or',
        ),
      ])

      expect(filterRowByColumns(testData[0]!, columns, filters)).toBe(true)
    })
  })

  // ── filterDataByColumns ─────────────────────────────────────

  describe('filterDataByColumns', () => {
    it('should return original array when no filters', () => {
      const result = filterDataByColumns(testData, columns, root())
      expect(result).toBe(testData) // Same reference
    })

    it('should return original array when only empty groups are present', () => {
      const result = filterDataByColumns(
        testData,
        columns,
        root([group('g1', [], 'or')]),
      )
      expect(result).toBe(testData) // Same reference
    })

    it('should filter data by option column', () => {
      const filters = root([
        condition('c1', 'status', 'option', 'is', ['open']),
      ])
      const result = filterDataByColumns(testData, columns, filters)
      expect(result).toHaveLength(2)
      expect(result.map((r) => r.id)).toEqual([1, 3])
    })

    it('should filter by multiple criteria', () => {
      const filters = root([
        condition('c1', 'status', 'option', 'is', ['open']),
        condition('c2', 'tags', 'multiOption', 'include', ['urgent']),
      ])
      const result = filterDataByColumns(testData, columns, filters)
      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe(1)
    })

    it('should return empty array when nothing matches', () => {
      const filters = root([
        condition('c1', 'status', 'option', 'is', ['nonexistent']),
      ])
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

    it('should return original array when only custom sort rules exist', () => {
      const sort: SortState = [{ type: 'custom', id: 'my-sort', enabled: true }]
      const result = sortDataByColumns(testData, columns, sort)
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

    it('should apply later column sorts as tiebreakers', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'status', direction: 'asc' },
        { type: 'column', columnId: 'priority', direction: 'desc' },
      ]
      const result = sortDataByColumns(testData, columns, sort)

      expect(result.map((r) => r.id)).toEqual([2, 3, 1, 4])
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
      expect(result).not.toBe(testData)
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
      const view = {
        filters: root([condition('c1', 'status', 'option', 'is', ['open'])]),
        sort: [
          { type: 'column' as const, columnId: 'priority', direction: 'asc' },
        ],
      }
      const result = processData(testData, columns, view)
      // Only open: Alpha(3), Gamma(5) → sorted asc by priority
      expect(result).toHaveLength(2)
      expect(result.map((r) => r.id)).toEqual([1, 3])
    })

    it('should return original data when view is empty', () => {
      const view = { filters: root(), sort: [] }
      const result = processData(testData, columns, view)
      expect(result).toBe(testData) // Same reference — no filters and no sort
    })

    it('should handle filters only (no sort)', () => {
      const view = {
        filters: root([condition('c1', 'active', 'boolean', 'is', [false])]),
        sort: [],
      }
      const result = processData(testData, columns, view)
      expect(result).toHaveLength(2)
      expect(result.map((r) => r.id)).toEqual([2, 4])
    })

    it('should handle sort only (no filters)', () => {
      const view = {
        filters: root(),
        sort: [
          { type: 'column' as const, columnId: 'title', direction: 'desc' },
        ],
      }
      const result = processData(testData, columns, view)
      expect(result.map((r) => r.title)).toEqual([
        'Gamma',
        'Delta',
        'Beta',
        'Alpha',
      ])
    })

    it('should process nested tree filters before sorting', () => {
      const view = {
        filters: root([
          group(
            'g1',
            [
              condition('c1', 'status', 'option', 'is', ['open']),
              condition('c2', 'status', 'option', 'is', ['pending']),
            ],
            'or',
          ),
        ]),
        sort: [
          { type: 'column' as const, columnId: 'priority', direction: 'desc' },
        ],
      }
      const result = processData(testData, columns, view)

      expect(result.map((r) => r.id)).toEqual([3, 1, 4])
    })
  })
})
