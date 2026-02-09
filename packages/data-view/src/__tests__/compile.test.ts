import { describe, expect, it } from 'vitest'
import { createColumnBuilder } from '../core/columns/column-builder.js'
import type {
  ColumnSort,
  CustomSort,
  DataViewState,
  FiltersState,
  SortState,
} from '../core/types.js'
import type { FieldRef } from '../server/ast.js'
import {
  buildQueryAST,
  compileFilters,
  compileSearch,
  compileSort,
  serializeFilterValues,
} from '../server/compile.js'
import { resolveFieldRefs } from '../server/resolve.js'

// ── Helpers ─────────────────────────────────────────────────

type TestRow = {
  title: string
  status: string
  age: number
  active: boolean
  createdAt: Date
  labels: string[]
  amount: bigint
}

const c = createColumnBuilder<TestRow>()

const titleCol = c
  .text()
  .id('title')
  .accessor((r) => r.title)
  .displayName('Title')
  .build()

const statusCol = c
  .option()
  .id('status')
  .accessor((r) => r.status)
  .displayName('Status')
  .field('status.name')
  .build()

const ageCol = c
  .number()
  .id('age')
  .accessor((r) => r.age)
  .displayName('Age')
  .build()

const activeCol = c
  .boolean()
  .id('active')
  .accessor((r) => r.active)
  .displayName('Active')
  .build()

const createdAtCol = c
  .date()
  .id('createdAt')
  .accessor((r) => r.createdAt)
  .displayName('Created')
  .field('created_at')
  .build()

const labelsCol = c
  .multiOption()
  .id('labels')
  .accessor((r) => r.labels)
  .displayName('Labels')
  .field('labels.name')
  .build()

const allColumns = [
  titleCol,
  statusCol,
  ageCol,
  activeCol,
  createdAtCol,
  labelsCol,
]

const fieldRefs = resolveFieldRefs(allColumns, new Set(['labels']))

// ── compileFilters ──────────────────────────────────────────

