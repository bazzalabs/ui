import { describe, expect, it } from 'vitest'
import type { FieldRef } from '../server/ast.js'
import {
  booleanCompilers,
  builtInCompilers,
  dateCompilers,
  escapeLike,
  multiOptionCompilers,
  numberCompilers,
  optionCompilers,
  textCompilers,
} from '../server/compilers.js'

// ── Helpers ─────────────────────────────────────────────────

function makeDirectField(columnId: string, type: string): FieldRef {
  return {
    columnId,
    type,
    path: { kind: 'direct', column: columnId },
  }
}

function makeHasManyField(
  columnId: string,
  type: string,
  relation: string,
  column: string,
): FieldRef {
  return {
    columnId,
    type,
    path: { kind: 'hasMany', relation, column },
  }
}

// ── escapeLike ──────────────────────────────────────────────

describe('server/compilers', () => {
  describe('escapeLike', () => {
    it('should escape % characters', () => {
      expect(escapeLike('100%')).toBe('100\\%')
    })

    it('should escape _ characters', () => {
      expect(escapeLike('hello_world')).toBe('hello\\_world')
    })

    it('should escape \\ characters', () => {
      expect(escapeLike('path\\to')).toBe('path\\\\to')
    })

    it('should escape all special characters at once', () => {
      expect(escapeLike('%_\\')).toBe('\\%\\_\\\\')
    })

    it('should leave normal text unchanged', () => {
      expect(escapeLike('hello world')).toBe('hello world')
    })
  })

  // ── Text Compilers ────────────────────────────────────────

  describe('textCompilers', () => {
    const field = makeDirectField('name', 'text')

    it('contains should produce an ilike comparison', () => {
      const result = textCompilers.contains!(field, ['hello'])

      expect(result).toEqual({
        kind: 'comparison',
        field,
        op: 'ilike',
        value: '%hello%',
      })
    })

    it('contains should escape special characters in the value', () => {
      const result = textCompilers.contains!(field, ['100%'])

      expect(result).toEqual({
        kind: 'comparison',
        field,
        op: 'ilike',
        value: '%100\\%%',
      })
    })

    it('does_not_contain should produce a NOT(ilike) condition', () => {
      const result = textCompilers.does_not_contain!(field, ['hello'])

      expect(result).toEqual({
        kind: 'not',
        condition: {
          kind: 'comparison',
          field,
          op: 'ilike',
          value: '%hello%',
        },
      })
    })

    it('contains should handle empty values', () => {
      const result = textCompilers.contains!(field, [])

      expect(result).toEqual({
        kind: 'comparison',
        field,
        op: 'ilike',
        value: '%%',
      })
    })
  })

  // ── Option Compilers ──────────────────────────────────────

  describe('optionCompilers', () => {
    const field = makeDirectField('status', 'option')

    it('is should produce an eq comparison', () => {
      expect(optionCompilers.is!(field, ['active'])).toEqual({
        kind: 'comparison',
        field,
        op: 'eq',
        value: 'active',
      })
    })

    it('is_not should produce a neq comparison', () => {
      expect(optionCompilers.is_not!(field, ['active'])).toEqual({
        kind: 'comparison',
        field,
        op: 'neq',
        value: 'active',
      })
    })

    it('is_any_of should produce an in comparison', () => {
      expect(optionCompilers.is_any_of!(field, ['active', 'pending'])).toEqual({
        kind: 'comparison',
        field,
        op: 'in',
        value: ['active', 'pending'],
      })
    })

    it('is_none_of should produce a notIn comparison', () => {
      expect(optionCompilers.is_none_of!(field, ['active', 'pending'])).toEqual(
        {
          kind: 'comparison',
          field,
          op: 'notIn',
          value: ['active', 'pending'],
        },
      )
    })

    it('is should handle null values', () => {
      expect(optionCompilers.is!(field, [])).toEqual({
        kind: 'comparison',
        field,
        op: 'eq',
        value: null,
      })
    })
  })

  // ── Number Compilers ──────────────────────────────────────

  describe('numberCompilers', () => {
    const field = makeDirectField('age', 'number')

    it('is should produce eq', () => {
      expect(numberCompilers.is!(field, [42])).toEqual({
        kind: 'comparison',
        field,
        op: 'eq',
        value: 42,
      })
    })

    it('is_not should produce neq', () => {
      expect(numberCompilers.is_not!(field, [42])).toEqual({
        kind: 'comparison',
        field,
        op: 'neq',
        value: 42,
      })
    })

    it('is_greater_than should produce gt', () => {
      expect(numberCompilers.is_greater_than!(field, [10])).toEqual({
        kind: 'comparison',
        field,
        op: 'gt',
        value: 10,
      })
    })

    it('is_gte should produce gte', () => {
      expect(numberCompilers.is_gte!(field, [10])).toEqual({
        kind: 'comparison',
        field,
        op: 'gte',
        value: 10,
      })
    })

    it('is_less_than should produce lt', () => {
      expect(numberCompilers.is_less_than!(field, [10])).toEqual({
        kind: 'comparison',
        field,
        op: 'lt',
        value: 10,
      })
    })

    it('is_lte should produce lte', () => {
      expect(numberCompilers.is_lte!(field, [10])).toEqual({
        kind: 'comparison',
        field,
        op: 'lte',
        value: 10,
      })
    })

    it('is_between should produce between', () => {
      expect(numberCompilers.is_between!(field, [5, 10])).toEqual({
        kind: 'comparison',
        field,
        op: 'between',
        value: [5, 10],
      })
    })

    it('is_not_between should produce notBetween', () => {
      expect(numberCompilers.is_not_between!(field, [5, 10])).toEqual({
        kind: 'comparison',
        field,
        op: 'notBetween',
        value: [5, 10],
      })
    })
  })

  // ── Date Compilers ────────────────────────────────────────

  describe('dateCompilers', () => {
    const field = makeDirectField('createdAt', 'date')
    const dateISO = '2025-06-15T12:00:00.000Z'

    it('is should expand to AND(gte startOfDay, lte endOfDay)', () => {
      const result = dateCompilers.is!(field, [dateISO])
      expect(result.kind).toBe('and')

      if (result.kind === 'and') {
        expect(result.conditions).toHaveLength(2)

        const [gte, lte] = result.conditions
        expect(gte).toMatchObject({ kind: 'comparison', op: 'gte' })
        expect(lte).toMatchObject({ kind: 'comparison', op: 'lte' })
      }
    })

    it('is_not should expand to OR(lt startOfDay, gt endOfDay)', () => {
      const result = dateCompilers.is_not!(field, [dateISO])
      expect(result.kind).toBe('or')

      if (result.kind === 'or') {
        expect(result.conditions).toHaveLength(2)

        const [lt, gt] = result.conditions
        expect(lt).toMatchObject({ kind: 'comparison', op: 'lt' })
        expect(gt).toMatchObject({ kind: 'comparison', op: 'gt' })
      }
    })

    it('is_before should produce lt with startOfDay', () => {
      const result = dateCompilers.is_before!(field, [dateISO])
      expect(result).toMatchObject({ kind: 'comparison', op: 'lt' })
    })

    it('is_on_or_after should produce gte with startOfDay', () => {
      const result = dateCompilers.is_on_or_after!(field, [dateISO])
      expect(result).toMatchObject({ kind: 'comparison', op: 'gte' })
    })

    it('is_after should produce gt with endOfDay', () => {
      const result = dateCompilers.is_after!(field, [dateISO])
      expect(result).toMatchObject({ kind: 'comparison', op: 'gt' })
    })

    it('is_on_or_before should produce lte with endOfDay', () => {
      const result = dateCompilers.is_on_or_before!(field, [dateISO])
      expect(result).toMatchObject({ kind: 'comparison', op: 'lte' })
    })

    it('is_between should produce between with day boundaries', () => {
      const result = dateCompilers.is_between!(field, [
        '2025-06-01T12:00:00.000Z',
        '2025-06-30T12:00:00.000Z',
      ])
      expect(result).toMatchObject({ kind: 'comparison', op: 'between' })

      if (result.kind === 'comparison') {
        expect(Array.isArray(result.value)).toBe(true)
      }
    })

    it('is_not_between should produce notBetween with day boundaries', () => {
      const result = dateCompilers.is_not_between!(field, [
        '2025-06-01T12:00:00.000Z',
        '2025-06-30T12:00:00.000Z',
      ])
      expect(result).toMatchObject({ kind: 'comparison', op: 'notBetween' })
    })
  })

  // ── Boolean Compilers ─────────────────────────────────────

  describe('booleanCompilers', () => {
    const field = makeDirectField('active', 'boolean')

    it('is should produce eq', () => {
      expect(booleanCompilers.is!(field, [true])).toEqual({
        kind: 'comparison',
        field,
        op: 'eq',
        value: true,
      })
    })

    it('is_not should produce neq', () => {
      expect(booleanCompilers.is_not!(field, [false])).toEqual({
        kind: 'comparison',
        field,
        op: 'neq',
        value: false,
      })
    })
  })

  // ── MultiOption Compilers ─────────────────────────────────

  describe('multiOptionCompilers', () => {
    const directField = makeDirectField('tags', 'multiOption')
    const hasManyField = makeHasManyField(
      'labels',
      'multiOption',
      'labels',
      'name',
    )

    describe('include', () => {
      it('with direct field should produce arrayContains', () => {
        expect(multiOptionCompilers.include!(directField, ['tag1'])).toEqual({
          kind: 'comparison',
          field: directField,
          op: 'arrayContains',
          value: ['tag1'],
        })
      })

      it('with hasMany field should produce eq', () => {
        expect(multiOptionCompilers.include!(hasManyField, ['bug'])).toEqual({
          kind: 'comparison',
          field: hasManyField,
          op: 'eq',
          value: 'bug',
        })
      })
    })

    describe('exclude', () => {
      it('with direct field should produce NOT(arrayContains)', () => {
        expect(multiOptionCompilers.exclude!(directField, ['tag1'])).toEqual({
          kind: 'not',
          condition: {
            kind: 'comparison',
            field: directField,
            op: 'arrayContains',
            value: ['tag1'],
          },
        })
      })

      it('with hasMany field should produce NOT(eq)', () => {
        expect(multiOptionCompilers.exclude!(hasManyField, ['bug'])).toEqual({
          kind: 'not',
          condition: {
            kind: 'comparison',
            field: hasManyField,
            op: 'eq',
            value: 'bug',
          },
        })
      })
    })

    describe('include_any_of', () => {
      it('with direct field should produce arrayOverlaps', () => {
        expect(
          multiOptionCompilers.include_any_of!(directField, ['tag1', 'tag2']),
        ).toEqual({
          kind: 'comparison',
          field: directField,
          op: 'arrayOverlaps',
          value: ['tag1', 'tag2'],
        })
      })

      it('with hasMany field should produce in', () => {
        expect(
          multiOptionCompilers.include_any_of!(hasManyField, ['bug', 'feat']),
        ).toEqual({
          kind: 'comparison',
          field: hasManyField,
          op: 'in',
          value: ['bug', 'feat'],
        })
      })
    })

    describe('include_all_of', () => {
      it('with direct field should produce arrayContains', () => {
        expect(
          multiOptionCompilers.include_all_of!(directField, ['tag1', 'tag2']),
        ).toEqual({
          kind: 'comparison',
          field: directField,
          op: 'arrayContains',
          value: ['tag1', 'tag2'],
        })
      })

      it('with hasMany field should produce AND of eq conditions', () => {
        const result = multiOptionCompilers.include_all_of!(hasManyField, [
          'bug',
          'feat',
        ])

        expect(result).toEqual({
          kind: 'and',
          conditions: [
            { kind: 'comparison', field: hasManyField, op: 'eq', value: 'bug' },
            {
              kind: 'comparison',
              field: hasManyField,
              op: 'eq',
              value: 'feat',
            },
          ],
        })
      })
    })

    describe('exclude_if_any_of', () => {
      it('with direct field should produce NOT(arrayOverlaps)', () => {
        expect(
          multiOptionCompilers.exclude_if_any_of!(directField, [
            'tag1',
            'tag2',
          ]),
        ).toEqual({
          kind: 'not',
          condition: {
            kind: 'comparison',
            field: directField,
            op: 'arrayOverlaps',
            value: ['tag1', 'tag2'],
          },
        })
      })

      it('with hasMany field should produce NOT(in)', () => {
        expect(
          multiOptionCompilers.exclude_if_any_of!(hasManyField, [
            'bug',
            'feat',
          ]),
        ).toEqual({
          kind: 'not',
          condition: {
            kind: 'comparison',
            field: hasManyField,
            op: 'in',
            value: ['bug', 'feat'],
          },
        })
      })
    })

    describe('exclude_if_all', () => {
      it('with direct field should produce NOT(arrayContains)', () => {
        expect(
          multiOptionCompilers.exclude_if_all!(directField, ['tag1', 'tag2']),
        ).toEqual({
          kind: 'not',
          condition: {
            kind: 'comparison',
            field: directField,
            op: 'arrayContains',
            value: ['tag1', 'tag2'],
          },
        })
      })

      it('with hasMany field should produce NOT(AND of eq)', () => {
        const result = multiOptionCompilers.exclude_if_all!(hasManyField, [
          'bug',
          'feat',
        ])

        expect(result).toEqual({
          kind: 'not',
          condition: {
            kind: 'and',
            conditions: [
              {
                kind: 'comparison',
                field: hasManyField,
                op: 'eq',
                value: 'bug',
              },
              {
                kind: 'comparison',
                field: hasManyField,
                op: 'eq',
                value: 'feat',
              },
            ],
          },
        })
      })
    })
  })

  // ── builtInCompilers Registry ─────────────────────────────

  describe('builtInCompilers', () => {
    it('should have all 7 built-in types', () => {
      expect(builtInCompilers.text).toBe(textCompilers)
      expect(builtInCompilers.option).toBe(optionCompilers)
      expect(builtInCompilers.number).toBe(numberCompilers)
      expect(builtInCompilers.bigint).toBe(numberCompilers) // bigint reuses number compilers
      expect(builtInCompilers.date).toBe(dateCompilers)
      expect(builtInCompilers.boolean).toBe(booleanCompilers)
      expect(builtInCompilers.multiOption).toBe(multiOptionCompilers)
    })
  })
})
