import { describe, expect, it } from 'vitest'
import type {
  FilterCondition,
  FilterGroup,
  FilterNode,
  FiltersState,
} from '../core/filter-tree.js'
import { findConditionsForColumn, isCondition } from '../core/filter-tree.js'
import {
  type ColumnIds,
  condition,
  createFilterActions,
  group,
} from '../core/typed.js'
import type { ColumnDataType } from '../core/types.js'

const columns = [
  { id: 'status', type: 'option' },
  { id: 'estimate', type: 'number' },
  { id: 'createdAt', type: 'date' },
] as const

const actions = createFilterActions(columns)

function conditionNode(
  id: string,
  columnId: string,
  type: ColumnDataType,
  operator: string,
  values: unknown[],
): FilterCondition {
  return { kind: 'condition', id, columnId, type, operator, values }
}

function groupNode(
  id: string,
  children: FilterNode[] = [],
  op: FilterGroup['op'] = 'and',
): FilterGroup {
  return { kind: 'group', id, op, children }
}

function root(children: FilterNode[] = [], op: FilterGroup['op'] = 'and') {
  return groupNode('root', children, op)
}

function rootConditions(state: FiltersState, columnId: string) {
  return state.children.filter(
    (child): child is FilterCondition =>
      isCondition(child) && child.columnId === columnId,
  )
}

describe('core/typed', () => {
  describe('condition and group', () => {
    it('creates typed nodes with generated ids', () => {
      const filter = condition(columns, 'status', 'is', ['active'])
      const filters = group('or', [filter])

      expect(filter).toMatchObject({
        kind: 'condition',
        columnId: 'status',
        type: 'option',
        operator: 'is',
        values: ['active'],
      })
      expect(filter.id).toMatch(/^filter_/)
      expect(filters).toMatchObject({ kind: 'group', op: 'or' })
      expect(filters.id).toMatch(/^filter_/)
      expect(filters.children).toEqual([filter])
    })
  })

  describe('createFilterActions', () => {
    it('adds a root-level condition', () => {
      const existing = conditionNode(
        'estimate-filter',
        'estimate',
        'number',
        'is',
        [3],
      )
      const result = actions.add(root([existing]), 'status', {
        operator: 'is',
        values: ['active'],
      })

      expect(result.children).toHaveLength(2)
      expect(result.children[0]).toBe(existing)
      expect(rootConditions(result, 'status')[0]).toMatchObject({
        kind: 'condition',
        columnId: 'status',
        type: 'option',
        operator: 'is',
        values: ['active'],
      })
      expect(rootConditions(result, 'status')[0]?.id).toMatch(/^filter_/)
    })

    it('sets values through the existing filter operations', () => {
      const later = new Date(2025, 6, 1)
      const earlier = new Date(2025, 0, 1)

      const withOption = actions.setValues(root(), 'status', [
        'active',
        'pending',
      ])
      const withNumber = actions.setValues(withOption, 'estimate', [10, 5])
      const withDate = actions.setValues(withNumber, 'createdAt', [
        later,
        earlier,
      ])

      expect(rootConditions(withDate, 'status')[0]).toMatchObject({
        type: 'option',
        operator: 'is_any_of',
        values: ['active', 'pending'],
      })
      expect(rootConditions(withDate, 'estimate')[0]).toMatchObject({
        type: 'number',
        operator: 'is_between',
        values: [5, 10],
      })
      expect(rootConditions(withDate, 'createdAt')[0]).toMatchObject({
        type: 'date',
        operator: 'is_between',
        values: [earlier, later],
      })
    })

    it('sets operators for root-level conditions', () => {
      const state = root([
        conditionNode('first-status', 'status', 'option', 'is', ['active']),
        conditionNode('second-status', 'status', 'option', 'is', ['pending']),
        groupNode('nested', [
          conditionNode('nested-status', 'status', 'option', 'is', ['nested']),
        ]),
      ])
      const result = actions.setOperator(state, 'status', 'is_not')

      expect(
        rootConditions(result, 'status').map((filter) => filter.operator),
      ).toEqual(['is_not', 'is_not'])
      expect(findConditionsForColumn(result, 'status')).toHaveLength(3)
      expect(
        findConditionsForColumn(result, 'status').find(
          (filter) => filter.id === 'nested-status',
        )?.operator,
      ).toBe('is')
    })

    it('removes one column tree-wide', () => {
      const state = root([
        conditionNode('root-status', 'status', 'option', 'is', ['active']),
        groupNode('nested', [
          conditionNode('nested-status', 'status', 'option', 'is', ['pending']),
          conditionNode('nested-estimate', 'estimate', 'number', 'is', [3]),
        ]),
      ])
      const result = actions.remove(state, 'status')

      expect(findConditionsForColumn(result, 'status')).toEqual([])
      expect(findConditionsForColumn(result, 'estimate')).toEqual([
        conditionNode('nested-estimate', 'estimate', 'number', 'is', [3]),
      ])
    })

    it('removes all filters while preserving the root id', () => {
      const state = root(
        [conditionNode('status-filter', 'status', 'option', 'is', ['active'])],
        'or',
      )
      const result = actions.removeAll(state)

      expect(result).toEqual({
        kind: 'group',
        id: 'root',
        op: 'and',
        children: [],
      })
    })

    it('throws when a runtime column id is not present', () => {
      expect(() =>
        actions.remove(root(), 'missing' as ColumnIds<typeof columns>),
      ).toThrow('[data-views] Unknown column "missing"')
    })
  })
})
