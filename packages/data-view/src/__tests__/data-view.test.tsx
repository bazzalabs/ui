import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type {
  Column,
  ColumnConfig,
  DataViewState,
  FilterStrategy,
} from '../core/types.js'
import { useDataView } from '../react/use-data-view.js'

// ── Helpers ─────────────────────────────────────────────────

type TestRow = {
  id: number
  title: string
  status: string
  tags: string[]
  age: number
  active: boolean
  createdAt: Date
}

const testData: TestRow[] = [
  {
    id: 1,
    title: 'Task A',
    status: 'active',
    tags: ['bug'],
    age: 25,
    active: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    title: 'Task B',
    status: 'pending',
    tags: ['feature', 'urgent'],
    age: 30,
    active: false,
    createdAt: new Date('2024-06-15'),
  },
]

const columnsConfig = [
  {
    id: 'title',
    type: 'text',
    accessor: (r: TestRow) => r.title,
    displayName: 'Title',
  },
  {
    id: 'status',
    type: 'option',
    accessor: (r: TestRow) => r.status,
    displayName: 'Status',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Pending', value: 'pending' },
      { label: 'Closed', value: 'closed' },
    ],
  },
  {
    id: 'tags',
    type: 'multiOption',
    accessor: (r: TestRow) => r.tags,
    displayName: 'Tags',
    options: [
      { label: 'Bug', value: 'bug' },
      { label: 'Feature', value: 'feature' },
      { label: 'Urgent', value: 'urgent' },
    ],
  },
  {
    id: 'age',
    type: 'number',
    accessor: (r: TestRow) => r.age,
    displayName: 'Age',
  },
  {
    id: 'active',
    type: 'boolean',
    accessor: (r: TestRow) => r.active,
    displayName: 'Active',
  },
] as const satisfies ReadonlyArray<ColumnConfig<TestRow, any, any, any>>

function renderDataView(overrides?: Record<string, any>) {
  return renderHook(() =>
    useDataView({
      strategy: 'client' as FilterStrategy,
      data: testData,
      columnsConfig,
      ...overrides,
    }),
  )
}

function getColumn(
  result: ReturnType<typeof renderDataView>['result'],
  id: string,
): Column<any, any> {
  return result.current.columns.find((c) => c.id === id)!
}

// ── Tests ───────────────────────────────────────────────────

