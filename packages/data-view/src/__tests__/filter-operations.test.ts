import { describe, expect, it } from 'vitest'
import { filterOperations } from '../core/filters.js'
import { defaultOperatorSets, optionOperators } from '../core/operator-sets.js'
import { determineNewOperator, getOperatorSet } from '../core/operators.js'
import type { Column, FilterModel, FiltersState } from '../core/types.js'
import { filterData, filterRow } from '../lib/helpers.js'

// ── Helpers ─────────────────────────────────────────────────

function makeColumn<T extends string>(id: string, type: T): Column<any, any> {
  return {
    id,
    type,
    accessor: (row: any) => row[id],
    displayName: id,
  } as any
}

const optionCol = makeColumn('status', 'option')
const multiOptionCol = makeColumn('tags', 'multiOption')
const textCol = makeColumn('name', 'text')
const numberCol = makeColumn('age', 'number')
const dateCol = makeColumn('createdAt', 'date')
const booleanCol = makeColumn('active', 'boolean')

// ── filterOperations ────────────────────────────────────────

describe('core/filters', () => {
  describe('filterOperations.addFilterValue', () => {
    it('should create a new filter for an unfiltered option column', () => {
      const filters: FiltersState = []
      const result = filterOperations.addFilterValue(filters, optionCol, [
        'active',
      ])
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        columnId: 'status',
        type: 'option',
        operator: 'is',
        values: ['active'],
      })
    })

    it('should use multiple default for multiple initial values', () => {
      const filters: FiltersState = []
      const result = filterOperations.addFilterValue(filters, optionCol, [
        'active',
        'pending',
      ])
      expect(result[0]!.operator).toBe('is_any_of')
      expect(result[0]!.values).toEqual(['active', 'pending'])
    })

    it('should append values to existing filter', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['active'],
        },
      ]
      const result = filterOperations.addFilterValue(filters, optionCol, [
        'pending',
      ])
      expect(result).toHaveLength(1)
      expect(result[0]!.values).toEqual(['active', 'pending'])
    })

    it('should auto-transition operator from single to multiple', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['active'],
        },
      ]
      const result = filterOperations.addFilterValue(filters, optionCol, [
        'pending',
      ])
      // 'is' has singular: 'is_any_of', so transitioning 1→2 should switch to 'is_any_of'
      expect(result[0]!.operator).toBe('is_any_of')
    })

    it('should work with multiOption columns', () => {
      const filters: FiltersState = []
      const result = filterOperations.addFilterValue(filters, multiOptionCol, [
        'tag1',
      ])
      expect(result[0]!.operator).toBe('include')
    })

    it('should throw for non-option column types', () => {
      expect(() =>
        filterOperations.addFilterValue([] as FiltersState, textCol as any, [
          'x',
        ]),
      ).toThrow('addFilterValue() is only supported for option and multiOption')
    })
  })

  describe('filterOperations.removeFilterValue', () => {
    it('should remove a value from existing filter', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is_any_of',
          values: ['active', 'pending'],
        },
      ]
      const result = filterOperations.removeFilterValue(filters, optionCol, [
        'pending',
      ])
      expect(result).toHaveLength(1)
      expect(result[0]!.values).toEqual(['active'])
    })

    it('should auto-transition operator from multiple to single', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is_any_of',
          values: ['active', 'pending'],
        },
      ]
      const result = filterOperations.removeFilterValue(filters, optionCol, [
        'pending',
      ])
      // 'is_any_of' has plural: 'is', so transitioning 2→1 should switch to 'is'
      expect(result[0]!.operator).toBe('is')
    })

    it('should remove the filter entirely when no values remain', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['active'],
        },
      ]
      const result = filterOperations.removeFilterValue(filters, optionCol, [
        'active',
      ])
      expect(result).toHaveLength(0)
    })

    it('should return unchanged filters if column is not filtered', () => {
      const filters: FiltersState = []
      const result = filterOperations.removeFilterValue(filters, optionCol, [
        'active',
      ])
      expect(result).toEqual([])
    })

    it('should throw for non-option column types', () => {
      expect(() =>
        filterOperations.removeFilterValue([] as FiltersState, textCol as any, [
          'x',
        ]),
      ).toThrow(
        'removeFilterValue() is only supported for option and multiOption',
      )
    })
  })

  describe('filterOperations.setFilterValue', () => {
    it('should create a new text filter', () => {
      const filters: FiltersState = []
      const result = filterOperations.setFilterValue(filters, textCol, [
        'hello',
      ])
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        columnId: 'name',
        type: 'text',
        operator: 'contains',
        values: ['hello'],
      })
    })

    it('should create a new number filter', () => {
      const filters: FiltersState = []
      const result = filterOperations.setFilterValue(filters, numberCol, [42])
      expect(result).toHaveLength(1)
      expect(result[0]!.operator).toBe('is')
      expect(result[0]!.values).toEqual([42])
    })

    it('should normalize number range values', () => {
      const filters: FiltersState = []
      const result = filterOperations.setFilterValue(
        filters,
        numberCol,
        [10, 5],
      )
      // Should normalize to [5, 10]
      expect(result[0]!.values).toEqual([5, 10])
      expect(result[0]!.operator).toBe('is_between')
    })

    it('should update existing filter', () => {
      const filters: FiltersState = [
        {
          columnId: 'name',
          type: 'text',
          operator: 'contains',
          values: ['old'],
        },
      ]
      const result = filterOperations.setFilterValue(filters, textCol, ['new'])
      expect(result).toHaveLength(1)
      expect(result[0]!.values).toEqual(['new'])
    })

    it('should not create filter with empty values', () => {
      const filters: FiltersState = []
      const result = filterOperations.setFilterValue(filters, numberCol, [])
      expect(result).toHaveLength(0)
    })

    it('should create a boolean filter', () => {
      const filters: FiltersState = []
      const result = filterOperations.setFilterValue(filters, booleanCol, [
        true,
      ])
      expect(result[0]!.operator).toBe('is')
      expect(result[0]!.values).toEqual([true])
    })

    it('should create a date filter', () => {
      const filters: FiltersState = []
      const d = new Date(2025, 0, 1)
      const result = filterOperations.setFilterValue(filters, dateCol, [d])
      expect(result[0]!.operator).toBe('is')
      expect(result[0]!.values).toEqual([d])
    })
  })

  describe('filterOperations.setFilterOperator', () => {
    it('should update the operator of an existing filter', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['active'],
        },
      ]
      const result = filterOperations.setFilterOperator(
        filters,
        'status',
        'is_not',
      )
      expect(result[0]!.operator).toBe('is_not')
      expect(result[0]!.values).toEqual(['active'])
    })

    it('should not affect other filters', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['active'],
        },
        { columnId: 'name', type: 'text', operator: 'contains', values: ['x'] },
      ]
      const result = filterOperations.setFilterOperator(
        filters,
        'status',
        'is_not',
      )
      expect(result[1]!.operator).toBe('contains')
    })
  })

  describe('filterOperations.removeFilter', () => {
    it('should remove the filter for a column', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['active'],
        },
        { columnId: 'name', type: 'text', operator: 'contains', values: ['x'] },
      ]
      const result = filterOperations.removeFilter(filters, 'status')
      expect(result).toHaveLength(1)
      expect(result[0]!.columnId).toBe('name')
    })
  })

  describe('filterOperations.removeAllFilters', () => {
    it('should return an empty array', () => {
      const result = filterOperations.removeAllFilters()
      expect(result).toEqual([])
    })
  })
})

