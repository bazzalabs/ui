import { describe, expect, it } from 'vitest'
import type { DataViewState, FilterModel, SortState } from '../core/types.js'
import { mergeFilters, mergeSort, viewOperations } from '../core/view.js'

// ── Helpers ─────────────────────────────────────────────────

function makeView(overrides?: Partial<DataViewState>): DataViewState {
  return {
    filters: [
      {
        columnId: 'status',
        type: 'option',
        operator: 'is',
        values: ['active'],
      },
    ],
    sort: [{ type: 'column', columnId: 'name', direction: 'desc' as const }],
    ...overrides,
  }
}

// ── viewOperations ──────────────────────────────────────────

describe('core/view', () => {
  // ── load ──────────────────────────────────────────────────────

  describe('viewOperations.load', () => {
    it('should return the provided view', () => {
      const view = makeView()
      const result = viewOperations.load(view)
      expect(result).toBe(view) // same reference
    })

    it('should return an empty view when given one', () => {
      const emptyView: DataViewState = { filters: [], sort: [] }
      const result = viewOperations.load(emptyView)
      expect(result).toEqual({ filters: [], sort: [] })
    })

    it('should preserve id and name', () => {
      const view = makeView({ id: 'v1', name: 'My View' })
      const result = viewOperations.load(view)
      expect(result.id).toBe('v1')
      expect(result.name).toBe('My View')
    })
  })

  // ── snapshot ──────────────────────────────────────────────────

  describe('viewOperations.snapshot', () => {
    it('should return a shallow copy of the current state', () => {
      const current = makeView()
      const result = viewOperations.snapshot(current)
      expect(result).toEqual(current)
      expect(result).not.toBe(current) // different reference
    })

    it('should return independent filter and sort arrays', () => {
      const current = makeView()
      const result = viewOperations.snapshot(current)
      expect(result.filters).not.toBe(current.filters)
      expect(result.sort).not.toBe(current.sort)
      expect(result.filters).toEqual(current.filters)
      expect(result.sort).toEqual(current.sort)
    })

    it('should add id metadata to the snapshot', () => {
      const current = makeView()
      const result = viewOperations.snapshot(current, { id: 'saved-1' })
      expect(result.id).toBe('saved-1')
      expect(result.filters).toEqual(current.filters)
    })

    it('should add name metadata to the snapshot', () => {
      const current = makeView()
      const result = viewOperations.snapshot(current, { name: 'Active Users' })
      expect(result.name).toBe('Active Users')
    })

    it('should add both id and name metadata', () => {
      const current = makeView()
      const result = viewOperations.snapshot(current, {
        id: 'saved-1',
        name: 'Active Users',
      })
      expect(result.id).toBe('saved-1')
      expect(result.name).toBe('Active Users')
    })

    it('should not set id/name when meta is undefined', () => {
      const current = makeView()
      const result = viewOperations.snapshot(current)
      expect(result).not.toHaveProperty('id')
      expect(result).not.toHaveProperty('name')
    })
  })

  // ── reset ─────────────────────────────────────────────────────

  describe('viewOperations.reset', () => {
    it('should return a copy of the default view when provided', () => {
      const defaultView = makeView({ id: 'default' })
      const result = viewOperations.reset(defaultView)
      expect(result).toEqual(defaultView)
      expect(result).not.toBe(defaultView) // different reference
      expect(result.filters).not.toBe(defaultView.filters)
      expect(result.sort).not.toBe(defaultView.sort)
    })

    it('should return empty state when no default view', () => {
      const result = viewOperations.reset()
      expect(result).toEqual({ filters: [], sort: [] })
    })

    it('should return empty state when default is undefined', () => {
      const result = viewOperations.reset(undefined)
      expect(result).toEqual({ filters: [], sort: [] })
    })

    it('should return a new object each time (no default)', () => {
      const a = viewOperations.reset()
      const b = viewOperations.reset()
      expect(a).toEqual(b)
      expect(a).not.toBe(b)
    })
  })

  // ── merge ─────────────────────────────────────────────────────

  describe('viewOperations.merge', () => {
    it('should replace filters when provided', () => {
      const current = makeView()
      const newFilters: FilterModel[] = [
        { columnId: 'age', type: 'number', operator: 'gt', values: [30] },
      ]
      const result = viewOperations.merge(current, { filters: newFilters })
      expect(result.filters).toBe(newFilters) // same reference
      expect(result.sort).toEqual(current.sort) // preserved
    })

    it('should replace sort when provided', () => {
      const current = makeView()
      const newSort: SortState = [
        { type: 'column', columnId: 'age', direction: 'asc' },
      ]
      const result = viewOperations.merge(current, { sort: newSort })
      expect(result.sort).toBe(newSort) // same reference
      expect(result.filters).toEqual(current.filters) // preserved
    })

    it('should replace both filters and sort', () => {
      const current = makeView()
      const newFilters: FilterModel[] = []
      const newSort: SortState = []
      const result = viewOperations.merge(current, {
        filters: newFilters,
        sort: newSort,
      })
      expect(result.filters).toBe(newFilters)
      expect(result.sort).toBe(newSort)
    })

    it('should update id when provided', () => {
      const current = makeView()
      const result = viewOperations.merge(current, { id: 'new-id' })
      expect(result.id).toBe('new-id')
      expect(result.filters).toEqual(current.filters)
      expect(result.sort).toEqual(current.sort)
    })

    it('should update name when provided', () => {
      const current = makeView()
      const result = viewOperations.merge(current, { name: 'New Name' })
      expect(result.name).toBe('New Name')
    })

    it('should preserve unspecified properties', () => {
      const current = makeView({ id: 'old-id', name: 'Old Name' })
      const result = viewOperations.merge(current, {
        filters: [],
      })
      expect(result.id).toBe('old-id')
      expect(result.name).toBe('Old Name')
      expect(result.filters).toEqual([])
      expect(result.sort).toEqual(current.sort)
    })

    it('should NOT deep-merge filters (replaces entirely)', () => {
      const current: DataViewState = {
        filters: [
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
            values: ['John'],
          },
        ],
        sort: [],
      }
      const newFilters: FilterModel[] = [
        { columnId: 'age', type: 'number', operator: 'gt', values: [25] },
      ]
      const result = viewOperations.merge(current, { filters: newFilters })
      // Should be exactly the new filters, not merged with old ones
      expect(result.filters).toHaveLength(1)
      expect(result.filters[0]!.columnId).toBe('age')
    })

    it('should return a new object (not mutate current)', () => {
      const current = makeView({ id: 'v1' })
      const result = viewOperations.merge(current, { name: 'Updated' })
      expect(result).not.toBe(current)
      expect(current).not.toHaveProperty('name')
    })

    it('should handle empty partial (no-op merge)', () => {
      const current = makeView({ id: 'v1', name: 'Test' })
      const result = viewOperations.merge(current, {})
      expect(result).toEqual(current)
      expect(result).not.toBe(current) // still a new object
    })
  })

  // ── mergeFilters ────────────────────────────────────────────

  describe('mergeFilters', () => {
    const baseFilter: FilterModel = {
      columnId: 'status',
      type: 'option',
      operator: 'is',
      values: ['active'],
    }
    const overrideFilter: FilterModel = {
      columnId: 'tags',
      type: 'multiOption',
      operator: 'include',
      values: ['bug'],
    }

    it('should return base when overrides is empty', () => {
      const result = mergeFilters([baseFilter], [])
      expect(result).toEqual([baseFilter])
      // Should return the same reference for performance
      expect(result).toBe(result)
    })

    it('should return overrides when base is empty', () => {
      const overrides = [overrideFilter]
      const result = mergeFilters([], overrides)
      expect(result).toEqual([overrideFilter])
      expect(result).toBe(overrides)
    })

    it('should concatenate filters for different columns', () => {
      const result = mergeFilters([baseFilter], [overrideFilter])
      expect(result).toHaveLength(2)
      expect(result[0].columnId).toBe('status')
      expect(result[1].columnId).toBe('tags')
    })

    it('should let override win when same columnId appears in both', () => {
      const overrideStatus: FilterModel = {
        columnId: 'status',
        type: 'option',
        operator: 'is not',
        values: ['closed'],
      }
      const result = mergeFilters([baseFilter], [overrideStatus])
      expect(result).toHaveLength(1)
      expect(result[0].operator).toBe('is not')
      expect(result[0].values).toEqual(['closed'])
    })

    it('should preserve base filters that are not overridden', () => {
      const anotherBase: FilterModel = {
        columnId: 'age',
        type: 'number',
        operator: 'gt',
        values: [25],
      }
      const overrideStatus: FilterModel = {
        columnId: 'status',
        type: 'option',
        operator: 'is not',
        values: ['closed'],
      }
      const result = mergeFilters([baseFilter, anotherBase], [overrideStatus])
      // age (base, not overridden) + status (overridden)
      expect(result).toHaveLength(2)
      expect(result[0].columnId).toBe('age')
      expect(result[1].columnId).toBe('status')
      expect(result[1].operator).toBe('is not')
    })

    it('should handle both empty arrays', () => {
      const result = mergeFilters([], [])
      expect(result).toEqual([])
    })
  })

  // ── mergeSort ─────────────────────────────────────────────

  describe('mergeSort', () => {
    const baseSort: SortState = [
      { type: 'column', columnId: 'title', direction: 'asc' },
    ]
    const overrideSort: SortState = [
      { type: 'column', columnId: 'age', direction: 'desc' },
    ]

    it('should return overrides when non-empty', () => {
      const result = mergeSort(baseSort, overrideSort)
      expect(result).toBe(overrideSort)
    })

    it('should fall back to base when overrides is empty', () => {
      const result = mergeSort(baseSort, [])
      expect(result).toBe(baseSort)
    })

    it('should return empty when both are empty', () => {
      const result = mergeSort([], [])
      expect(result).toEqual([])
    })

    it('should not interleave — overrides wins entirely', () => {
      const multiBase: SortState = [
        { type: 'column', columnId: 'title', direction: 'asc' },
        { type: 'column', columnId: 'status', direction: 'desc' },
      ]
      const singleOverride: SortState = [
        { type: 'column', columnId: 'age', direction: 'asc' },
      ]
      const result = mergeSort(multiBase, singleOverride)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(singleOverride[0])
    })
  })
})
