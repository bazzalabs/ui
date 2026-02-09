import { describe, expect, it } from 'vitest'
import { createColumnBuilder } from '../core/columns/column-builder.js'
import {
  parseFieldPath,
  refineFieldPath,
  resolveFieldRef,
  resolveFieldRefs,
} from '../server/resolve.js'

// ── Helpers ─────────────────────────────────────────────────

type TestRow = {
  title: string
  created_at: Date
  status: string
  labels: string[]
}

const c = createColumnBuilder<TestRow>()

// ── parseFieldPath ──────────────────────────────────────────

describe('server/resolve', () => {
  describe('parseFieldPath', () => {
    it('should parse a simple column name as direct', () => {
      expect(parseFieldPath('title')).toEqual({
        kind: 'direct',
        column: 'title',
      })
    })

    it('should parse an underscored column name as direct', () => {
      expect(parseFieldPath('created_at')).toEqual({
        kind: 'direct',
        column: 'created_at',
      })
    })

    it('should parse a dotted path as belongsTo by default', () => {
      expect(parseFieldPath('status.name')).toEqual({
        kind: 'belongsTo',
        relation: 'status',
        column: 'name',
      })
    })

    it('should parse a dotted path with any relation as belongsTo', () => {
      expect(parseFieldPath('labels.name')).toEqual({
        kind: 'belongsTo',
        relation: 'labels',
        column: 'name',
      })
    })

    it('should throw for a path starting with a dot', () => {
      expect(() => parseFieldPath('.name')).toThrow(
        'Invalid field path ".name"',
      )
    })

    it('should throw for a path ending with a dot', () => {
      expect(() => parseFieldPath('status.')).toThrow(
        'Invalid field path "status."',
      )
    })

    it('should throw for a standalone dot', () => {
      expect(() => parseFieldPath('.')).toThrow('Invalid field path "."')
    })
  })

  // ── refineFieldPath ─────────────────────────────────────────

  describe('refineFieldPath', () => {
    it('should convert belongsTo to hasMany when relation is in the set', () => {
      const hasManyRelations = new Set(['labels'])
      const path = parseFieldPath('labels.name')

      expect(refineFieldPath(path, hasManyRelations)).toEqual({
        kind: 'hasMany',
        relation: 'labels',
        column: 'name',
      })
    })

    it('should leave belongsTo unchanged when relation is not in the set', () => {
      const hasManyRelations = new Set(['labels'])
      const path = parseFieldPath('status.name')

      expect(refineFieldPath(path, hasManyRelations)).toEqual({
        kind: 'belongsTo',
        relation: 'status',
        column: 'name',
      })
    })

    it('should leave direct paths unchanged', () => {
      const hasManyRelations = new Set(['labels'])
      const path = parseFieldPath('title')

      expect(refineFieldPath(path, hasManyRelations)).toEqual({
        kind: 'direct',
        column: 'title',
      })
    })

    it('should leave belongsTo unchanged when set is empty', () => {
      const path = parseFieldPath('status.name')

      expect(refineFieldPath(path, new Set())).toEqual({
        kind: 'belongsTo',
        relation: 'status',
        column: 'name',
      })
    })
  })

  // ── resolveFieldRef ─────────────────────────────────────────

  describe('resolveFieldRef', () => {
    it('should use column.id when .field() is not set', () => {
      const col = c
        .text()
        .id('title')
        .accessor((r) => r.title)
        .displayName('Title')
        .build()

      const ref = resolveFieldRef(col)

      expect(ref).toEqual({
        columnId: 'title',
        type: 'text',
        path: { kind: 'direct', column: 'title' },
      })
    })

    it('should parse .field() when set to a simple column name', () => {
      const col = c
        .date()
        .id('createdAt')
        .accessor((r) => r.created_at)
        .displayName('Created')
        .field('created_at')
        .build()

      const ref = resolveFieldRef(col)

      expect(ref).toEqual({
        columnId: 'createdAt',
        type: 'date',
        path: { kind: 'direct', column: 'created_at' },
      })
    })

    it('should parse .field() when set to a dotted relation path', () => {
      const col = c
        .option()
        .id('status')
        .accessor((r) => r.status)
        .displayName('Status')
        .field('status.name')
        .build()

      const ref = resolveFieldRef(col)

      expect(ref).toEqual({
        columnId: 'status',
        type: 'option',
        path: { kind: 'belongsTo', relation: 'status', column: 'name' },
      })
    })

    it('should refine belongsTo to hasMany when hasManyRelations is provided', () => {
      const col = c
        .multiOption()
        .id('labels')
        .accessor((r) => r.labels)
        .displayName('Labels')
        .field('labels.name')
        .build()

      const ref = resolveFieldRef(col, new Set(['labels']))

      expect(ref).toEqual({
        columnId: 'labels',
        type: 'multiOption',
        path: { kind: 'hasMany', relation: 'labels', column: 'name' },
      })
    })

    it('should not refine when hasManyRelations is not provided', () => {
      const col = c
        .multiOption()
        .id('labels')
        .accessor((r) => r.labels)
        .displayName('Labels')
        .field('labels.name')
        .build()

      const ref = resolveFieldRef(col)

      expect(ref.path).toEqual({
        kind: 'belongsTo',
        relation: 'labels',
        column: 'name',
      })
    })
  })

  // ── resolveFieldRefs ────────────────────────────────────────

  describe('resolveFieldRefs', () => {
    it('should create a Map of all columns', () => {
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

      const labelsCol = c
        .multiOption()
        .id('labels')
        .accessor((r) => r.labels)
        .displayName('Labels')
        .field('labels.name')
        .build()

      const map = resolveFieldRefs(
        [titleCol, statusCol, labelsCol],
        new Set(['labels']),
      )

      expect(map.size).toBe(3)

      expect(map.get('title')).toEqual({
        columnId: 'title',
        type: 'text',
        path: { kind: 'direct', column: 'title' },
      })

      expect(map.get('status')).toEqual({
        columnId: 'status',
        type: 'option',
        path: { kind: 'belongsTo', relation: 'status', column: 'name' },
      })

      expect(map.get('labels')).toEqual({
        columnId: 'labels',
        type: 'multiOption',
        path: { kind: 'hasMany', relation: 'labels', column: 'name' },
      })
    })

    it('should work without hasManyRelations', () => {
      const col = c
        .text()
        .id('title')
        .accessor((r) => r.title)
        .displayName('Title')
        .build()

      const map = resolveFieldRefs([col])

      expect(map.size).toBe(1)
      expect(map.get('title')!.path.kind).toBe('direct')
    })
  })
})