// ── determineNewOperator ────────────────────────────────────

describe('core/operators', () => {
  describe('determineNewOperator', () => {
    it('should return current operator when counts are the same', () => {
      const result = determineNewOperator(optionOperators, ['a'], ['b'], 'is')
      expect(result).toBe('is')
    })

    it('should return current operator when both are multiple', () => {
      const result = determineNewOperator(
        optionOperators,
        ['a', 'b'],
        ['a', 'b', 'c'],
        'is_any_of',
      )
      expect(result).toBe('is_any_of')
    })

    it('should transition from single to multiple (singular pointer)', () => {
      const result = determineNewOperator(
        optionOperators,
        ['a'],
        ['a', 'b'],
        'is',
      )
      // 'is' has singular: 'is_any_of'
      expect(result).toBe('is_any_of')
    })

    it('should transition from multiple to single (plural pointer)', () => {
      const result = determineNewOperator(
        optionOperators,
        ['a', 'b'],
        ['a'],
        'is_any_of',
      )
      // 'is_any_of' has plural: 'is'
      expect(result).toBe('is')
    })

    it('should keep current operator if no transition reference', () => {
      const result = determineNewOperator(
        defaultOperatorSets.text,
        ['a'],
        ['a', 'b'],
        'contains',
      )
      // 'contains' has no singular reference
      expect(result).toBe('contains')
    })

    it('should keep current operator if not found in set', () => {
      const result = determineNewOperator(
        optionOperators,
        ['a'],
        ['a', 'b'],
        'custom-op',
      )
      expect(result).toBe('custom-op')
    })

    it('should transition 0→2 (empty to multiple)', () => {
      const result = determineNewOperator(optionOperators, [], ['a', 'b'], 'is')
      expect(result).toBe('is_any_of')
    })

    it('should transition 2→0 (multiple to empty)', () => {
      const result = determineNewOperator(
        optionOperators,
        ['a', 'b'],
        [],
        'is_any_of',
      )
      expect(result).toBe('is')
    })
  })

  describe('getOperatorSet', () => {
    it('should return default set for built-in column type', () => {
      const col = makeColumn('status', 'option')
      const set = getOperatorSet(col)
      expect(set).toBe(defaultOperatorSets.option)
    })

    it('should return custom operators when provided on column', () => {
      const customSet = optionOperators.only('is', 'is_not')
      const col = { ...makeColumn('status', 'option'), operators: customSet }
      const set = getOperatorSet(col)
      expect(set).toBe(customSet)
    })

    it('should throw for unknown column type with no operators', () => {
      const col = makeColumn('custom', 'currency' as any)
      expect(() => getOperatorSet(col)).toThrow(
        'No operator set found for column type "currency"',
      )
    })
  })
})

