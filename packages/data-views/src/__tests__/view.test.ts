import { describe, expect, it } from 'vitest'
import {
  countConditions,
  type FilterCondition,
  type FilterGroup,
  type FilterNode,
  type FiltersState,
  findNode,
  isCondition,
  normalizeFilters,
} from '../core/filter-tree.js'
import type { ColumnDataType, DataViewState, SortState } from '../core/types.js'
import {
  createEmptyViewState,
  mergeFilters,
  mergeSearch,
  mergeSort,
  mergeViewState,
  viewOperations,
} from '../core/view.js'

function condition(
  id: string,
  columnId = id,
  values: unknown[] = [id],
  type: ColumnDataType = 'option',
  operator = 'is',
): FilterCondition {
  return { kind: 'condition', id, columnId, type, operator, values }
}

function group(
  id: string,
  children: FilterNode[] = [],
  op: FilterGroup['op'] = 'and',
): FilterGroup {
  return { kind: 'group', id, op, children }
}

function root(
  id: string,
  children: FilterNode[] = [],
  op: FilterGroup['op'] = 'and',
): FiltersState {
  return group(id, children, op)
}

function makeView(overrides?: Partial<DataViewState>): DataViewState {
  return {
    filters: root('view-root', [
      condition('status-filter', 'status', ['active']),
    ]),
    sort: [{ type: 'column', columnId: 'name', direction: 'desc' }],
    ...overrides,
  }
}

function collectConditions(node: FilterNode): FilterCondition[] {
  if (isCondition(node)) return [node]
  return node.children.flatMap((child) => collectConditions(child))
}

