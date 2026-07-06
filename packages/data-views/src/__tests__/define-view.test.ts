import { describe, expect, it } from 'vitest'
import { defineView } from '../core/define-view.js'
import {
  countConditions,
  type FilterCondition,
  isCondition,
} from '../core/filter-tree.js'
import { condition, group } from '../core/typed.js'
import type { CustomSort } from '../core/types.js'

const columns = [
  { id: 'status', type: 'option' },
  { id: 'estimate', type: 'number' },
  { id: 'createdAt', type: 'date' },
] as const

const defineTestView = defineView(columns)

function rootConditions(
  viewFilters: ReturnType<typeof defineTestView>['filters'],
) {
  return viewFilters.children.filter(isCondition)
}

describe('core/define-view', () => {
  it('turns array-form filters into root-level AND conditions stamped from column types', () => {
    const createdAt = new Date(2025, 0, 1)
    const view = defineTestView({
      filters: [
        { columnId: 'status', operator: 'is', values: ['active'] },
        { columnId: 'estimate', operator: 'is_between', values: [1, 3] },
        { columnId: 'createdAt', operator: 'is_before', values: [createdAt] },
      ],
    })

    expect(view.filters).toMatchObject({ kind: 'group', op: 'and' })
    expect(view.filters.id).toMatch(/^filter_/)
    expect(rootConditions(view.filters)).toHaveLength(3)
    expect(rootConditions(view.filters)).toEqual([
      expect.objectContaining({
        kind: 'condition',
        columnId: 'status',
        type: 'option',
        operator: 'is',
        values: ['active'],
      }),
      expect.objectContaining({
        kind: 'condition',
        columnId: 'estimate',
        type: 'number',
        operator: 'is_between',
        values: [1, 3],
      }),
      expect.objectContaining({
        kind: 'condition',
        columnId: 'createdAt',
        type: 'date',
        operator: 'is_before',
        values: [createdAt],
      }),
    ])
    for (const filter of rootConditions(view.filters)) {
      expect(filter.id).toMatch(/^filter_/)
    }
  })

  it('normalizes group-form filters', () => {
    const status = condition(columns, 'status', 'is', ['active'])
    const emptyEstimate = condition(columns, 'estimate', 'is', [])
    const nested = group('or', [status])
    const wrapper = group('and', [nested, emptyEstimate])

    const view = defineTestView({ filters: wrapper })

    expect(view.filters).toMatchObject({
      kind: 'group',
      id: wrapper.id,
      op: 'or',
    })
    expect(countConditions(view.filters)).toBe(1)
    expect(rootConditions(view.filters)).toEqual([status])
    expect(
      rootConditions(view.filters).find(
        (filter: FilterCondition) => filter.columnId === 'estimate',
      ),
    ).toBeUndefined()
  })

  it('maps columnId sort shorthand to ColumnSort and passes CustomSort through', () => {
    const customSort: CustomSort = {
      type: 'custom',
      id: 'priority-first',
      enabled: true,
    }
    const view = defineTestView({
      sort: [{ columnId: 'estimate', direction: 'desc' }, customSort],
    })

    expect(view.sort).toEqual([
      { type: 'column', columnId: 'estimate', direction: 'desc' },
      customSort,
    ])
    expect(view.sort[1]).toBe(customSort)
  })

  it('passes through identity, search, and meta fields', () => {
    const meta = { owner: 'qa', pinned: true }
    const view = defineTestView({
      id: 'triage',
      name: 'Triage',
      search: '',
      meta,
    })

    expect(view.id).toBe('triage')
    expect(view.name).toBe('Triage')
    expect(view.search).toBe('')
    expect(view.meta).toBe(meta)
    expect(view.filters).toMatchObject({
      kind: 'group',
      op: 'and',
      children: [],
    })
    expect(view.sort).toEqual([])
  })
})