// ── filterRow / filterData ──────────────────────────────────

describe('lib/helpers — filterRow & filterData', () => {
  const data = [
    { name: 'Alice', status: 'active', age: 30, active: true },
    { name: 'Bob', status: 'inactive', age: 25, active: false },
    { name: 'Charlie', status: 'active', age: 35, active: true },
    { name: 'Diana', status: 'pending', age: 28, active: false },
  ]

  describe('filterRow', () => {
    it('should return true when no filters', () => {
      expect(filterRow(data[0], [])).toBe(true)
    })

    it('should filter by text operator', () => {
      const filters: FiltersState = [
        {
          columnId: 'name',
          type: 'text',
          operator: 'contains',
          values: ['ali'],
        },
      ]
      expect(filterRow(data[0], filters)).toBe(true) // Alice
      expect(filterRow(data[1], filters)).toBe(false) // Bob
    })

    it('should filter by option operator', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['active'],
        },
      ]
      expect(filterRow(data[0], filters)).toBe(true) // active
      expect(filterRow(data[1], filters)).toBe(false) // inactive
    })

    it('should filter by number operator', () => {
      const filters: FiltersState = [
        {
          columnId: 'age',
          type: 'number',
          operator: 'is_greater_than',
          values: [28],
        },
      ]
      expect(filterRow(data[0], filters)).toBe(true) // 30
      expect(filterRow(data[1], filters)).toBe(false) // 25
    })

    it('should apply multiple filters (AND)', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['active'],
        },
        {
          columnId: 'age',
          type: 'number',
          operator: 'is_greater_than',
          values: [31],
        },
      ]
      expect(filterRow(data[0], filters)).toBe(false) // active but age=30
      expect(filterRow(data[2], filters)).toBe(true) // active and age=35
    })

    it('should throw for unknown filter type without custom resolver', () => {
      const filters: FiltersState = [
        { columnId: 'x', type: 'currency' as any, operator: 'is', values: [1] },
      ]
      expect(() => filterRow(data[0], filters)).toThrow(
        'No operator set found for filter type "currency"',
      )
    })

    it('should use custom operator set resolver', () => {
      const customFilters: FiltersState = [
        {
          columnId: 'name',
          type: 'custom',
          operator: 'starts with',
          values: ['A'],
        },
      ]
      const customSet = {
        has: (id: string) => id === 'starts with',
        get: (id: string) => ({
          id: 'starts with',
          label: 'starts with',
          target: 'single' as const,
          match: (cell: any, vals: any[]) =>
            typeof cell === 'string' && cell.startsWith(vals[0]),
        }),
      }

      const resolver = (filter: FilterModel) => {
        if (filter.type === 'custom') return customSet as any
        return undefined
      }

      expect(filterRow(data[0], customFilters, resolver)).toBe(true) // Alice
      expect(filterRow(data[1], customFilters, resolver)).toBe(false) // Bob
    })
  })

  describe('filterData', () => {
    it('should return all data with no filters', () => {
      expect(filterData(data, [])).toEqual(data)
    })

    it('should filter data array', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['active'],
        },
      ]
      const result = filterData(data, filters)
      expect(result).toHaveLength(2)
      expect(result.map((r) => r.name)).toEqual(['Alice', 'Charlie'])
    })

    it('should handle boolean filters', () => {
      const filters: FiltersState = [
        {
          columnId: 'active',
          type: 'boolean',
          operator: 'is',
          values: [false],
        },
      ]
      const result = filterData(data, filters)
      expect(result).toHaveLength(2)
      expect(result.map((r) => r.name)).toEqual(['Bob', 'Diana'])
    })

    it('should handle multiple filters', () => {
      const filters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['active'],
        },
        {
          columnId: 'name',
          type: 'text',
          operator: 'contains',
          values: ['char'],
        },
      ]
      const result = filterData(data, filters)
      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Charlie')
    })
  })
})
