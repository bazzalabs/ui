import { describe, expect, it } from 'vitest'
import {
  countConditions,
  type FilterCondition,
  type FilterGroup,
  type FilterNode,
  type FiltersState,
  filterOperations,
  findConditionsForColumn,
  findNode,
  isCondition,
} from '../core/filter-tree.js'
import type { ColumnDataType } from '../core/types.js'

function column<T extends ColumnDataType>(id: string, type: T) {
  return { id, type }
}

const optionColumn = column('status', 'option')
const multiOptionColumn = column('tags', 'multiOption')
const textColumn = column('name', 'text')
const numberColumn = column('age', 'number')
const bigIntColumn = column('amount', 'bigint')
const dateColumn = column('createdAt', 'date')
const booleanColumn = column('active', 'boolean')

function condition(
  id: string,
  columnId: string,
  type: ColumnDataType,
  operator: string,
  values: unknown[],
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

function root(children: FilterNode[] = [], op: FilterGroup['op'] = 'and') {
  return group('root', children, op)
}

function rootConditions(state: FiltersState, columnId: string) {
  return state.children.filter(
    (child): child is FilterCondition =>
      isCondition(child) && child.columnId === columnId,
  )
}

describe('core/filter-tree filterOperations', () => {
  describe('addFilterValue', () => {
    it('creates a root-level option condition with the single-value default', () => {
      const result = filterOperations.addFilterValue(root(), optionColumn, [
        'active',
      ])
      const [filter] = rootConditions(result, 'status')

      expect(filter).toMatchObject({
        kind: 'condition',
        columnId: 'status',
        type: 'option',
        operator: 'is',
        values: ['active'],
      })
      expect(filter?.id).toMatch(/^filter_/)
    })

    it('uses the multiple-value default when creating with multiple values', () => {
      const result = filterOperations.addFilterValue(root(), optionColumn, [
        'active',
        'pending',
      ])

      expect(rootConditions(result, 'status')[0]).toMatchObject({
        operator: 'is_any_of',
        values: ['active', 'pending'],
      })
    })

    it('adds unique values and transitions option operators from single to multiple', () => {
      const existing = condition('status-filter', 'status', 'option', 'is', [
        'active',
      ])
      const state = root([existing])
      const result = filterOperations.addFilterValue(state, optionColumn, [
        'pending',
        'pending',
      ])

      expect(rootConditions(result, 'status')[0]).toMatchObject({
        id: 'status-filter',
        operator: 'is_any_of',
        values: ['active', 'pending'],
      })
    })

    it('works with multiOption defaults and transitions', () => {
      const created = filterOperations.addFilterValue(
        root(),
        multiOptionColumn,
        ['bug'],
      )
      const updated = filterOperations.addFilterValue(
        created,
        multiOptionColumn,
        ['feature'],
      )

      expect(rootConditions(created, 'tags')[0]?.operator).toBe('include')
      expect(rootConditions(updated, 'tags')[0]).toMatchObject({
        operator: 'include_any_of',
        values: ['bug', 'feature'],
      })
    })

    it('throws for non-option columns', () => {
      expect(() =>
        filterOperations.addFilterValue(root(), textColumn, ['hello']),
      ).toThrow(
        '[data-views] addFilterValue() is only supported for option and multiOption columns',
      )
    })

    it('does not edit nested conditions when no root-level condition exists', () => {
      const nested = condition('nested-status', 'status', 'option', 'is', [
        'archived',
      ])
      const state = root([group('nested-group', [nested])])
      const result = filterOperations.addFilterValue(state, optionColumn, [
        'active',
      ])

      expect(findNode(result, 'nested-status')).toBe(nested)
      expect(rootConditions(result, 'status')).toHaveLength(1)
      expect(rootConditions(result, 'status')[0]?.values).toEqual(['active'])
    })
  })

  describe('removeFilterValue', () => {
    it('removes values and transitions option operators from multiple to single', () => {
      const state = root([
        condition('status-filter', 'status', 'option', 'is_any_of', [
          'active',
          'pending',
        ]),
      ])
      const result = filterOperations.removeFilterValue(state, optionColumn, [
        'pending',
      ])

      expect(rootConditions(result, 'status')[0]).toMatchObject({
        id: 'status-filter',
        operator: 'is',
        values: ['active'],
      })
    })

    it('removes the root condition when no values remain', () => {
      const state = root([
        condition('status-filter', 'status', 'option', 'is', ['active']),
      ])
      const result = filterOperations.removeFilterValue(state, optionColumn, [
        'active',
      ])

      expect(result.children).toEqual([])
    })

    it('returns a normalized state when the column is not root-filtered', () => {
      const nested = condition('nested-status', 'status', 'option', 'is', [
        'active',
      ])
      const state = root([
        group('nested-group', [nested]),
        condition('name-filter', 'name', 'text', 'contains', ['a']),
      ])
      const result = filterOperations.removeFilterValue(state, optionColumn, [
        'active',
      ])

      expect(findNode(result, 'nested-status')).toBe(nested)
      expect(rootConditions(result, 'status')).toEqual([])
    })

    it('works with multiOption operator transitions', () => {
      const state = root([
        condition('tags-filter', 'tags', 'multiOption', 'include_any_of', [
          'bug',
          'feature',
        ]),
      ])
      const result = filterOperations.removeFilterValue(
        state,
        multiOptionColumn,
        ['feature'],
      )

      expect(rootConditions(result, 'tags')[0]).toMatchObject({
        operator: 'include',
        values: ['bug'],
      })
    })

    it('throws for non-option columns', () => {
      expect(() =>
        filterOperations.removeFilterValue(root(), numberColumn, [1]),
      ).toThrow(
        '[data-views] removeFilterValue() is only supported for option and multiOption columns',
      )
    })
  })

  describe('setFilterValue', () => {
    it('creates text filters and de-duplicates values', () => {
      const result = filterOperations.setFilterValue(root(), textColumn, [
        'hello',
        'hello',
        'world',
      ])

      expect(rootConditions(result, 'name')[0]).toMatchObject({
        type: 'text',
        operator: 'contains',
        values: ['hello', 'world'],
      })
    })

    it('updates the first root-level condition only and preserves nested matches', () => {
      const first = condition('first-status', 'status', 'option', 'is', [
        'active',
      ])
      const second = condition('second-status', 'status', 'option', 'is', [
        'archived',
      ])
      const nested = condition('nested-status', 'status', 'option', 'is', [
        'nested',
      ])
      const state = root([first, group('nested-group', [nested]), second])
      const result = filterOperations.setFilterValue(state, optionColumn, [
        'active',
        'pending',
      ])

      expect(rootConditions(result, 'status')[0]).toMatchObject({
        id: 'first-status',
        operator: 'is_any_of',
        values: ['active', 'pending'],
      })
      expect(rootConditions(result, 'status')[1]).toBe(second)
      expect(findNode(result, 'nested-status')).toBe(nested)
    })

    it('transitions an existing option condition back to single-value operator', () => {
      const state = root([
        condition('status-filter', 'status', 'option', 'is_any_of', [
          'active',
          'pending',
        ]),
      ])
      const result = filterOperations.setFilterValue(state, optionColumn, [
        'active',
      ])

      expect(rootConditions(result, 'status')[0]).toMatchObject({
        operator: 'is',
        values: ['active'],
      })
    })

    it('normalizes number ranges and uses the multiple-value default', () => {
      const result = filterOperations.setFilterValue(
        root(),
        numberColumn,
        [10, 5],
      )

      expect(rootConditions(result, 'age')[0]).toMatchObject({
        operator: 'is_between',
        values: [5, 10],
      })
    })

    it('normalizes bigint ranges', () => {
      const result = filterOperations.setFilterValue(root(), bigIntColumn, [
        10n,
        5n,
      ])

      expect(rootConditions(result, 'amount')[0]).toMatchObject({
        operator: 'is_between',
        values: [5n, 10n],
      })
    })

    it('normalizes date ranges', () => {
      const later = new Date(2025, 6, 1)
      const earlier = new Date(2025, 0, 1)
      const result = filterOperations.setFilterValue(root(), dateColumn, [
        later,
        earlier,
      ])

      expect(rootConditions(result, 'createdAt')[0]).toMatchObject({
        operator: 'is_between',
        values: [earlier, later],
      })
    })

    it('creates boolean filters with the single-value default', () => {
      const result = filterOperations.setFilterValue(root(), booleanColumn, [
        true,
      ])

      expect(rootConditions(result, 'active')[0]).toMatchObject({
        operator: 'is',
        values: [true],
      })
    })

    it('does not create a new filter or clear an existing one for empty values', () => {
      const existing = condition('name-filter', 'name', 'text', 'contains', [
        'old',
      ])

      expect(filterOperations.setFilterValue(root(), textColumn, [])).toEqual(
        root(),
      )
      expect(
        filterOperations.setFilterValue(root([existing]), textColumn, []),
      ).toEqual(root([existing]))
    })

    it('appends a root condition instead of editing a nested condition for the same column', () => {
      const nested = condition('nested-status', 'status', 'option', 'is', [
        'nested',
      ])
      const state = root([group('nested-group', [nested])])
      const result = filterOperations.setFilterValue(state, optionColumn, [
        'active',
      ])

      expect(findNode(result, 'nested-status')).toBe(nested)
      expect(rootConditions(result, 'status')).toHaveLength(1)
      expect(rootConditions(result, 'status')[0]).toMatchObject({
        operator: 'is',
        values: ['active'],
      })
    })
  })

  describe('setFilterOperator', () => {
    it('updates all root-level conditions for a column only', () => {
      const first = condition('first-status', 'status', 'option', 'is', [
        'active',
      ])
      const second = condition('second-status', 'status', 'option', 'is', [
        'pending',
      ])
      const nested = condition('nested-status', 'status', 'option', 'is', [
        'nested',
      ])
      const state = root([first, group('nested-group', [nested]), second])
      const result = filterOperations.setFilterOperator(
        state,
        'status',
        'is_not',
      )

      expect(
        rootConditions(result, 'status').map((filter) => filter.operator),
      ).toEqual(['is_not', 'is_not'])
      expect(findNode(result, 'nested-status')).toBe(nested)
    })
  })

  describe('removeFilter', () => {
    it('removes every condition for a column anywhere in the tree', () => {
      const state = root([
        condition('root-status', 'status', 'option', 'is', ['active']),
        group('nested-group', [
          condition('nested-status', 'status', 'option', 'is', ['pending']),
          condition('nested-name', 'name', 'text', 'contains', ['a']),
        ]),
        group('emptied-group', [
          condition('another-status', 'status', 'option', 'is', ['archived']),
        ]),
      ])
      const result = filterOperations.removeFilter(state, 'status')

      expect(findConditionsForColumn(result, 'status')).toEqual([])
      expect(countConditions(result)).toBe(1)
      expect(findNode(result, 'emptied-group')).toBeUndefined()
      expect(findNode(result, 'nested-name')).toBeDefined()
    })
  })

  describe('removeAllFilters', () => {
    it('clears children, resets the root operator to and, and preserves the root id', () => {
      const state = root(
        [condition('name-filter', 'name', 'text', 'contains', ['hello'])],
        'or',
      )
      const result = filterOperations.removeAllFilters(state)

      expect(result).toEqual({
        kind: 'group',
        id: 'root',
        op: 'and',
        children: [],
      })
    })
  })
})