describe('useDataView', () => {
  // ── Initialization ──────────────────────────────────────────

  describe('initialization', () => {
    it('should return empty filters and sort by default', () => {
      const { result } = renderDataView()
      expect(result.current.filters).toEqual([])
      expect(result.current.sort).toEqual([])
      expect(result.current.view).toEqual({ filters: [], sort: [] })
    })

    it('should use defaultBaseView for initial base state', () => {
      const defaultBaseView: DataViewState = {
        filters: [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ],
        sort: [{ type: 'column', columnId: 'title', direction: 'desc' }],
      }
      const { result } = renderDataView({ defaultBaseView })
      // Base view state should match
      expect(result.current.baseView.filters).toEqual(defaultBaseView.filters)
      expect(result.current.baseView.sort).toEqual(defaultBaseView.sort)
      // Effective (merged) state should also match since overrides are empty
      expect(result.current.filters).toEqual(defaultBaseView.filters)
      expect(result.current.sort).toEqual(defaultBaseView.sort)
    })

    it('should create columns from config', () => {
      const { result } = renderDataView()
      expect(result.current.columns).toHaveLength(5)
      expect(result.current.columns.map((c) => c.id)).toEqual([
        'title',
        'status',
        'tags',
        'age',
        'active',
      ])
    })

    it('should pass strategy through', () => {
      const { result } = renderDataView({ strategy: 'server' })
      expect(result.current.strategy).toBe('server')
    })

    it('should pass entityName through', () => {
      const { result } = renderDataView({ entityName: 'issues' })
      expect(result.current.entityName).toBe('issues')
    })

    it('should initialize overrides as empty by default', () => {
      const { result } = renderDataView()
      expect(result.current.overrides.filters).toEqual([])
      expect(result.current.overrides.sort).toEqual([])
    })

    it('should use defaultOverrides for initial overrides state', () => {
      const defaultOverrides: DataViewState = {
        filters: [
          {
            columnId: 'tags',
            type: 'multiOption',
            operator: 'include',
            values: ['bug'],
          },
        ],
        sort: [],
      }
      const { result } = renderDataView({ defaultOverrides })
      expect(result.current.overrides.filters).toEqual(defaultOverrides.filters)
    })
  })

  // ── Controlled Mode ─────────────────────────────────────────

  describe('controlled mode', () => {
    it('should throw if baseView is provided without onBaseViewChange', () => {
      expect(() =>
        renderDataView({
          baseView: { filters: [], sort: [] },
        }),
      ).toThrow(
        '[data-view] If using controlled base view, you must specify both `baseView` and `onBaseViewChange`.',
      )
    })

    it('should throw if onBaseViewChange is provided without baseView', () => {
      expect(() =>
        renderDataView({
          onBaseViewChange: vi.fn(),
        }),
      ).toThrow(
        '[data-view] If using controlled base view, you must specify both `baseView` and `onBaseViewChange`.',
      )
    })

    it('should throw if overrides is provided without onOverridesChange', () => {
      expect(() =>
        renderDataView({
          overrides: { filters: [], sort: [] },
        }),
      ).toThrow(
        '[data-view] If using controlled overrides, you must specify both `overrides` and `onOverridesChange`.',
      )
    })

    it('should use external base view state in controlled mode', () => {
      const externalBaseView: DataViewState = {
        filters: [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ],
        sort: [{ type: 'column', columnId: 'title', direction: 'asc' }],
      }
      const onBaseViewChange = vi.fn()
      const { result } = renderDataView({
        baseView: externalBaseView,
        onBaseViewChange,
      })
      expect(result.current.baseView.filters).toEqual(externalBaseView.filters)
      expect(result.current.baseView.sort).toEqual(externalBaseView.sort)
    })

    it('should call dispatch-style onOverridesChange (arity <= 1)', () => {
      const onOverridesChange = vi.fn((_view: DataViewState) => {})
      const externalOverrides: DataViewState = { filters: [], sort: [] }
      const { result } = renderDataView({
        overrides: externalOverrides,
        onOverridesChange,
      })

      act(() => {
        result.current.overrides.toggleColumnSort('title')
      })

      expect(onOverridesChange).toHaveBeenCalledTimes(1)
      const receivedView = onOverridesChange.mock.calls[0][0]
      expect(receivedView.sort).toEqual([
        { type: 'column', columnId: 'title', direction: 'desc' },
      ])
    })

    it('should call custom handler onOverridesChange (arity > 1) with context', () => {
      const onOverridesChange = vi.fn(
        (
          _prev: DataViewState,
          _next: DataViewState,
          _context?: { source: string },
        ) => {},
      )
      const externalOverrides: DataViewState = { filters: [], sort: [] }
      const { result } = renderDataView({
        overrides: externalOverrides,
        onOverridesChange,
      })

      const statusCol = getColumn(result, 'status')
      act(() => {
        result.current.overrides.addFilterValue(statusCol, ['active'], {
          source: 'toolbar',
        })
      })

      expect(onOverridesChange).toHaveBeenCalledTimes(1)
      const [prev, next, context] = onOverridesChange.mock.calls[0]
      expect(prev).toEqual(externalOverrides)
      expect(next.filters).toHaveLength(1)
      expect(next.filters[0].columnId).toBe('status')
      expect(context).toEqual({ source: 'toolbar' })
    })
  })

  // ── Overrides Filter Actions ──────────────────────────────

  describe('overrides filter actions', () => {
    it('addFilterValue: should add a filter for an option column', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')

      act(() => {
        result.current.overrides.addFilterValue(statusCol, ['active'])
      })

      expect(result.current.overrides.filters).toHaveLength(1)
      expect(result.current.overrides.filters[0]).toEqual({
        columnId: 'status',
        type: 'option',
        operator: 'is',
        values: ['active'],
      })
      // Effective filters should also reflect this
      expect(result.current.filters).toHaveLength(1)
    })

    it('addFilterValue: should auto-transition operator when adding multiple values', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')

      act(() => {
        result.current.overrides.addFilterValue(statusCol, ['active'])
      })
      act(() => {
        result.current.overrides.addFilterValue(statusCol, ['pending'])
      })

      expect(result.current.overrides.filters[0].operator).toBe('is_any_of')
      expect(result.current.overrides.filters[0].values).toEqual([
        'active',
        'pending',
      ])
    })

    it('removeFilterValue: should remove a value from an existing filter', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')

      act(() => {
        result.current.overrides.addFilterValue(statusCol, [
          'active',
          'pending',
        ])
      })
      act(() => {
        result.current.overrides.removeFilterValue(statusCol, ['pending'])
      })

      expect(result.current.overrides.filters[0].values).toEqual(['active'])
      expect(result.current.overrides.filters[0].operator).toBe('is')
    })

    it('removeFilterValue: should remove filter entirely when no values remain', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')

      act(() => {
        result.current.overrides.addFilterValue(statusCol, ['active'])
      })
      act(() => {
        result.current.overrides.removeFilterValue(statusCol, ['active'])
      })

      expect(result.current.overrides.filters).toEqual([])
    })

    it('setFilterValue: should set filter values for a number column', () => {
      const { result } = renderDataView()
      const ageCol = getColumn(result, 'age')

      act(() => {
        result.current.overrides.setFilterValue(ageCol, [10, 50])
      })

      expect(result.current.overrides.filters).toHaveLength(1)
      expect(result.current.overrides.filters[0].columnId).toBe('age')
      expect(result.current.overrides.filters[0].values).toEqual([10, 50])
    })

    it('setFilterOperator: should change the operator', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')

      act(() => {
        result.current.overrides.addFilterValue(statusCol, ['active'])
      })
      act(() => {
        result.current.overrides.setFilterOperator('status', 'is_not')
      })

      expect(result.current.overrides.filters[0].operator).toBe('is_not')
    })

    it('removeFilter: should remove a specific column filter', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')
      const tagsCol = getColumn(result, 'tags')

      act(() => {
        result.current.overrides.addFilterValue(statusCol, ['active'])
      })
      act(() => {
        result.current.overrides.addFilterValue(tagsCol, ['bug'])
      })
      act(() => {
        result.current.overrides.removeFilter('status')
      })

      expect(result.current.overrides.filters).toHaveLength(1)
      expect(result.current.overrides.filters[0].columnId).toBe('tags')
    })

    it('removeAllFilters: should clear all override filters', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')
      const tagsCol = getColumn(result, 'tags')

      act(() => {
        result.current.overrides.addFilterValue(statusCol, ['active'])
      })
      act(() => {
        result.current.overrides.addFilterValue(tagsCol, ['bug'])
      })
      act(() => {
        result.current.overrides.removeAllFilters()
      })

      expect(result.current.overrides.filters).toEqual([])
    })
  })

  // ── Overrides Sort Actions ────────────────────────────────

  describe('overrides sort actions', () => {
    it('toggleColumnSort: should add desc sort for new column', () => {
      const { result } = renderDataView()

      act(() => {
        result.current.overrides.toggleColumnSort('title')
      })

      expect(result.current.overrides.sort).toEqual([
        { type: 'column', columnId: 'title', direction: 'desc' },
      ])
    })

    it('toggleColumnSort: should cycle desc -> asc -> none', () => {
      const { result } = renderDataView()

      act(() => {
        result.current.overrides.toggleColumnSort('title')
      })
      expect(result.current.overrides.sort[0]).toEqual({
        type: 'column',
        columnId: 'title',
        direction: 'desc',
      })

      act(() => {
        result.current.overrides.toggleColumnSort('title')
      })
      expect(result.current.overrides.sort[0]).toEqual({
        type: 'column',
        columnId: 'title',
        direction: 'asc',
      })

      act(() => {
        result.current.overrides.toggleColumnSort('title')
      })
      expect(result.current.overrides.sort).toEqual([])
    })

    it('toggleColumnSort: should support multi-column sort', () => {
      const { result } = renderDataView()

      act(() => {
        result.current.overrides.toggleColumnSort('title')
      })
      act(() => {
        result.current.overrides.toggleColumnSort('age')
      })

      expect(result.current.overrides.sort).toHaveLength(2)
    })

    it('setCustomSort: should add a custom sort rule', () => {
      const { result } = renderDataView()

      act(() => {
        result.current.overrides.setCustomSort('relevance', true)
      })

      expect(result.current.overrides.sort).toEqual([
        { type: 'custom', id: 'relevance', enabled: true },
      ])
    })

    it('setCustomSort: should remove a custom sort rule', () => {
      const { result } = renderDataView()

      act(() => {
        result.current.overrides.setCustomSort('relevance', true)
      })
      act(() => {
        result.current.overrides.setCustomSort('relevance', false)
      })

      expect(result.current.overrides.sort).toEqual([])
    })

    it('setSort (via setSort updater): should replace sort state', () => {
      const { result } = renderDataView()

      act(() => {
        result.current.overrides.toggleColumnSort('title')
      })
      act(() => {
        result.current.overrides.setSort([
          { type: 'column', columnId: 'age', direction: 'asc' },
        ])
      })

      expect(result.current.overrides.sort).toEqual([
        { type: 'column', columnId: 'age', direction: 'asc' },
      ])
    })

    it('clearSort: should remove all sort rules', () => {
      const { result } = renderDataView()

      act(() => {
        result.current.overrides.toggleColumnSort('title')
      })
      act(() => {
        result.current.overrides.setCustomSort('relevance', true)
      })
      act(() => {
        result.current.overrides.clearSort()
      })

      expect(result.current.overrides.sort).toEqual([])
    })
  })

  // ── Base View Layer ────────────────────────────────────────

  describe('baseView', () => {
    it('load: should replace base view and clear overrides', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')

      // Add an override first
      act(() => {
        result.current.overrides.addFilterValue(statusCol, ['active'])
      })
      expect(result.current.overrides.filters).toHaveLength(1)

      // Load a new base view
      const newBase: DataViewState = {
        id: 'bugs',
        name: 'Bugs',
        filters: [
          {
            columnId: 'tags',
            type: 'multiOption',
            operator: 'include',
            values: ['bug'],
          },
        ],
        sort: [{ type: 'column', columnId: 'title', direction: 'asc' }],
      }

      act(() => {
        result.current.baseView.load(newBase)
      })

      expect(result.current.baseView.filters).toEqual(newBase.filters)
      expect(result.current.baseView.sort).toEqual(newBase.sort)
      expect(result.current.baseView.id).toBe('bugs')
      expect(result.current.baseView.name).toBe('Bugs')
      // Overrides should be cleared
      expect(result.current.overrides.filters).toEqual([])
      expect(result.current.overrides.sort).toEqual([])
    })

    it('should support modifying base filters directly', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')

      act(() => {
        result.current.baseView.addFilterValue(statusCol, ['active'])
      })

      expect(result.current.baseView.filters).toHaveLength(1)
      expect(result.current.baseView.filters[0].columnId).toBe('status')
    })

    it('setFilters: should accept Updater<FiltersState>', () => {
      const { result } = renderDataView()

      act(() => {
        result.current.baseView.setFilters([
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ])
      })

      expect(result.current.baseView.filters).toHaveLength(1)

      // Test updater function form
      act(() => {
        result.current.baseView.setFilters((prev) => [
          ...prev,
          {
            columnId: 'age',
            type: 'number',
            operator: 'gt',
            values: [10],
          },
        ])
      })

      expect(result.current.baseView.filters).toHaveLength(2)
    })
  })

  // ── Two-Layer Merge ────────────────────────────────────────

  describe('two-layer merge', () => {
    it('effective filters = base + overrides', () => {
      const defaultBaseView: DataViewState = {
        filters: [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ],
        sort: [],
      }
      const { result } = renderDataView({ defaultBaseView })
      const tagsCol = getColumn(result, 'tags')

      // Add an override filter for a different column
      act(() => {
        result.current.overrides.addFilterValue(tagsCol, ['bug'])
      })

      // Effective filters should contain both base + override
      expect(result.current.filters).toHaveLength(2)
      expect(
        result.current.filters.find((f) => f.columnId === 'status'),
      ).toBeTruthy()
      expect(
        result.current.filters.find((f) => f.columnId === 'tags'),
      ).toBeTruthy()
    })

    it('override filter replaces base filter for same column', () => {
      const defaultBaseView: DataViewState = {
        filters: [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ],
        sort: [],
      }
      const { result } = renderDataView({ defaultBaseView })
      const statusCol = getColumn(result, 'status')

      // Override the same column with different values
      act(() => {
        result.current.overrides.addFilterValue(statusCol, ['pending'])
      })

      // Should only have 1 effective filter (override wins for 'status')
      expect(result.current.filters).toHaveLength(1)
      expect(result.current.filters[0].values).toEqual(['pending'])
    })

    it('override sort wins when non-empty', () => {
      const defaultBaseView: DataViewState = {
        filters: [],
        sort: [{ type: 'column', columnId: 'title', direction: 'asc' }],
      }
      const { result } = renderDataView({ defaultBaseView })

      // Add override sort
      act(() => {
        result.current.overrides.toggleColumnSort('age')
      })

      // Override sort should win
      expect(result.current.sort).toEqual([
        { type: 'column', columnId: 'age', direction: 'desc' },
      ])
    })

    it('base sort used when overrides sort is empty', () => {
      const defaultBaseView: DataViewState = {
        filters: [],
        sort: [{ type: 'column', columnId: 'title', direction: 'asc' }],
      }
      const { result } = renderDataView({ defaultBaseView })

      // No override sort — base should show through
      expect(result.current.sort).toEqual([
        { type: 'column', columnId: 'title', direction: 'asc' },
      ])
    })

    it('overrides.reset() clears overrides but keeps base', () => {
      const defaultBaseView: DataViewState = {
        filters: [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ],
        sort: [{ type: 'column', columnId: 'title', direction: 'asc' }],
      }
      const { result } = renderDataView({ defaultBaseView })

      // Add overrides
      act(() => {
        result.current.overrides.toggleColumnSort('age')
      })
      const tagsCol = getColumn(result, 'tags')
      act(() => {
        result.current.overrides.addFilterValue(tagsCol, ['bug'])
      })

      // Now reset overrides
      act(() => {
        result.current.overrides.reset()
      })

      // Overrides are empty
      expect(result.current.overrides.filters).toEqual([])
      expect(result.current.overrides.sort).toEqual([])
      // Base still active
      expect(result.current.filters).toEqual(defaultBaseView.filters)
      expect(result.current.sort).toEqual(defaultBaseView.sort)
    })

    it('removeAllFilters on overrides does not touch base', () => {
      const defaultBaseView: DataViewState = {
        filters: [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ],
        sort: [],
      }
      const { result } = renderDataView({ defaultBaseView })
      const tagsCol = getColumn(result, 'tags')

      act(() => {
        result.current.overrides.addFilterValue(tagsCol, ['bug'])
      })
      act(() => {
        result.current.overrides.removeAllFilters()
      })

      // Override filters cleared
      expect(result.current.overrides.filters).toEqual([])
      // Base filter still there in effective
      expect(result.current.filters).toHaveLength(1)
      expect(result.current.filters[0].columnId).toBe('status')
    })
  })

  // ── Column State Helpers ──────────────────────────────────

  describe('column state helpers', () => {
    it('getIsFiltered: should return true when column is filtered', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')

      expect(statusCol.getIsFiltered()).toBe(false)

      act(() => {
        result.current.overrides.addFilterValue(statusCol, ['active'])
      })

      expect(getColumn(result, 'status').getIsFiltered()).toBe(true)
    })

    it('getFilterValue: should return effective filter', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')

      expect(statusCol.getFilterValue()).toBeUndefined()

      act(() => {
        result.current.overrides.addFilterValue(statusCol, ['active'])
      })

      const filter = getColumn(result, 'status').getFilterValue()
      expect(filter?.columnId).toBe('status')
      expect(filter?.values).toEqual(['active'])
    })

    it('getBaseFilterValue / getOverrideFilterValue: should distinguish layers', () => {
      const defaultBaseView: DataViewState = {
        filters: [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ],
        sort: [],
      }
      const { result } = renderDataView({ defaultBaseView })
      const statusCol = getColumn(result, 'status')
      const tagsCol = getColumn(result, 'tags')

      // Status is in base, not overrides
      expect(statusCol.getBaseFilterValue()).toBeTruthy()
      expect(statusCol.getOverrideFilterValue()).toBeUndefined()

      // Tags is not in either
      expect(tagsCol.getBaseFilterValue()).toBeUndefined()
      expect(tagsCol.getOverrideFilterValue()).toBeUndefined()

      // Add tags to overrides
      act(() => {
        result.current.overrides.addFilterValue(tagsCol, ['bug'])
      })

      expect(getColumn(result, 'tags').getBaseFilterValue()).toBeUndefined()
      expect(getColumn(result, 'tags').getOverrideFilterValue()).toBeTruthy()
    })

    it('setFilterValue: should set override filter via column helper', () => {
      const { result } = renderDataView()
      const ageCol = getColumn(result, 'age')

      act(() => {
        ageCol.setFilterValue([10, 50])
      })

      expect(result.current.overrides.filters).toHaveLength(1)
      expect(result.current.overrides.filters[0].columnId).toBe('age')
    })

    it('addFilterValue / removeFilterValue: via column helper', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')

      act(() => {
        statusCol.addFilterValue(['active'])
      })
      expect(result.current.overrides.filters[0].values).toEqual(['active'])

      act(() => {
        getColumn(result, 'status').addFilterValue(['pending'])
      })
      expect(result.current.overrides.filters[0].values).toEqual([
        'active',
        'pending',
      ])

      act(() => {
        getColumn(result, 'status').removeFilterValue(['active'])
      })
      expect(result.current.overrides.filters[0].values).toEqual(['pending'])
    })

    it('removeFilter: should remove override filter via column helper', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')

      act(() => {
        statusCol.addFilterValue(['active'])
      })
      act(() => {
        getColumn(result, 'status').removeFilter()
      })

      expect(result.current.overrides.filters).toEqual([])
    })

    it('getIsSorted: should return sort direction', () => {
      const { result } = renderDataView()
      const titleCol = getColumn(result, 'title')

      expect(titleCol.getIsSorted()).toBe(false)

      act(() => {
        result.current.overrides.toggleColumnSort('title')
      })

      expect(getColumn(result, 'title').getIsSorted()).toBe('desc')
    })

    it('toggleSorting: should toggle sort via column helper', () => {
      const { result } = renderDataView()
      const titleCol = getColumn(result, 'title')

      act(() => {
        titleCol.toggleSorting()
      })
      expect(getColumn(result, 'title').getIsSorted()).toBe('desc')

      act(() => {
        getColumn(result, 'title').toggleSorting()
      })
      expect(getColumn(result, 'title').getIsSorted()).toBe('asc')

      act(() => {
        getColumn(result, 'title').toggleSorting()
      })
      expect(getColumn(result, 'title').getIsSorted()).toBe(false)
    })

    it('clearSorting: should clear sort for this column only', () => {
      const { result } = renderDataView()

      act(() => {
        result.current.overrides.toggleColumnSort('title')
      })
      act(() => {
        result.current.overrides.toggleColumnSort('age')
      })
      expect(result.current.overrides.sort).toHaveLength(2)

      act(() => {
        getColumn(result, 'title').clearSorting()
      })

      expect(result.current.overrides.sort).toHaveLength(1)
      expect(result.current.overrides.sort[0]).toEqual({
        type: 'column',
        columnId: 'age',
        direction: 'desc',
      })
    })

    it('getSortIndex: should return position in sort array', () => {
      const { result } = renderDataView()

      act(() => {
        result.current.overrides.toggleColumnSort('title')
      })
      act(() => {
        result.current.overrides.toggleColumnSort('age')
      })

      expect(getColumn(result, 'title').getSortIndex()).toBe(0)
      expect(getColumn(result, 'age').getSortIndex()).toBe(1)
      expect(getColumn(result, 'status').getSortIndex()).toBe(-1)
    })
  })

  // ── Snapshot ──────────────────────────────────────────────

  describe('snapshot', () => {
    it('should capture the merged state', () => {
      const defaultBaseView: DataViewState = {
        filters: [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ],
        sort: [],
      }
      const { result } = renderDataView({ defaultBaseView })
      const tagsCol = getColumn(result, 'tags')

      act(() => {
        result.current.overrides.addFilterValue(tagsCol, ['bug'])
      })
      act(() => {
        result.current.overrides.toggleColumnSort('title')
      })

      let snapshot: DataViewState
      act(() => {
        snapshot = result.current.snapshot({ name: 'Saved View' })
      })

      expect(snapshot!.name).toBe('Saved View')
      // Should contain both base + override filters
      expect(snapshot!.filters).toHaveLength(2)
      expect(snapshot!.sort).toHaveLength(1)
      // Should be independent copy
      expect(snapshot!.filters).not.toBe(result.current.filters)
    })
  })

  // ── Batch ───────────────────────────────────────────────────

  describe('batch', () => {
    it('should apply multiple override operations atomically', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')
      const tagsCol = getColumn(result, 'tags')

      act(() => {
        result.current.batch((actions) => {
          actions.addFilterValue(statusCol, ['active'])
          actions.addFilterValue(tagsCol, ['bug', 'feature'])
        })
      })

      expect(result.current.overrides.filters).toHaveLength(2)
    })

    it('should apply mixed filter + sort operations atomically', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')

      act(() => {
        result.current.batch((actions) => {
          actions.addFilterValue(statusCol, ['active'])
          actions.toggleColumnSort('title')
          actions.setCustomSort('relevance', true)
        })
      })

      expect(result.current.overrides.filters).toHaveLength(1)
      expect(result.current.overrides.sort).toHaveLength(2)
    })

    it('should clear and re-add in a single batch', () => {
      const { result } = renderDataView()
      const statusCol = getColumn(result, 'status')

      act(() => {
        result.current.overrides.addFilterValue(statusCol, ['active'])
      })
      act(() => {
        result.current.overrides.toggleColumnSort('title')
      })

      act(() => {
        result.current.batch((actions) => {
          actions.removeAllFilters()
          actions.clearSort()
          actions.addFilterValue(statusCol, ['pending'])
          actions.toggleColumnSort('age')
        })
      })

      expect(result.current.overrides.filters).toHaveLength(1)
      expect(result.current.overrides.filters[0].values).toEqual(['pending'])
      expect(result.current.overrides.sort).toEqual([
        { type: 'column', columnId: 'age', direction: 'desc' },
      ])
    })
  })

  // ── Edge Cases ──────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle empty data array', () => {
      const { result } = renderHook(() =>
        useDataView({
          strategy: 'client',
          data: [],
          columnsConfig,
        }),
      )
      expect(result.current.columns).toHaveLength(5)
      expect(result.current.filters).toEqual([])
    })

    it('sort actions on overrides should not affect base filters', () => {
      const defaultBaseView: DataViewState = {
        filters: [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ],
        sort: [],
      }
      const { result } = renderDataView({ defaultBaseView })

      act(() => {
        result.current.overrides.toggleColumnSort('title')
      })

      // Base filters untouched
      expect(result.current.baseView.filters).toEqual(defaultBaseView.filters)
    })

    it('filter actions on overrides should not affect base sort', () => {
      const defaultBaseView: DataViewState = {
        filters: [],
        sort: [{ type: 'column', columnId: 'title', direction: 'asc' }],
      }
      const { result } = renderDataView({ defaultBaseView })
      const statusCol = getColumn(result, 'status')

      act(() => {
        result.current.overrides.addFilterValue(statusCol, ['active'])
      })

      // Base sort untouched
      expect(result.current.baseView.sort).toEqual(defaultBaseView.sort)
    })

    it('processedData should use merged state for client strategy', () => {
      const defaultBaseView: DataViewState = {
        filters: [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ],
        sort: [],
      }
      const { result } = renderDataView({ defaultBaseView })

      // Base filter: status = active → only Task A (status: 'active')
      expect(result.current.processedData).toHaveLength(1)
      expect(result.current.processedData[0].title).toBe('Task A')
    })
  })

  // ── createTypedDataView ───────────────────────────────────

  describe('createTypedDataView', () => {
    it('should be importable and callable', async () => {
      const { createTypedDataView } = await import('../react/use-data-view.js')
      const useTyped = createTypedDataView<{ source: string }>()
      expect(typeof useTyped).toBe('function')
    })
  })
})
