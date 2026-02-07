import { describe, expect, it } from 'vitest'
import { builtInColumnTypes, defineColumnType } from '../core/column-types.js'
import { numberOperators } from '../core/operator-sets.js'
import type { DataViewState } from '../core/types.js'
import { deserializeView, serializeView } from '../lib/serialize.js'

// ── Helpers ─────────────────────────────────────────────────

const simpleView: DataViewState = {
  filters: [
    { columnId: 'status', type: 'option', operator: 'is', values: ['active'] },
    {
      columnId: 'name',
      type: 'text',
      operator: 'contains',
      values: ['John'],
    },
  ],
  sort: [{ type: 'column', columnId: 'name', direction: 'desc' }],
}

// ── serializeView / deserializeView ─────────────────────────

describe('lib/serialize', () => {
  // ── Round-trip with simple types ────────────────────────────

  describe('round-trip with simple types', () => {
    it('should round-trip a view with text and option filters', () => {
      const encoded = serializeView(simpleView)
      const decoded = deserializeView(encoded)
      expect(decoded).toEqual(simpleView)
    })

    it('should round-trip a view with number filters', () => {
      const view: DataViewState = {
        filters: [
          {
            columnId: 'age',
            type: 'number',
            operator: 'is between',
            values: [18, 65],
          },
        ],
        sort: [],
      }
      const encoded = serializeView(view)
      const decoded = deserializeView(encoded)
      expect(decoded).toEqual(view)
    })

    it('should round-trip a view with boolean filter', () => {
      const view: DataViewState = {
        filters: [
          {
            columnId: 'active',
            type: 'boolean',
            operator: 'is',
            values: [true],
          },
        ],
        sort: [],
      }
      const encoded = serializeView(view)
      const decoded = deserializeView(encoded)
      expect(decoded).toEqual(view)
    })

    it('should round-trip a view with multiOption filter', () => {
      const view: DataViewState = {
        filters: [
          {
            columnId: 'tags',
            type: 'multiOption',
            operator: 'include any of',
            values: ['bug', 'feature'],
          },
        ],
        sort: [],
      }
      const encoded = serializeView(view)
      const decoded = deserializeView(encoded)
      expect(decoded).toEqual(view)
    })
  })

  // ── Date values ─────────────────────────────────────────────

  describe('date values', () => {
    it('should round-trip date filter values with builtInColumnTypes', () => {
      const date1 = new Date('2024-01-15T00:00:00.000Z')
      const date2 = new Date('2024-06-30T00:00:00.000Z')

      const view: DataViewState = {
        filters: [
          {
            columnId: 'createdAt',
            type: 'date',
            operator: 'is between',
            values: [date1, date2],
          },
        ],
        sort: [],
      }

      const encoded = serializeView(view, {
        columnTypes: builtInColumnTypes,
      })
      const decoded = deserializeView(encoded, {
        columnTypes: builtInColumnTypes,
      })

      expect(decoded).not.toBeNull()
      expect(decoded!.filters[0].values).toHaveLength(2)
      expect(decoded!.filters[0].values[0]).toBeInstanceOf(Date)
      expect(decoded!.filters[0].values[1]).toBeInstanceOf(Date)
      expect((decoded!.filters[0].values[0] as Date).getTime()).toBe(
        date1.getTime(),
      )
      expect((decoded!.filters[0].values[1] as Date).getTime()).toBe(
        date2.getTime(),
      )
    })

    it('should serialize date to ISO string', () => {
      const date = new Date('2024-03-15T12:00:00.000Z')
      const view: DataViewState = {
        filters: [
          {
            columnId: 'createdAt',
            type: 'date',
            operator: 'is',
            values: [date],
          },
        ],
        sort: [],
      }

      const encoded = serializeView(view, {
        columnTypes: builtInColumnTypes,
      })
      // Decode the base64 to check the JSON
      const json = decodeURIComponent(atob(encoded))
      const parsed = JSON.parse(json)
      expect(parsed.filters[0].values[0]).toBe('2024-03-15T12:00:00.000Z')
    })
  })

  // ── BigInt values ───────────────────────────────────────────

  describe('bigint values', () => {
    it('should round-trip bigint filter values with builtInColumnTypes', () => {
      const view: DataViewState = {
        filters: [
          {
            columnId: 'amount',
            type: 'bigint',
            operator: 'is between',
            values: [BigInt(100), BigInt(99999999999999)],
          },
        ],
        sort: [],
      }

      const encoded = serializeView(view, {
        columnTypes: builtInColumnTypes,
      })
      const decoded = deserializeView(encoded, {
        columnTypes: builtInColumnTypes,
      })

      expect(decoded).not.toBeNull()
      expect(decoded!.filters[0].values).toHaveLength(2)
      expect(decoded!.filters[0].values[0]).toBe(BigInt(100))
      expect(decoded!.filters[0].values[1]).toBe(BigInt(99999999999999))
    })

    it('should serialize bigint to string', () => {
      const view: DataViewState = {
        filters: [
          {
            columnId: 'amount',
            type: 'bigint',
            operator: 'is',
            values: [BigInt(42)],
          },
        ],
        sort: [],
      }

      const encoded = serializeView(view, {
        columnTypes: builtInColumnTypes,
      })
      const json = decodeURIComponent(atob(encoded))
      const parsed = JSON.parse(json)
      expect(parsed.filters[0].values[0]).toBe('42')
    })
  })

  // ── Custom column types ───────────────────────────────────

  describe('custom column types', () => {
    it('should round-trip with a custom column type serialize/deserialize', () => {
      const currencyType = defineColumnType<{
        amount: number
        currency: string
      }>({
        id: 'currency',
        operators: numberOperators,
        serialize: (v) => ({ a: v.amount, c: v.currency }),
        deserialize: (raw: unknown) => {
          const r = raw as { a: number; c: string }
          return { amount: r.a, currency: r.c }
        },
      })

      const columnTypes = {
        ...builtInColumnTypes,
        currency: currencyType,
      }

      const view: DataViewState = {
        filters: [
          {
            columnId: 'price',
            type: 'currency',
            operator: 'equals',
            values: [{ amount: 99.99, currency: 'USD' }],
          },
        ],
        sort: [],
      }

      const encoded = serializeView(view, { columnTypes })
      const decoded = deserializeView(encoded, { columnTypes })

      expect(decoded).not.toBeNull()
      expect(decoded!.filters[0].values[0]).toEqual({
        amount: 99.99,
        currency: 'USD',
      })
    })
  })

  // ── Sort state ──────────────────────────────────────────────

  describe('sort state', () => {
    it('should round-trip column sort rules', () => {
      const view: DataViewState = {
        filters: [],
        sort: [
          { type: 'column', columnId: 'name', direction: 'asc' },
          { type: 'column', columnId: 'age', direction: 'desc' },
        ],
      }
      const encoded = serializeView(view)
      const decoded = deserializeView(encoded)
      expect(decoded).toEqual(view)
    })

    it('should round-trip custom sort rules', () => {
      const view: DataViewState = {
        filters: [],
        sort: [
          { type: 'custom', id: 'relevance', enabled: true },
          { type: 'column', columnId: 'name', direction: 'desc' },
        ],
      }
      const encoded = serializeView(view)
      const decoded = deserializeView(encoded)
      expect(decoded).toEqual(view)
    })
  })

  // ── Empty views ─────────────────────────────────────────────

  describe('empty views', () => {
    it('should round-trip an empty view', () => {
      const view: DataViewState = { filters: [], sort: [] }
      const encoded = serializeView(view)
      const decoded = deserializeView(encoded)
      expect(decoded).toEqual(view)
    })
  })

  // ── Views with metadata ───────────────────────────────────

  describe('views with metadata', () => {
    it('should round-trip a view with id and name', () => {
      const view: DataViewState = {
        id: 'saved-view-1',
        name: 'My Active Issues',
        filters: [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ],
        sort: [{ type: 'column', columnId: 'name', direction: 'asc' }],
      }
      const encoded = serializeView(view)
      const decoded = deserializeView(encoded)
      expect(decoded).toEqual(view)
      expect(decoded!.id).toBe('saved-view-1')
      expect(decoded!.name).toBe('My Active Issues')
    })

    it('should round-trip a view with only id', () => {
      const view: DataViewState = {
        id: 'v2',
        filters: [],
        sort: [],
      }
      const encoded = serializeView(view)
      const decoded = deserializeView(encoded)
      expect(decoded!.id).toBe('v2')
      expect(decoded!.name).toBeUndefined()
    })
  })

  // ── Malformed input ─────────────────────────────────────────

  describe('malformed input', () => {
    it('should return null for empty string', () => {
      expect(deserializeView('')).toBeNull()
    })

    it('should return null for invalid base64', () => {
      expect(deserializeView('not-valid-base64!!!')).toBeNull()
    })

    it('should return null for valid base64 but invalid JSON', () => {
      const encoded = btoa(encodeURIComponent('not json'))
      expect(deserializeView(encoded)).toBeNull()
    })

    it('should return null for valid JSON but invalid structure (no filters)', () => {
      const encoded = btoa(encodeURIComponent(JSON.stringify({ sort: [] })))
      expect(deserializeView(encoded)).toBeNull()
    })

    it('should return null for valid JSON but invalid structure (no sort)', () => {
      const encoded = btoa(encodeURIComponent(JSON.stringify({ filters: [] })))
      expect(deserializeView(encoded)).toBeNull()
    })

    it('should return null for non-object JSON', () => {
      const encoded = btoa(encodeURIComponent(JSON.stringify('hello')))
      expect(deserializeView(encoded)).toBeNull()
    })

    it('should return null for null JSON', () => {
      const encoded = btoa(encodeURIComponent(JSON.stringify(null)))
      expect(deserializeView(encoded)).toBeNull()
    })
  })

  // ── No columnTypes (passthrough) ──────────────────────────

  describe('without columnTypes', () => {
    it('should pass values through without transformation', () => {
      const view: DataViewState = {
        filters: [
          {
            columnId: 'createdAt',
            type: 'date',
            operator: 'is',
            values: ['2024-01-01T00:00:00.000Z'], // already a string
          },
        ],
        sort: [],
      }
      const encoded = serializeView(view)
      const decoded = deserializeView(encoded)
      expect(decoded!.filters[0].values[0]).toBe('2024-01-01T00:00:00.000Z')
    })
  })

  // ── Special characters ────────────────────────────────────

  describe('special characters', () => {
    it('should handle filter values with special characters', () => {
      const view: DataViewState = {
        filters: [
          {
            columnId: 'name',
            type: 'text',
            operator: 'contains',
            values: ['Hello & "World" <script>'],
          },
        ],
        sort: [],
      }
      const encoded = serializeView(view)
      const decoded = deserializeView(encoded)
      expect(decoded!.filters[0].values[0]).toBe('Hello & "World" <script>')
    })

    it('should handle unicode characters', () => {
      const view: DataViewState = {
        filters: [
          {
            columnId: 'name',
            type: 'text',
            operator: 'contains',
            values: ['Hello, world!'],
          },
        ],
        sort: [],
      }
      const encoded = serializeView(view)
      const decoded = deserializeView(encoded)
      expect(decoded!.filters[0].values[0]).toBe('Hello, world!')
    })
  })
})