describe('core/view', () => {
  describe('createEmptyViewState', () => {
    it('creates an empty filters tree and empty sort state', () => {
      const result = createEmptyViewState()

      expect(result.filters.kind).toBe('group')
      expect(result.filters.op).toBe('and')
      expect(result.filters.children).toEqual([])
      expect(result.filters.id).toMatch(/^filter_/)
      expect(result.sort).toEqual([])
    })

    it('creates a fresh filters root each time', () => {
      const a = createEmptyViewState()
      const b = createEmptyViewState()

      expect(a).not.toBe(b)
      expect(a.filters.id).not.toBe(b.filters.id)
      expect(a.sort).not.toBe(b.sort)
    })
  })

  describe('mergeFilters', () => {
    it('returns normalized overrides when base is empty', () => {
      const overrides = root('override-root', [
        condition('override-status', 'status', ['active']),
        condition('empty-condition', 'empty', []),
      ])
      const result = mergeFilters(root('base-root'), overrides)

      expect(result).toEqual(normalizeFilters(overrides))
      expect(result.id).toBe('override-root')
      expect(findNode(result, 'empty-condition')).toBeUndefined()
    })

    it('returns normalized base when overrides are empty', () => {
      const base = root('base-root', [
        condition('base-status', 'status', ['active']),
        group('empty-group'),
      ])
      const result = mergeFilters(base, root('override-root'))

      expect(result).toEqual(normalizeFilters(base))
      expect(result.id).toBe('base-root')
      expect(findNode(result, 'empty-group')).toBeUndefined()
    })

    it('returns normalized overrides when both layers are empty', () => {
      const result = mergeFilters(root('base-root'), root('override-root'))

      expect(result).toEqual(root('override-root'))
    })

    it('wraps non-empty base and overrides in a fresh AND root', () => {
      const base = root('base-root', [
        condition('base-status', 'status', ['active']),
      ])
      const overrides = root('override-root', [
        condition('override-tag', 'tags', ['bug'], 'multiOption', 'include'),
      ])
      const result = mergeFilters(base, overrides)

      expect(result.kind).toBe('group')
      expect(result.op).toBe('and')
      expect(result.id).toMatch(/^filter_/)
      expect(result.id).not.toBe('base-root')
      expect(result.id).not.toBe('override-root')
      expect(result.children.map((child) => child.id)).toEqual([
        'base-root',
        'override-root',
      ])
      expect(countConditions(result)).toBe(2)
    })

    it('keeps both same-column conditions instead of overriding by columnId', () => {
      const base = root('base-root', [
        condition('base-status', 'status', ['active'], 'option', 'is'),
      ])
      const overrides = root('override-root', [
        condition('override-status', 'status', ['closed'], 'option', 'is_not'),
      ])
      const result = mergeFilters(base, overrides)
      const conditions = collectConditions(result)

      expect(conditions).toHaveLength(2)
      expect(conditions.map((filter) => filter.id)).toEqual([
        'base-status',
        'override-status',
      ])
      expect(conditions.map((filter) => filter.columnId)).toEqual([
        'status',
        'status',
      ])
      expect(conditions.map((filter) => filter.values)).toEqual([
        ['active'],
        ['closed'],
      ])
    })

    it('preserves nested groups from both layers', () => {
      const base = root('base-root', [
        group('base-nested', [condition('base-status', 'status')], 'or'),
        condition('base-name', 'name', ['Ada'], 'text', 'contains'),
      ])
      const overrides = root('override-root', [
        group('override-nested', [
          condition('override-age', 'age', [30], 'number', 'gt'),
        ]),
        condition('override-tag', 'tags', ['bug'], 'multiOption', 'include'),
      ])
      const result = mergeFilters(base, overrides)

      expect(findNode(result, 'base-root')).toMatchObject({ kind: 'group' })
      expect(findNode(result, 'override-root')).toMatchObject({ kind: 'group' })
      expect(findNode(result, 'base-nested')).toMatchObject({
        kind: 'group',
        op: 'or',
      })
      expect(findNode(result, 'override-nested')).toMatchObject({
        kind: 'group',
        op: 'and',
      })
      expect(collectConditions(result).map((filter) => filter.id)).toEqual([
        'base-status',
        'base-name',
        'override-age',
        'override-tag',
      ])
    })

    it('normalizes empty conditions out of the merged tree', () => {
      const base = root('base-root', [
        condition('base-status', 'status'),
        condition('empty-condition', 'empty', []),
      ])
      const overrides = root('override-root', [
        condition('override-tag', 'tags', ['bug'], 'multiOption', 'include'),
      ])
      const result = mergeFilters(base, overrides)

      expect(countConditions(result)).toBe(2)
      expect(findNode(result, 'empty-condition')).toBeUndefined()
    })

    it('normalizes wrapped roots with one group child', () => {
      const base = root('base-root', [
        group('base-wrapper', [
          group('base-inner', [condition('base-status', 'status')], 'or'),
        ]),
      ])
      const overrides = root('override-root', [
        condition('override-tag', 'tags'),
      ])
      const result = mergeFilters(base, overrides)

      expect(result.id).toMatch(/^filter_/)
      expect(findNode(result, 'base-root')).toBeUndefined()
      expect(findNode(result, 'base-wrapper')).toBeUndefined()
      expect(findNode(result, 'base-inner')).toMatchObject({
        kind: 'group',
        op: 'or',
      })
      expect(countConditions(result)).toBe(2)
    })
  })

  describe('mergeSort', () => {
    it('returns overrides when overrides are non-empty', () => {
      const base: SortState = [
        { type: 'column', columnId: 'title', direction: 'asc' },
      ]
      const overrides: SortState = [
        { type: 'column', columnId: 'age', direction: 'desc' },
      ]

      expect(mergeSort(base, overrides)).toBe(overrides)
    })

    it('falls back to base when overrides are empty', () => {
      const base: SortState = [
        { type: 'column', columnId: 'title', direction: 'asc' },
      ]

      expect(mergeSort(base, [])).toBe(base)
    })

    it('returns the empty base sort when both layers are empty', () => {
      const base: SortState = []

      expect(mergeSort(base, [])).toBe(base)
      expect(mergeSort(base, [])).toEqual([])
    })

    it('does not interleave base and override sort rules', () => {
      const base: SortState = [
        { type: 'column', columnId: 'title', direction: 'asc' },
        { type: 'column', columnId: 'status', direction: 'desc' },
      ]
      const overrides: SortState = [
        { type: 'column', columnId: 'age', direction: 'asc' },
      ]

      expect(mergeSort(base, overrides)).toEqual(overrides)
    })
  })

  describe('mergeSearch', () => {
    it('returns undefined when both layers are undefined', () => {
      expect(mergeSearch(undefined, undefined)).toBeUndefined()
    })

    it('returns undefined when base is empty and overrides are undefined', () => {
      expect(mergeSearch('', undefined)).toBeUndefined()
    })

    it('returns undefined when overrides are empty and base is undefined', () => {
      expect(mergeSearch(undefined, '')).toBeUndefined()
    })

    it('returns base search when only base is non-empty', () => {
      expect(mergeSearch('base query', undefined)).toBe('base query')
    })

    it('returns override search when only overrides are non-empty', () => {
      expect(mergeSearch(undefined, 'override query')).toBe('override query')
    })

    it('returns override search when both layers are non-empty', () => {
      expect(mergeSearch('base query', 'override query')).toBe('override query')
    })

    it('falls back to base search when overrides are empty', () => {
      expect(mergeSearch('base query', '')).toBe('base query')
    })
  })

  describe('mergeViewState', () => {
    it('uses base identity fields while merging filters, sort, and search', () => {
      const overrideSort: SortState = [
        { type: 'column', columnId: 'age', direction: 'asc' },
      ]
      const base = makeView({
        id: 'base-id',
        name: 'Base View',
        meta: { owner: 'base' },
        search: 'base query',
        filters: root('base-root', [condition('base-status', 'status')]),
      })
      const overrides = makeView({
        id: 'override-id',
        name: 'Override View',
        meta: { owner: 'override' },
        search: 'override query',
        filters: root('override-root', [
          condition('override-status', 'status'),
        ]),
        sort: overrideSort,
      })
      const result = mergeViewState(base, overrides)

      expect(result.id).toBe('base-id')
      expect(result.name).toBe('Base View')
      expect(result.meta).toEqual({ owner: 'base' })
      expect(result.search).toBe('override query')
      expect(result.sort).toBe(overrideSort)
      expect(
        collectConditions(result.filters).map((filter) => filter.id),
      ).toEqual(['base-status', 'override-status'])
    })

    it('falls back to base filters, sort, and search when overrides are empty', () => {
      const baseSort: SortState = [
        { type: 'column', columnId: 'name', direction: 'desc' },
      ]
      const base = makeView({
        search: 'base query',
        filters: root('base-root', [condition('base-status', 'status')]),
        sort: baseSort,
      })
      const overrides = makeView({
        search: '',
        filters: root('override-root'),
        sort: [],
      })
      const result = mergeViewState(base, overrides)

      expect(result.filters.id).toBe('base-root')
      expect(result.sort).toBe(baseSort)
      expect(result.search).toBe('base query')
    })
  })

  describe('viewOperations.load', () => {
    it('deep-copies the filters tree and shallow-copies the sort array', () => {
      const source = makeView({
        filters: root('source-root', [
          group('nested-group', [
            condition('source-status', 'status', ['active']),
          ]),
        ]),
      })
      const loaded = viewOperations.load(source)
      const loadedCondition = findNode(loaded.filters, 'source-status')
      const sourceCondition = findNode(source.filters, 'source-status')

      expect(loaded).toEqual(source)
      expect(loaded).not.toBe(source)
      expect(loaded.filters).not.toBe(source.filters)
      expect(loaded.sort).not.toBe(source.sort)
      expect(findNode(loaded.filters, 'nested-group')).not.toBe(
        findNode(source.filters, 'nested-group'),
      )
      expect(loadedCondition).not.toBe(sourceCondition)
      expect(isCondition(loadedCondition!)).toBe(true)
      expect(isCondition(sourceCondition!)).toBe(true)

      if (isCondition(loadedCondition) && isCondition(sourceCondition)) {
        expect(loadedCondition.values).not.toBe(sourceCondition.values)
        loadedCondition.values.push('pending')
        expect(sourceCondition.values).toEqual(['active'])
      }
    })
  })

  describe('viewOperations.snapshot', () => {
    it('creates a defensive snapshot and applies id/name overrides', () => {
      const current = makeView({ id: 'current-id', name: 'Current View' })
      const result = viewOperations.snapshot(current, {
        id: 'snapshot-id',
        name: 'Snapshot View',
      })

      expect(result.id).toBe('snapshot-id')
      expect(result.name).toBe('Snapshot View')
      expect(result.filters).toEqual(current.filters)
      expect(result.filters).not.toBe(current.filters)
      expect(result.sort).toEqual(current.sort)
      expect(result.sort).not.toBe(current.sort)
    })

    it('shallow-merges metadata', () => {
      const current = makeView({
        meta: { owner: 'base', tag: 'old', nested: { pinned: true } },
      })
      const result = viewOperations.snapshot(current, {
        meta: { tag: 'new' },
      })

      expect(result.meta).toEqual({
        owner: 'base',
        tag: 'new',
        nested: { pinned: true },
      })
      expect(result.meta).not.toBe(current.meta)
    })

    it('copies existing metadata when no metadata override is provided', () => {
      const current = makeView({ meta: { owner: 'base' } })
      const result = viewOperations.snapshot(current)

      expect(result.meta).toEqual({ owner: 'base' })
      expect(result.meta).not.toBe(current.meta)
    })
  })

  describe('viewOperations.reset', () => {
    it('returns an empty view when no default is provided', () => {
      const result = viewOperations.reset()

      expect(result.filters.kind).toBe('group')
      expect(result.filters.children).toEqual([])
      expect(result.sort).toEqual([])
    })

    it('returns a fresh empty filters root for each reset', () => {
      const a = viewOperations.reset()
      const b = viewOperations.reset()

      expect(a).not.toBe(b)
      expect(a.filters.id).not.toBe(b.filters.id)
      expect(a.sort).not.toBe(b.sort)
    })

    it('deep-copies a provided default view', () => {
      const defaultView = makeView({ id: 'default-id' })
      const result = viewOperations.reset(defaultView)

      expect(result).toEqual(defaultView)
      expect(result).not.toBe(defaultView)
      expect(result.filters).not.toBe(defaultView.filters)
      expect(result.sort).not.toBe(defaultView.sort)
    })
  })

  describe('viewOperations.merge', () => {
    it('replaces filters wholesale when filters are provided', () => {
      const current = makeView()
      const newFilters = root('new-root', [
        condition('age-filter', 'age', [30], 'number', 'gt'),
      ])
      const result = viewOperations.merge(current, { filters: newFilters })

      expect(result.filters).toBe(newFilters)
      expect(
        collectConditions(result.filters).map((filter) => filter.id),
      ).toEqual(['age-filter'])
      expect(result.sort).toBe(current.sort)
    })

    it('replaces sort wholesale when sort is provided', () => {
      const current = makeView()
      const newSort: SortState = [
        { type: 'column', columnId: 'age', direction: 'asc' },
      ]
      const result = viewOperations.merge(current, { sort: newSort })

      expect(result.sort).toBe(newSort)
      expect(result.filters).toBe(current.filters)
    })

    it('updates search, id, and name when provided', () => {
      const current = makeView({ id: 'old-id', name: 'Old', search: 'old' })
      const result = viewOperations.merge(current, {
        id: 'new-id',
        name: 'New',
        search: '',
      })

      expect(result.id).toBe('new-id')
      expect(result.name).toBe('New')
      expect(result.search).toBe('')
    })

    it('shallow-merges metadata when metadata is provided', () => {
      const current = makeView({ meta: { owner: 'base', tag: 'old' } })
      const result = viewOperations.merge(current, { meta: { tag: 'new' } })

      expect(result.meta).toEqual({ owner: 'base', tag: 'new' })
      expect(result.meta).not.toBe(current.meta)
    })

    it('preserves unspecified properties and returns a new object', () => {
      const current = makeView({ id: 'current-id', name: 'Current' })
      const result = viewOperations.merge(current, {})

      expect(result).toEqual(current)
      expect(result).not.toBe(current)
      expect(result.filters).toBe(current.filters)
      expect(result.sort).toBe(current.sort)
    })
  })
})
