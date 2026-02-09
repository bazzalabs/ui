import { describe, expect, it } from 'vitest'
import {
  bigIntOperators,
  booleanOperators,
  dateOperators,
  defaultOperatorSets,
  multiOptionOperators,
  numberOperators,
  optionOperators,
  textOperators,
} from '../core/operator-sets.js'

// ── Helpers ─────────────────────────────────────────────────

function match(set: any, opId: string, cell: any, vals: any[]) {
  const op = set.get(opId)
  expect(op.match).toBeDefined()
  return op.match!(cell, vals)
}

// ── Text Operators ──────────────────────────────────────────

describe('core/operator-sets', () => {
  describe('textOperators', () => {
    it('should have 2 operators', () => {
      expect(textOperators.size).toBe(2)
      expect(textOperators.ids()).toEqual(['contains', 'does_not_contain'])
    })

    it('should have i18nKey on all operators', () => {
      for (const op of textOperators.all()) {
        expect(op.i18nKey).toBeDefined()
      }
    })

    describe('contains', () => {
      it('should match when value contains query', () => {
        expect(match(textOperators, 'contains', 'Hello World', ['world'])).toBe(
          true,
        )
      })

      it('should be case-insensitive', () => {
        expect(match(textOperators, 'contains', 'Hello', ['HELLO'])).toBe(true)
      })

      it('should not match when value does not contain query', () => {
        expect(match(textOperators, 'contains', 'Hello', ['xyz'])).toBe(false)
      })

      it('should pass with empty filter values', () => {
        expect(match(textOperators, 'contains', 'Hello', [])).toBe(true)
      })

      it('should pass with empty string query', () => {
        expect(match(textOperators, 'contains', 'Hello', [''])).toBe(true)
      })
    })

    describe('does_not_contain', () => {
      it('should match when value does not contain query', () => {
        expect(match(textOperators, 'does_not_contain', 'Hello', ['xyz'])).toBe(
          true,
        )
      })

      it('should not match when value contains query', () => {
        expect(
          match(textOperators, 'does_not_contain', 'Hello World', ['world']),
        ).toBe(false)
      })

      it('should pass with empty filter values', () => {
        expect(match(textOperators, 'does_not_contain', 'Hello', [])).toBe(true)
      })
    })
  })

  // ── Option Operators ────────────────────────────────────────

  describe('optionOperators', () => {
    it('should have 4 operators', () => {
      expect(optionOperators.size).toBe(4)
    })

    it('should have correct singular/plural relationships', () => {
      expect(optionOperators.get('is').singular).toBe('is_any_of')
      expect(optionOperators.get('is_not').singular).toBe('is_none_of')
      expect(optionOperators.get('is_any_of').plural).toBe('is')
      expect(optionOperators.get('is_none_of').plural).toBe('is_not')
    })

    it('should have correct defaults', () => {
      expect(optionOperators.getDefault('single').id).toBe('is')
      expect(optionOperators.getDefault('multiple').id).toBe('is_any_of')
    })

    describe('is', () => {
      it('should match when cell equals filter value', () => {
        expect(match(optionOperators, 'is', 'active', ['active'])).toBe(true)
      })

      it('should be case-insensitive', () => {
        expect(match(optionOperators, 'is', 'Active', ['active'])).toBe(true)
      })

      it('should not match when cell differs', () => {
        expect(match(optionOperators, 'is', 'active', ['inactive'])).toBe(false)
      })

      it('should pass with empty filter values', () => {
        expect(match(optionOperators, 'is', 'active', [])).toBe(true)
      })

      it('should not match null cell', () => {
        expect(match(optionOperators, 'is', null, ['active'])).toBe(false)
      })
    })

    describe('is_not', () => {
      it('should match when cell differs', () => {
        expect(match(optionOperators, 'is_not', 'active', ['inactive'])).toBe(
          true,
        )
      })

      it('should not match when cell equals', () => {
        expect(match(optionOperators, 'is_not', 'active', ['active'])).toBe(
          false,
        )
      })
    })

    describe('is_any_of', () => {
      it('should match when cell is in filter values', () => {
        expect(match(optionOperators, 'is_any_of', 'a', ['a', 'b', 'c'])).toBe(
          true,
        )
      })

      it('should not match when cell is not in filter values', () => {
        expect(match(optionOperators, 'is_any_of', 'z', ['a', 'b'])).toBe(false)
      })
    })

    describe('is_none_of', () => {
      it('should match when cell is not in filter values', () => {
        expect(match(optionOperators, 'is_none_of', 'z', ['a', 'b'])).toBe(true)
      })

      it('should not match when cell is in filter values', () => {
        expect(match(optionOperators, 'is_none_of', 'a', ['a', 'b'])).toBe(
          false,
        )
      })
    })
  })

  // ── Multi-Option Operators ──────────────────────────────────

  describe('multiOptionOperators', () => {
    it('should have 6 operators', () => {
      expect(multiOptionOperators.size).toBe(6)
    })

    it('should have correct defaults', () => {
      expect(multiOptionOperators.getDefault('single').id).toBe('include')
      expect(multiOptionOperators.getDefault('multiple').id).toBe(
        'include_any_of',
      )
    })

    describe('include', () => {
      it('should match when cell array intersects filter', () => {
        expect(match(multiOptionOperators, 'include', ['a', 'b'], ['a'])).toBe(
          true,
        )
      })

      it('should not match when no intersection', () => {
        expect(match(multiOptionOperators, 'include', ['a', 'b'], ['c'])).toBe(
          false,
        )
      })

      it('should pass with empty filter', () => {
        expect(match(multiOptionOperators, 'include', ['a'], [])).toBe(true)
        expect(match(multiOptionOperators, 'include', ['a'], [''])).toBe(true)
      })

      it('should not match non-array cell', () => {
        expect(match(multiOptionOperators, 'include', 'not-array', ['a'])).toBe(
          false,
        )
      })
    })

    describe('exclude', () => {
      it('should match when no intersection', () => {
        expect(match(multiOptionOperators, 'exclude', ['a', 'b'], ['c'])).toBe(
          true,
        )
      })

      it('should not match when intersection exists', () => {
        expect(match(multiOptionOperators, 'exclude', ['a', 'b'], ['a'])).toBe(
          false,
        )
      })
    })

    describe('include_any_of', () => {
      it('should match when any filter value is in cell', () => {
        expect(
          match(multiOptionOperators, 'include_any_of', ['a', 'b'], ['b', 'c']),
        ).toBe(true)
      })

      it('should not match when none overlap', () => {
        expect(
          match(multiOptionOperators, 'include_any_of', ['a'], ['b', 'c']),
        ).toBe(false)
      })
    })

    describe('include_all_of', () => {
      it('should match when all filter values are in cell', () => {
        expect(
          match(
            multiOptionOperators,
            'include_all_of',
            ['a', 'b', 'c'],
            ['a', 'b'],
          ),
        ).toBe(true)
      })

      it('should not match when not all filter values are in cell', () => {
        expect(
          match(multiOptionOperators, 'include_all_of', ['a'], ['a', 'b']),
        ).toBe(false)
      })
    })

    describe('exclude_if_any_of', () => {
      it('should match when no overlap', () => {
        expect(
          match(multiOptionOperators, 'exclude_if_any_of', ['a'], ['b', 'c']),
        ).toBe(true)
      })

      it('should not match when any overlap', () => {
        expect(
          match(multiOptionOperators, 'exclude_if_any_of', ['a', 'b'], ['b']),
        ).toBe(false)
      })
    })

    describe('exclude_if_all', () => {
      it('should match when not all filter values in cell', () => {
        expect(
          match(multiOptionOperators, 'exclude_if_all', ['a'], ['a', 'b']),
        ).toBe(true)
      })

      it('should not match when all filter values in cell', () => {
        expect(
          match(
            multiOptionOperators,
            'exclude_if_all',
            ['a', 'b', 'c'],
            ['a', 'b'],
          ),
        ).toBe(false)
      })
    })
  })

  // ── Number Operators ────────────────────────────────────────

  describe('numberOperators', () => {
    it('should have 8 operators', () => {
      expect(numberOperators.size).toBe(8)
    })

    it('should have correct defaults', () => {
      expect(numberOperators.getDefault('single').id).toBe('is')
      expect(numberOperators.getDefault('multiple').id).toBe('is_between')
    })

    describe('is', () => {
      it('should match equal numbers', () => {
        expect(match(numberOperators, 'is', 42, [42])).toBe(true)
      })

      it('should not match unequal numbers', () => {
        expect(match(numberOperators, 'is', 42, [43])).toBe(false)
      })

      it('should pass with undefined filter value', () => {
        expect(match(numberOperators, 'is', 42, [undefined])).toBe(true)
      })

      it('should not match undefined cell', () => {
        expect(match(numberOperators, 'is', undefined, [42])).toBe(false)
      })
    })

    describe('is_not', () => {
      it('should match unequal numbers', () => {
        expect(match(numberOperators, 'is_not', 42, [43])).toBe(true)
      })

      it('should not match equal numbers', () => {
        expect(match(numberOperators, 'is_not', 42, [42])).toBe(false)
      })
    })

    describe('is_greater_than', () => {
      it('should match when cell > filter', () => {
        expect(match(numberOperators, 'is_greater_than', 10, [5])).toBe(true)
      })

      it('should not match when cell <= filter', () => {
        expect(match(numberOperators, 'is_greater_than', 5, [5])).toBe(false)
        expect(match(numberOperators, 'is_greater_than', 3, [5])).toBe(false)
      })

      it('should handle Infinity', () => {
        expect(
          match(
            numberOperators,
            'is_greater_than',
            Number.POSITIVE_INFINITY,
            [100],
          ),
        ).toBe(true)
        expect(
          match(numberOperators, 'is_greater_than', 100, [
            Number.POSITIVE_INFINITY,
          ]),
        ).toBe(false)
      })
    })

    describe('is_gte', () => {
      it('should match when cell >= filter', () => {
        expect(match(numberOperators, 'is_gte', 5, [5])).toBe(true)
        expect(match(numberOperators, 'is_gte', 10, [5])).toBe(true)
      })

      it('should not match when cell < filter', () => {
        expect(match(numberOperators, 'is_gte', 3, [5])).toBe(false)
      })
    })

    describe('is_less_than', () => {
      it('should match when cell < filter', () => {
        expect(match(numberOperators, 'is_less_than', 3, [5])).toBe(true)
      })

      it('should not match when cell >= filter', () => {
        expect(match(numberOperators, 'is_less_than', 5, [5])).toBe(false)
      })

      it('should handle -Infinity', () => {
        expect(
          match(
            numberOperators,
            'is_less_than',
            Number.NEGATIVE_INFINITY,
            [100],
          ),
        ).toBe(true)
        expect(
          match(numberOperators, 'is_less_than', 100, [
            Number.NEGATIVE_INFINITY,
          ]),
        ).toBe(false)
      })
    })

    describe('is_lte', () => {
      it('should match when cell <= filter', () => {
        expect(match(numberOperators, 'is_lte', 5, [5])).toBe(true)
        expect(match(numberOperators, 'is_lte', 3, [5])).toBe(true)
      })

      it('should not match when cell > filter', () => {
        expect(match(numberOperators, 'is_lte', 10, [5])).toBe(false)
      })
    })

    describe('is_between', () => {
      it('should match when cell is in range (inclusive)', () => {
        expect(match(numberOperators, 'is_between', 5, [1, 10])).toBe(true)
        expect(match(numberOperators, 'is_between', 1, [1, 10])).toBe(true)
        expect(match(numberOperators, 'is_between', 10, [1, 10])).toBe(true)
      })

      it('should not match when cell is outside range', () => {
        expect(match(numberOperators, 'is_between', 0, [1, 10])).toBe(false)
        expect(match(numberOperators, 'is_between', 11, [1, 10])).toBe(false)
      })

      it('should handle reversed range', () => {
        expect(match(numberOperators, 'is_between', 5, [10, 1])).toBe(true)
      })

      it('should pass with incomplete filter values', () => {
        expect(match(numberOperators, 'is_between', 5, [1])).toBe(true)
        expect(match(numberOperators, 'is_between', 5, [1, undefined])).toBe(
          true,
        )
      })
    })

    describe('is_not_between', () => {
      it('should match when cell is outside range', () => {
        expect(match(numberOperators, 'is_not_between', 0, [1, 10])).toBe(true)
        expect(match(numberOperators, 'is_not_between', 11, [1, 10])).toBe(true)
      })

      it('should not match when cell is in range', () => {
        expect(match(numberOperators, 'is_not_between', 5, [1, 10])).toBe(false)
      })
    })

    it('should have correct singular/plural relationships', () => {
      expect(numberOperators.get('is').singular).toBe('is_between')
      expect(numberOperators.get('is_not').singular).toBe('is_not_between')
      expect(numberOperators.get('is_between').plural).toBe('is')
      expect(numberOperators.get('is_not_between').plural).toBe('is_not')
    })
  })

  // ── BigInt Operators ────────────────────────────────────────

  describe('bigIntOperators', () => {
    it('should have 8 operators', () => {
      expect(bigIntOperators.size).toBe(8)
    })

    describe('is', () => {
      it('should match equal bigints', () => {
        expect(match(bigIntOperators, 'is', 42n, [42n])).toBe(true)
      })

      it('should not match unequal bigints', () => {
        expect(match(bigIntOperators, 'is', 42n, [43n])).toBe(false)
      })

      it('should coerce strings to bigint', () => {
        expect(match(bigIntOperators, 'is', 42n, ['42'])).toBe(true)
      })
    })

    describe('is_greater_than', () => {
      it('should match when cell > filter', () => {
        expect(match(bigIntOperators, 'is_greater_than', 10n, [5n])).toBe(true)
      })

      it('should not match when cell <= filter', () => {
        expect(match(bigIntOperators, 'is_greater_than', 5n, [5n])).toBe(false)
      })
    })

    describe('is_between', () => {
      it('should match when cell is in range', () => {
        expect(match(bigIntOperators, 'is_between', 5n, [1n, 10n])).toBe(true)
      })

      it('should not match when cell is outside range', () => {
        expect(match(bigIntOperators, 'is_between', 0n, [1n, 10n])).toBe(false)
      })

      it('should handle reversed range', () => {
        expect(match(bigIntOperators, 'is_between', 5n, [10n, 1n])).toBe(true)
      })
    })
  })

  // ── Date Operators ──────────────────────────────────────────

  describe('dateOperators', () => {
    it('should have 8 operators', () => {
      expect(dateOperators.size).toBe(8)
    })

    it('should have correct defaults', () => {
      expect(dateOperators.getDefault('single').id).toBe('is')
      expect(dateOperators.getDefault('multiple').id).toBe('is_between')
    })

    const jan1 = new Date(2025, 0, 1, 12, 0, 0)
    const jan2 = new Date(2025, 0, 2, 12, 0, 0)
    const jan3 = new Date(2025, 0, 3, 12, 0, 0)
    const jan1Morning = new Date(2025, 0, 1, 8, 0, 0)

    describe('is', () => {
      it('should match same day', () => {
        expect(match(dateOperators, 'is', jan1, [jan1Morning])).toBe(true)
      })

      it('should not match different day', () => {
        expect(match(dateOperators, 'is', jan1, [jan2])).toBe(false)
      })

      it('should pass with non-Date filter', () => {
        expect(match(dateOperators, 'is', jan1, ['not-a-date'])).toBe(true)
      })

      it('should not match non-Date cell', () => {
        expect(match(dateOperators, 'is', 'not-a-date', [jan1])).toBe(false)
      })
    })

    describe('is_not', () => {
      it('should match different day', () => {
        expect(match(dateOperators, 'is_not', jan1, [jan2])).toBe(true)
      })

      it('should not match same day', () => {
        expect(match(dateOperators, 'is_not', jan1, [jan1Morning])).toBe(false)
      })
    })

    describe('is_before', () => {
      it('should match when cell is before filter date', () => {
        expect(match(dateOperators, 'is_before', jan1, [jan2])).toBe(true)
      })

      it('should not match same day', () => {
        expect(match(dateOperators, 'is_before', jan1, [jan1Morning])).toBe(
          false,
        )
      })

      it('should not match when cell is after filter date', () => {
        expect(match(dateOperators, 'is_before', jan2, [jan1])).toBe(false)
      })
    })

    describe('is_after', () => {
      it('should match when cell is after filter date (end of day)', () => {
        expect(match(dateOperators, 'is_after', jan3, [jan1])).toBe(true)
      })

      it('should not match same day', () => {
        expect(match(dateOperators, 'is_after', jan1, [jan1Morning])).toBe(
          false,
        )
      })
    })

    describe('is_on_or_after', () => {
      it('should match same day', () => {
        expect(
          match(dateOperators, 'is_on_or_after', jan1, [jan1Morning]),
        ).toBe(true)
      })

      it('should match after', () => {
        expect(match(dateOperators, 'is_on_or_after', jan2, [jan1])).toBe(true)
      })

      it('should not match before', () => {
        expect(match(dateOperators, 'is_on_or_after', jan1, [jan2])).toBe(false)
      })
    })

    describe('is_on_or_before', () => {
      it('should match same day', () => {
        expect(
          match(dateOperators, 'is_on_or_before', jan1, [jan1Morning]),
        ).toBe(true)
      })

      it('should match before', () => {
        expect(match(dateOperators, 'is_on_or_before', jan1, [jan2])).toBe(true)
      })

      it('should not match after', () => {
        expect(match(dateOperators, 'is_on_or_before', jan3, [jan1])).toBe(
          false,
        )
      })
    })

    describe('is_between', () => {
      it('should match when cell is in date range', () => {
        expect(match(dateOperators, 'is_between', jan2, [jan1, jan3])).toBe(
          true,
        )
      })

      it('should match boundary dates', () => {
        expect(match(dateOperators, 'is_between', jan1, [jan1, jan3])).toBe(
          true,
        )
        expect(match(dateOperators, 'is_between', jan3, [jan1, jan3])).toBe(
          true,
        )
      })

      it('should not match outside range', () => {
        const dec31 = new Date(2024, 11, 31)
        expect(match(dateOperators, 'is_between', dec31, [jan1, jan3])).toBe(
          false,
        )
      })

      it('should handle reversed range', () => {
        expect(match(dateOperators, 'is_between', jan2, [jan3, jan1])).toBe(
          true,
        )
      })

      it('should pass with fewer than 2 filter values', () => {
        expect(match(dateOperators, 'is_between', jan1, [jan1])).toBe(true)
        expect(match(dateOperators, 'is_between', jan1, [])).toBe(true)
      })
    })

    describe('is_not_between', () => {
      it('should match when cell is outside range', () => {
        const dec31 = new Date(2024, 11, 31)
        expect(
          match(dateOperators, 'is_not_between', dec31, [jan1, jan3]),
        ).toBe(true)
      })

      it('should not match when cell is in range', () => {
        expect(match(dateOperators, 'is_not_between', jan2, [jan1, jan3])).toBe(
          false,
        )
      })
    })
  })

  // ── Boolean Operators ───────────────────────────────────────

  describe('booleanOperators', () => {
    it('should have 2 operators', () => {
      expect(booleanOperators.size).toBe(2)
    })

    describe('is', () => {
      it('should match true === true', () => {
        expect(match(booleanOperators, 'is', true, [true])).toBe(true)
      })

      it('should match false === false', () => {
        expect(match(booleanOperators, 'is', false, [false])).toBe(true)
      })

      it('should not match true !== false', () => {
        expect(match(booleanOperators, 'is', true, [false])).toBe(false)
      })

      it('should pass with empty filter', () => {
        expect(match(booleanOperators, 'is', true, [])).toBe(true)
      })
    })

    describe('is_not', () => {
      it('should match when different', () => {
        expect(match(booleanOperators, 'is_not', true, [false])).toBe(true)
      })

      it('should not match when same', () => {
        expect(match(booleanOperators, 'is_not', true, [true])).toBe(false)
      })
    })
  })

  // ── Default Operator Sets Map ─────────────────────────────

  describe('defaultOperatorSets', () => {
    it('should have entries for all 7 built-in types', () => {
      expect(defaultOperatorSets.text).toBe(textOperators)
      expect(defaultOperatorSets.number).toBe(numberOperators)
      expect(defaultOperatorSets.bigint).toBe(bigIntOperators)
      expect(defaultOperatorSets.date).toBe(dateOperators)
      expect(defaultOperatorSets.boolean).toBe(booleanOperators)
      expect(defaultOperatorSets.option).toBe(optionOperators)
      expect(defaultOperatorSets.multiOption).toBe(multiOptionOperators)
    })

    it('should have i18nKey on every operator across all sets', () => {
      for (const [type, set] of Object.entries(defaultOperatorSets)) {
        for (const op of set.all()) {
          expect(op.i18nKey, `${type}/${op.id} missing i18nKey`).toBeDefined()
        }
      }
    })

    it('should have target set on every operator', () => {
      for (const [type, set] of Object.entries(defaultOperatorSets)) {
        for (const op of set.all()) {
          expect(
            ['single', 'multiple'].includes(op.target),
            `${type}/${op.id} has invalid target: ${op.target}`,
          ).toBe(true)
        }
      }
    })

    it('should have match functions on every operator', () => {
      for (const [type, set] of Object.entries(defaultOperatorSets)) {
        for (const op of set.all()) {
          expect(
            typeof op.match,
            `${type}/${op.id} missing match function`,
          ).toBe('function')
        }
      }
    })

    it('should have valid singular/plural references', () => {
      for (const [type, set] of Object.entries(defaultOperatorSets)) {
        for (const op of set.all()) {
          if (op.singular) {
            expect(
              set.has(op.singular),
              `${type}/${op.id} singular "${op.singular}" not found in set`,
            ).toBe(true)
          }
          if (op.plural) {
            expect(
              set.has(op.plural),
              `${type}/${op.id} plural "${op.plural}" not found in set`,
            ).toBe(true)
          }
        }
      }
    })
  })
})
