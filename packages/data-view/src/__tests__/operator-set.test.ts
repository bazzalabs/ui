import { describe, expect, it } from 'vitest'
import { defineOperators, OperatorSet } from '../core/operator-set.js'

type TestOps = 'is' | 'is not' | 'is any of' | 'is none of'

// Helper: create a simple operator set for testing
function createTestSet() {
  return defineOperators<TestOps>(
    {
      is: {
        label: 'is',
        target: 'single',
        i18nKey: 'test.is',
        singular: 'is any of',
        match: (cell, vals) => vals.includes(cell),
      },
      'is not': {
        label: 'is not',
        target: 'single',
        i18nKey: 'test.isNot',
        singular: 'is none of',
        match: (cell, vals) => !vals.includes(cell),
      },
      'is any of': {
        label: 'is any of',
        target: 'multiple',
        i18nKey: 'test.isAnyOf',
        plural: 'is',
        match: (cell, vals) => vals.includes(cell),
      },
      'is none of': {
        label: 'is none of',
        target: 'multiple',
        i18nKey: 'test.isNoneOf',
        plural: 'is not',
        match: (cell, vals) => !vals.includes(cell),
      },
    },
    { defaultSingle: 'is', defaultMultiple: 'is any of' },
  )
}

describe('core/operator-set', () => {
  describe('defineOperators', () => {
    it('should create an OperatorSet from a record', () => {
      const set = createTestSet()
      expect(set).toBeInstanceOf(OperatorSet)
      expect(set.size).toBe(4)
    })

    it('should inject id from record keys', () => {
      const set = createTestSet()
      const op = set.get('is')
      expect(op.id).toBe('is')
      expect(op.label).toBe('is')
    })

    it('should preserve insertion order', () => {
      const set = createTestSet()
      expect(set.ids()).toEqual(['is', 'is not', 'is any of', 'is none of'])
    })
  })

  describe('query methods', () => {
    const set = createTestSet()

    describe('.get()', () => {
      it('should return the operator by id', () => {
        const op = set.get('is')
        expect(op.id).toBe('is')
        expect(op.label).toBe('is')
        expect(op.target).toBe('single')
      })

      it('should throw for unknown id', () => {
        expect(() => set.get('unknown' as any)).toThrow(
          '[OperatorSet] Operator "unknown" not found',
        )
      })
    })

    describe('.all()', () => {
      it('should return all operators in order', () => {
        const all = set.all()
        expect(all).toHaveLength(4)
        expect(all.map((o) => o.id)).toEqual([
          'is',
          'is not',
          'is any of',
          'is none of',
        ])
      })
    })

    describe('.ids()', () => {
      it('should return all ids in order', () => {
        expect(set.ids()).toEqual(['is', 'is not', 'is any of', 'is none of'])
      })
    })

    describe('.has()', () => {
      it('should return true for existing operators', () => {
        expect(set.has('is')).toBe(true)
        expect(set.has('is any of')).toBe(true)
      })

      it('should return false for non-existing operators', () => {
        expect(set.has('unknown')).toBe(false)
      })
    })

    describe('.size', () => {
      it('should return the number of operators', () => {
        expect(set.size).toBe(4)
      })
    })

    describe('.getDefault()', () => {
      it('should return explicit default for single', () => {
        const op = set.getDefault('single')
        expect(op.id).toBe('is')
      })

      it('should return explicit default for multiple', () => {
        const op = set.getDefault('multiple')
        expect(op.id).toBe('is any of')
      })

      it('should fall back to first matching target if no explicit default', () => {
        const noDefault = defineOperators({
          contains: { label: 'contains', target: 'single' },
          between: { label: 'between', target: 'multiple' },
        })
        expect(noDefault.getDefault('single').id).toBe('contains')
        expect(noDefault.getDefault('multiple').id).toBe('between')
      })

      it('should fall back to first operator if no matching target', () => {
        const singleOnly = defineOperators({
          contains: { label: 'contains', target: 'single' },
        })
        // Asking for multiple default, but only single exists — should return first
        expect(singleOnly.getDefault('multiple').id).toBe('contains')
      })

      it('should throw on empty OperatorSet', () => {
        const empty = new OperatorSet(new Map())
        expect(() => empty.getDefault('single')).toThrow(
          'Cannot get default from empty OperatorSet',
        )
      })
    })
  })

  describe('composition methods', () => {
    describe('.only()', () => {
      it('should restrict to specified operators', () => {
        const set = createTestSet()
        const restricted = set.only('is', 'is not')
        expect(restricted.size).toBe(2)
        expect(restricted.ids()).toEqual(['is', 'is not'])
      })

      it('should preserve order from the original set', () => {
        const set = createTestSet()
        const restricted = set.only('is none of', 'is')
        // Order should follow the order in .only() args, not original insertion
        expect(restricted.ids()).toEqual(['is none of', 'is'])
      })

      it('should return a new instance', () => {
        const set = createTestSet()
        const restricted = set.only('is')
        expect(restricted).not.toBe(set)
        // Original unchanged
        expect(set.size).toBe(4)
      })

      it('should throw for unknown id', () => {
        const set = createTestSet()
        expect(() => set.only('unknown' as any)).toThrow(
          '[OperatorSet.only] Operator "unknown" not found',
        )
      })
    })

    describe('.without()', () => {
      it('should remove specified operators', () => {
        const set = createTestSet()
        const reduced = set.without('is not', 'is none of')
        expect(reduced.size).toBe(2)
        expect(reduced.ids()).toEqual(['is', 'is any of'])
      })

      it('should return a new instance', () => {
        const set = createTestSet()
        const reduced = set.without('is')
        expect(reduced).not.toBe(set)
        expect(set.size).toBe(4)
      })

      it('should silently ignore ids not in the set', () => {
        const set = createTestSet()
        const reduced = set.without('unknown' as any)
        expect(reduced.size).toBe(4)
      })
    })

    describe('.extend()', () => {
      it('should add new operators', () => {
        const set = createTestSet()
        const extended = set.extend({
          startsWith: {
            label: 'starts with',
            target: 'single',
          },
        })
        expect(extended.size).toBe(5)
        expect(extended.has('startsWith')).toBe(true)
        expect(extended.get('startsWith').label).toBe('starts with')
      })

      it('should preserve existing operators', () => {
        const set = createTestSet()
        const extended = set.extend({
          custom: { label: 'custom', target: 'single' },
        })
        expect(extended.get('is').label).toBe('is')
      })

      it('should return a new instance', () => {
        const set = createTestSet()
        const extended = set.extend({
          custom: { label: 'custom', target: 'single' },
        })
        expect(extended).not.toBe(set)
        expect(set.size).toBe(4)
      })
    })

    describe('.replace()', () => {
      it('should override properties of an existing operator', () => {
        const set = createTestSet()
        const replaced = set.replace('is', { label: 'equals' })
        expect(replaced.get('is').label).toBe('equals')
        // Other properties preserved
        expect(replaced.get('is').target).toBe('single')
        expect(replaced.get('is').id).toBe('is')
      })

      it('should return a new instance', () => {
        const set = createTestSet()
        const replaced = set.replace('is', { label: 'equals' })
        expect(replaced).not.toBe(set)
        // Original unchanged
        expect(set.get('is').label).toBe('is')
      })

      it('should throw for unknown id', () => {
        const set = createTestSet()
        expect(() => set.replace('unknown' as any, { label: 'x' })).toThrow(
          '[OperatorSet.replace] Operator "unknown" not found',
        )
      })
    })

    describe('.defaults()', () => {
      it('should update default single', () => {
        const set = createTestSet()
        const updated = set.defaults({ single: 'is not' })
        expect(updated.getDefault('single').id).toBe('is not')
        // Multiple unchanged
        expect(updated.getDefault('multiple').id).toBe('is any of')
      })

      it('should update default multiple', () => {
        const set = createTestSet()
        const updated = set.defaults({ multiple: 'is none of' })
        expect(updated.getDefault('multiple').id).toBe('is none of')
      })

      it('should update both defaults', () => {
        const set = createTestSet()
        const updated = set.defaults({
          single: 'is not',
          multiple: 'is none of',
        })
        expect(updated.getDefault('single').id).toBe('is not')
        expect(updated.getDefault('multiple').id).toBe('is none of')
      })

      it('should return a new instance', () => {
        const set = createTestSet()
        const updated = set.defaults({ single: 'is not' })
        expect(updated).not.toBe(set)
        expect(set.getDefault('single').id).toBe('is')
      })
    })

    describe('chaining', () => {
      it('should support .without().extend().defaults() chain', () => {
        const set = createTestSet()
        const result = set
          .without('is none of')
          .extend({
            'matches regex': {
              label: 'matches regex',
              target: 'single',
            },
          })
          .defaults({ single: 'matches regex' })

        expect(result.size).toBe(4) // removed 1, added 1
        expect(result.has('is none of')).toBe(false)
        expect(result.has('matches regex')).toBe(true)
        expect(result.getDefault('single').id).toBe('matches regex')
      })
    })
  })
})
