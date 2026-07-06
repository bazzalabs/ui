import { describe, expect, it } from 'vitest'
import {
  countConditions,
  createEmptyFilters,
  type FilterCondition,
  type FilterGroup,
  type FilterNode,
  type FiltersState,
  filterTreeOperations,
  findConditionsForColumn,
  findNode,
  isCondition,
  isGroup,
  normalizeFilters,
} from '../core/filter-tree.js'

function condition(
  id: string,
  columnId = id,
  values: unknown[] = [id],
): FilterCondition {
  return {
    kind: 'condition',
    id,
    columnId,
    type: 'option',
    operator: 'is',
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

function root(children: FilterNode[] = [], op: FilterGroup['op'] = 'and') {
  return group('root', children, op)
}

describe('core/filter-tree', () => {
  describe('empty state and guards', () => {
    it('creates an empty root group with a stable-looking id', () => {
      const filters = createEmptyFilters()

      expect(filters.kind).toBe('group')
      expect(filters.op).toBe('and')
      expect(filters.children).toEqual([])
      expect(filters.id).toMatch(/^filter_/)
    })

    it('creates unique ids for independent empty states', () => {
      const a = createEmptyFilters()
      const b = createEmptyFilters()

      expect(a.id).not.toBe(b.id)
    })

    it('narrows conditions and groups', () => {
      const c = condition('c1')
      const g = group('g1')

      expect(isCondition(c)).toBe(true)
      expect(isGroup(c)).toBe(false)
      expect(isGroup(g)).toBe(true)
      expect(isCondition(g)).toBe(false)
    })
  })

  describe('filterTreeOperations.addNode/removeNode', () => {
    it('appends a node to the requested group', () => {
      const state = root()
      const next = filterTreeOperations.addNode(state, 'root', condition('c1'))

      expect(next.id).toBe('root')
      expect(next.children).toEqual([condition('c1')])
      expect(state.children).toEqual([])
    })

    it('appends to nested groups without changing sibling ids', () => {
      const sibling = condition('sibling')
      const state = root([group('g1'), sibling])
      const next = filterTreeOperations.addNode(state, 'g1', condition('c1'))

      expect(findNode(next, 'c1')).toEqual(condition('c1'))
      expect(findNode(next, 'sibling')).toBe(sibling)
    })

    it('throws when the parent group is missing or a condition', () => {
      const state = root([condition('c1')])

      expect(() =>
        filterTreeOperations.addNode(state, 'missing', condition('c2')),
      ).toThrow('[data-views] Group "missing" not found')
      expect(() =>
        filterTreeOperations.addNode(state, 'c1', condition('c2')),
      ).toThrow('[data-views] Group "c1" not found')
    })

    it('removes a nested node and normalizes the resulting empty group', () => {
      const state = root([group('g1', [condition('c1')]), condition('c2')])
      const next = filterTreeOperations.removeNode(state, 'c1')

      expect(findNode(next, 'c1')).toBeUndefined()
      expect(findNode(next, 'g1')).toBeUndefined()
      expect(next.children).toEqual([condition('c2')])
    })

    it('does not remove the root group', () => {
      const state = root([condition('c1')])
      const next = filterTreeOperations.removeNode(state, 'root')

      expect(next.id).toBe('root')
      expect(next.children).toEqual([condition('c1')])
    })
  })

  describe('filterTreeOperations.updateCondition', () => {
    it('updates a condition operator and values', () => {
      const state = root([condition('c1')])
      const next = filterTreeOperations.updateCondition(state, 'c1', {
        operator: 'is_any_of',
        values: ['a', 'b'],
      })
      const updated = findNode(next, 'c1')

      expect(updated).toMatchObject({
        kind: 'condition',
        operator: 'is_any_of',
        values: ['a', 'b'],
      })
    })

    it('removes a condition when updated values are empty', () => {
      const state = root([condition('c1')])
      const next = filterTreeOperations.updateCondition(state, 'c1', {
        values: [],
      })

      expect(next.children).toEqual([])
    })
  })

  describe('filterTreeOperations.setGroupOperator', () => {
    it('updates the root operator', () => {
      const state = root([condition('c1')])
      const next = filterTreeOperations.setGroupOperator(state, 'root', 'or')

      expect(next.op).toBe('or')
    })

    it('updates a nested group operator', () => {
      const state = root([group('g1', [condition('c1')]), condition('c2')])
      const next = filterTreeOperations.setGroupOperator(state, 'g1', 'or')

      const nested = findNode(next, 'g1')

      expect(nested).toMatchObject({ kind: 'group', op: 'or' })
    })
  })

  describe('filterTreeOperations.groupNodes', () => {
    it('groups sibling nodes at the first selected position in parent order', () => {
      const state = root([condition('a'), condition('b'), condition('c')])
      const next = filterTreeOperations.groupNodes(state, ['c', 'a'], 'or')
      const grouped = next.children[0]

      expect(grouped).toMatchObject({ kind: 'group', op: 'or' })
      expect(isGroup(grouped!)).toBe(true)
      if (isGroup(grouped!)) {
        expect(grouped.children.map((child) => child.id)).toEqual(['a', 'c'])
      }
      expect(next.children[1]).toEqual(condition('b'))
    })

    it('throws when selected nodes have different parents', () => {
      const state = root([group('g1', [condition('a')]), condition('b')])

      expect(() =>
        filterTreeOperations.groupNodes(state, ['a', 'b'], 'and'),
      ).toThrow('groupNodes() requires nodes to share the same parent group')
    })
  })

  describe('filterTreeOperations.ungroupNode', () => {
    it('splices group children into the parent', () => {
      const state = root([
        condition('before'),
        group('g1', [condition('a'), condition('b')], 'or'),
        condition('after'),
      ])
      const next = filterTreeOperations.ungroupNode(state, 'g1')

      expect(next.children.map((child) => child.id)).toEqual([
        'before',
        'a',
        'b',
        'after',
      ])
    })

    it('throws when ungrouping the root', () => {
      expect(() => filterTreeOperations.ungroupNode(root(), 'root')).toThrow(
        'Cannot ungroup the root group',
      )
    })
  })

  describe('normalizeFilters', () => {
    it('removes empty non-root groups', () => {
      const state = root([group('empty'), condition('c1')])
      const next = normalizeFilters(state)

      expect(next.children).toEqual([condition('c1')])
    })

    it('collapses groups with exactly one group child', () => {
      const state = root([
        group('outer', [group('inner', [condition('c1')], 'or')]),
        condition('c2'),
      ])
      const next = normalizeFilters(state)

      expect(next.children.map((child) => child.id)).toEqual(['inner', 'c2'])
      expect(findNode(next, 'outer')).toBeUndefined()
    })

    it('keeps a group with exactly one condition child', () => {
      const state = root([group('g1', [condition('c1')]), condition('c2')])
      const next = normalizeFilters(state)

      expect(findNode(next, 'g1')).toEqual(group('g1', [condition('c1')]))
    })

    it('removes conditions with empty values', () => {
      const state = root([condition('empty', 'empty', []), condition('c1')])
      const next = normalizeFilters(state)

      expect(next.children).toEqual([condition('c1')])
    })

    it('preserves the root id when collapsing a single child group', () => {
      const state: FiltersState = root([
        group('child', [condition('c1')], 'or'),
      ])
      const next = normalizeFilters(state)

      expect(next.id).toBe('root')
      expect(next.op).toBe('or')
      expect(next.children).toEqual([condition('c1')])
    })

    it('preserves the root when all children are removed', () => {
      const state = root(
        [group('empty'), condition('empty', 'empty', [])],
        'or',
      )
      const next = normalizeFilters(state)

      expect(next).toEqual(root([], 'or'))
    })
  })

  describe('depth-first helpers', () => {
    it('finds nodes and conditions in a three-level tree', () => {
      const statusRoot = condition('status-root', 'status')
      const statusNested = condition('status-nested', 'status')
      const state = root([
        statusRoot,
        group('g1', [
          condition('name', 'name'),
          group('g2', [statusNested, condition('age', 'age')], 'or'),
        ]),
      ])

      expect(findNode(state, 'g2')).toMatchObject({ kind: 'group', id: 'g2' })
      expect(findNode(state, 'status-nested')).toBe(statusNested)
      expect(findConditionsForColumn(state, 'status')).toEqual([
        statusRoot,
        statusNested,
      ])
      expect(countConditions(state)).toBe(4)
    })
  })

  describe('id stability', () => {
    it('does not regenerate ids of untouched nodes across operations', () => {
      const nested = group('nested', [condition('nested-condition')])
      const state = root([nested, condition('root-condition')])
      const next = filterTreeOperations.updateCondition(
        state,
        'root-condition',
        {
          values: ['updated'],
        },
      )

      expect(findNode(next, 'nested')).toBe(nested)
      expect(findNode(next, 'nested-condition')?.id).toBe('nested-condition')
      expect(findNode(next, 'root-condition')?.id).toBe('root-condition')
    })
  })
})