describe('server/compile', () => {
  describe('compileFilters', () => {
    it('should return null for empty filters', () => {
      const result = compileFilters([], { fieldRefs })
      expect(result).toBeNull()
    })

    it('should return the condition directly for a single filter', () => {
      const filters: FiltersState = [
        {
          columnId: 'title',
          type: 'text',
          operator: 'contains',
          values: ['hello'],
        },
      ]

      const result = compileFilters(filters, { fieldRefs })

      expect(result).not.toBeNull()
      expect(result!.kind).toBe('comparison')
      if (result!.kind === 'comparison') {
        expect(result!.op).toBe('ilike')
        expect(result!.value).toBe('%hello%')
      }
    })

    it('should wrap multiple filters in AND', () => {
      const filters: FiltersState = [
        {
          columnId: 'title',
          type: 'text',
          operator: 'contains',
          values: ['hello'],
        },
        {
          columnId: 'age',
          type: 'number',
          operator: 'is',
          values: [42],
        },
      ]

      const result = compileFilters(filters, { fieldRefs })

      expect(result).not.toBeNull()
      expect(result!.kind).toBe('and')
      if (result!.kind === 'and') {
        expect(result!.conditions).toHaveLength(2)
      }
    })

    it('should skip unknown columns', () => {
      const filters: FiltersState = [
        {
          columnId: 'nonexistent',
          type: 'text',
          operator: 'contains',
          values: ['test'],
        },
      ]

      const result = compileFilters(filters, { fieldRefs })
      expect(result).toBeNull()
    })

    it('should skip unknown operator types', () => {
      const filters: FiltersState = [
        {
          columnId: 'title',
          type: 'custom_unknown',
          operator: 'contains',
          values: ['test'],
        },
      ]

      const result = compileFilters(filters, { fieldRefs })
      expect(result).toBeNull()
    })

    it('should use custom compilers when provided', () => {
      const filters: FiltersState = [
        {
          columnId: 'title',
          type: 'text',
          operator: 'custom_op',
          values: ['test'],
        },
      ]

      const customCompilers = {
        text: {
          custom_op: (field: FieldRef, values: any[]) => ({
            kind: 'comparison' as const,
            field,
            op: 'eq' as const,
            value: values[0] ?? null,
          }),
        },
      }

      const result = compileFilters(filters, {
        fieldRefs,
        compilers: customCompilers,
      })

      expect(result).not.toBeNull()
      expect(result!.kind).toBe('comparison')
      if (result!.kind === 'comparison') {
        expect(result!.op).toBe('eq')
        expect(result!.value).toBe('test')
      }
    })
  })

  // ── compileSort ─────────────────────────────────────────────

  describe('compileSort', () => {
    it('should compile column sorts into SortNodes', () => {
      const sort: SortState = [
        { type: 'column', columnId: 'title', direction: 'asc' } as ColumnSort,
        { type: 'column', columnId: 'age', direction: 'desc' } as ColumnSort,
      ]

      const result = compileSort(sort, { fieldRefs })

      expect(result).toHaveLength(2)
      expect(result[0]!.field.columnId).toBe('title')
      expect(result[0]!.direction).toBe('asc')
      expect(result[0]!.nulls).toBe('last')
      expect(result[1]!.field.columnId).toBe('age')
      expect(result[1]!.direction).toBe('desc')
    })

    it('should skip custom sorts', () => {
      const sort: SortState = [
        { type: 'custom', id: 'relevance', enabled: true } as CustomSort,
        { type: 'column', columnId: 'title', direction: 'asc' } as ColumnSort,
      ]

      const result = compileSort(sort, { fieldRefs })

      expect(result).toHaveLength(1)
      expect(result[0]!.field.columnId).toBe('title')
    })

    it('should skip sorts for unknown columns', () => {
      const sort: SortState = [
        {
          type: 'column',
          columnId: 'nonexistent',
          direction: 'asc',
        } as ColumnSort,
      ]

      const result = compileSort(sort, { fieldRefs })
      expect(result).toHaveLength(0)
    })

    it('should return empty array for empty sort', () => {
      const result = compileSort([], { fieldRefs })
      expect(result).toEqual([])
    })
  })

  // ── compileSearch ───────────────────────────────────────────

  describe('compileSearch', () => {
    it('should return null for empty query', () => {
      const result = compileSearch(
        { query: '', columns: ['title'] },
        { fieldRefs },
      )
      expect(result).toBeNull()
    })

    it('should return null for whitespace-only query', () => {
      const result = compileSearch(
        { query: '   ', columns: ['title'] },
        { fieldRefs },
      )
      expect(result).toBeNull()
    })

    it('should return null when no valid columns match', () => {
      const result = compileSearch(
        { query: 'test', columns: ['nonexistent'] },
        { fieldRefs },
      )
      expect(result).toBeNull()
    })

    it('should produce a SearchNode with valid query and columns', () => {
      const result = compileSearch(
        { query: 'hello', columns: ['title', 'status'] },
        { fieldRefs },
      )

      expect(result).not.toBeNull()
      expect(result!.query).toBe('hello')
      expect(result!.fields).toHaveLength(2)
      expect(result!.mode).toBe('contains')
    })

    it('should use the specified mode', () => {
      const result = compileSearch(
        { query: 'hello', columns: ['title'], mode: 'fulltext' },
        { fieldRefs },
      )

      expect(result!.mode).toBe('fulltext')
    })

    it('should skip unknown columns in the search list', () => {
      const result = compileSearch(
        { query: 'hello', columns: ['title', 'nonexistent'] },
        { fieldRefs },
      )

      expect(result!.fields).toHaveLength(1)
      expect(result!.fields[0]!.columnId).toBe('title')
    })
  })

  // ── buildQueryAST ─────────────────────────────────────────

  describe('buildQueryAST', () => {
    it('should build a complete AST with filters, sort, pagination, and search', () => {
      const view: DataViewState = {
        filters: [
          {
            columnId: 'title',
            type: 'text',
            operator: 'contains',
            values: ['test'],
          },
          {
            columnId: 'active',
            type: 'boolean',
            operator: 'is',
            values: [true],
          },
        ],
        sort: [
          {
            type: 'column',
            columnId: 'age',
            direction: 'desc',
          } as ColumnSort,
        ],
      }

      const ast = buildQueryAST(view, {
        columns: allColumns,
        hasManyRelations: new Set(['labels']),
        pagination: { kind: 'offset', offset: 0, limit: 25 },
        search: { query: 'hello', columns: ['title', 'status'] },
      })

      // where
      expect(ast.where).not.toBeNull()
      expect(ast.where!.kind).toBe('and')

      // orderBy
      expect(ast.orderBy).toHaveLength(1)
      expect(ast.orderBy[0]!.field.columnId).toBe('age')
      expect(ast.orderBy[0]!.direction).toBe('desc')

      // pagination
      expect(ast.pagination).toEqual({
        kind: 'offset',
        offset: 0,
        limit: 25,
      })

      // search
      expect(ast.search).not.toBeNull()
      expect(ast.search!.query).toBe('hello')
    })

    it('should handle empty state', () => {
      const view: DataViewState = {
        filters: [],
        sort: [],
      }

      const ast = buildQueryAST(view, {
        columns: allColumns,
      })

      expect(ast.where).toBeNull()
      expect(ast.orderBy).toEqual([])
      expect(ast.pagination).toBeNull()
      expect(ast.search).toBeNull()
    })

    it('should handle pagination without search', () => {
      const view: DataViewState = {
        filters: [],
        sort: [],
      }

      const ast = buildQueryAST(view, {
        columns: allColumns,
        pagination: {
          kind: 'cursor',
          cursor: 'abc',
          limit: 10,
          direction: 'forward',
        },
      })

      expect(ast.pagination).toEqual({
        kind: 'cursor',
        cursor: 'abc',
        limit: 10,
        direction: 'forward',
      })
      expect(ast.search).toBeNull()
    })
  })

  // ── serializeFilterValues ─────────────────────────────────

  describe('serializeFilterValues', () => {
    it('should serialize Date values to ISO strings', () => {
      const date = new Date('2025-06-15T12:00:00.000Z')
      const result = serializeFilterValues([date], 'date')

      expect(result).toEqual(['2025-06-15T12:00:00.000Z'])
    })

    it('should serialize BigInt values to strings', () => {
      const result = serializeFilterValues([BigInt(123456789)], 'bigint')

      expect(result).toEqual(['123456789'])
    })

    it('should pass through plain values unchanged', () => {
      const result = serializeFilterValues(['hello', 42, true], 'text')
      expect(result).toEqual(['hello', 42, true])
    })

    it('should pass through number values unchanged', () => {
      const result = serializeFilterValues([42, 100], 'number')
      expect(result).toEqual([42, 100])
    })

    it('should handle null values', () => {
      const result = serializeFilterValues([null, undefined], 'date')
      expect(result).toEqual([null, null])
    })

    it('should pass through values for unknown types without serializer', () => {
      const result = serializeFilterValues(['hello'], 'custom_unknown')
      expect(result).toEqual(['hello'])
    })

    it('should use custom column types when provided', () => {
      const customTypes = {
        currency: {
          id: 'currency',
          operators: {} as any,
          normalizeValues: (v: number[]) => v,
          serialize: (v: number) => `$${v}`,
        },
      }

      const result = serializeFilterValues([100], 'currency', customTypes)
      expect(result).toEqual(['$100'])
    })
  })
})
