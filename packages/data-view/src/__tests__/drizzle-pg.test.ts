import { getTableColumns, sql } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'
import {
  applyComparisonOp,
  applyDataView,
  collectRequiredJoins,
  comparisonToSQL,
  conditionToSQL,
  discoverFK,
  existsSubquery,
  isExplicitBelongsToConfig,
  isManyToManyConfig,
  type ResolvedBelongsTo,
  type ResolvedManyToMany,
  type ResolvedRelation,
  resolveColumn,
  resolveRelation,
  searchToSQL,
  sortToSQL,
} from '../drizzle/pg.js'
import type {
  ComparisonCondition,
  Condition,
  DataViewQueryAST,
  FieldRef,
  SearchNode,
  SortNode,
} from '../server/ast.js'

// ── Test Schema ─────────────────────────────────────────────
// Defines a realistic schema: issues → statuses (belongs-to),
// issues → users/assignees (belongs-to), issues ↔ labels (many-to-many).

const statuses = pgTable('statuses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
})

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
})

const issues = pgTable('issues', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  statusId: integer('status_id')
    .notNull()
    .references(() => statuses.id),
  assigneeId: integer('assignee_id').references(() => users.id),
  priority: integer('priority').notNull(),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

const labels = pgTable('labels', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
})

const issueLabels = pgTable('issue_labels', {
  issueId: integer('issue_id')
    .notNull()
    .references(() => issues.id),
  labelId: integer('label_id')
    .notNull()
    .references(() => labels.id),
})

// A table with no FK to issues (for negative tests)
const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
})

// ── Helpers ─────────────────────────────────────────────────

function makeDirectField(
  columnId: string,
  type: string,
  column?: string,
): FieldRef {
  return {
    columnId,
    type,
    path: { kind: 'direct', column: column ?? columnId },
  }
}

function makeBelongsToField(
  columnId: string,
  type: string,
  relation: string,
  column: string,
): FieldRef {
  return {
    columnId,
    type,
    path: { kind: 'belongsTo', relation, column },
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

/**
 * Resolves the standard belongs-to relations for the test schema.
 * Returns a Map with 'status' and 'assignee' resolved relations.
 */
function resolveStandardRelations(): Map<string, ResolvedRelation> {
  const map = new Map<string, ResolvedRelation>()

  const statusRel = resolveRelation('status', statuses, issues)
  map.set('status', statusRel)

  const assigneeRel = resolveRelation('assignee', users, issues)
  map.set('assignee', assigneeRel)

  const labelsRel = resolveRelation(
    'labels',
    { through: issueLabels, to: labels },
    issues,
  )
  map.set('labels', labelsRel)

  return map
}

// ── discoverFK ──────────────────────────────────────────────

describe('drizzle/pg', () => {
  describe('discoverFK', () => {
    it('should discover FK from issues to statuses', () => {
      const fk = discoverFK(issues, statuses)

      expect(fk).not.toBeNull()
      // The source column should be issues.statusId
      expect((fk!.sourceColumn as any).name).toBe('status_id')
      // The target column should be statuses.id
      expect((fk!.targetColumn as any).name).toBe('id')
    })

    it('should discover FK from issues to users', () => {
      const fk = discoverFK(issues, users)

      expect(fk).not.toBeNull()
      expect((fk!.sourceColumn as any).name).toBe('assignee_id')
    })

    it('should discover FK from issueLabels pivot to issues', () => {
      const fk = discoverFK(issueLabels, issues)

      expect(fk).not.toBeNull()
      expect((fk!.sourceColumn as any).name).toBe('issue_id')
    })

    it('should discover FK from issueLabels pivot to labels', () => {
      const fk = discoverFK(issueLabels, labels)

      expect(fk).not.toBeNull()
      expect((fk!.sourceColumn as any).name).toBe('label_id')
    })

    it('should return null when no FK exists', () => {
      const fk = discoverFK(issues, projects)
      expect(fk).toBeNull()
    })

    it('should return null when tables are unrelated', () => {
      const fk = discoverFK(projects, statuses)
      expect(fk).toBeNull()
    })
  })

  // ── Type Guards ─────────────────────────────────────────────

  describe('isManyToManyConfig', () => {
    it('should return true for { through, to } config', () => {
      expect(isManyToManyConfig({ through: issueLabels, to: labels })).toBe(
        true,
      )
    })

    it('should return false for a plain table', () => {
      expect(isManyToManyConfig(statuses)).toBe(false)
    })

    it('should return false for explicit belongs-to config', () => {
      expect(
        isManyToManyConfig({
          table: statuses,
          on: {
            source: issues.statusId as PgColumn,
            target: statuses.id as PgColumn,
          },
        }),
      ).toBe(false)
    })
  })

  describe('isExplicitBelongsToConfig', () => {
    it('should return true for { table, on } config', () => {
      expect(
        isExplicitBelongsToConfig({
          table: statuses,
          on: {
            source: issues.statusId as PgColumn,
            target: statuses.id as PgColumn,
          },
        }),
      ).toBe(true)
    })

    it('should return false for a plain table', () => {
      expect(isExplicitBelongsToConfig(statuses)).toBe(false)
    })

    it('should return false for many-to-many config', () => {
      expect(
        isExplicitBelongsToConfig({ through: issueLabels, to: labels }),
      ).toBe(false)
    })
  })

  // ── resolveRelation ─────────────────────────────────────────

  describe('resolveRelation', () => {
    it('should resolve a simple belongs-to relation (table reference)', () => {
      const rel = resolveRelation('status', statuses, issues)

      expect(rel.kind).toBe('belongsTo')
      if (rel.kind === 'belongsTo') {
        expect(rel.relatedTable).toBe(statuses)
        expect((rel.sourceFK as any).name).toBe('status_id')
        expect((rel.targetPK as any).name).toBe('id')
      }
    })

    it('should resolve an explicit belongs-to relation', () => {
      const rel = resolveRelation(
        'status',
        {
          table: statuses,
          on: {
            source: issues.statusId as PgColumn,
            target: statuses.id as PgColumn,
          },
        },
        issues,
      )

      expect(rel.kind).toBe('belongsTo')
      if (rel.kind === 'belongsTo') {
        expect(rel.relatedTable).toBe(statuses)
        expect(rel.sourceFK).toBe(issues.statusId)
        expect(rel.targetPK).toBe(statuses.id)
      }
    })

    it('should resolve a many-to-many relation', () => {
      const rel = resolveRelation(
        'labels',
        { through: issueLabels, to: labels },
        issues,
      )

      expect(rel.kind).toBe('manyToMany')
      if (rel.kind === 'manyToMany') {
        expect(rel.pivotTable).toBe(issueLabels)
        expect(rel.targetTable).toBe(labels)
        expect((rel.pivotSourceFK as any).name).toBe('issue_id')
        expect((rel.pivotTargetFK as any).name).toBe('label_id')
      }
    })

    it('should throw when simple belongs-to has no FK', () => {
      expect(() => resolveRelation('project', projects, issues)).toThrow(
        /Cannot find FK from source table/,
      )
    })

    it('should throw when many-to-many pivot has no FK to source', () => {
      // projects has no FK from issueLabels
      expect(() =>
        resolveRelation(
          'labels',
          { through: issueLabels, to: labels },
          projects, // no FK from issueLabels → projects
        ),
      ).toThrow(/Cannot find FK from pivot table to source table/)
    })

    it('should throw when many-to-many pivot has no FK to target', () => {
      // issueLabels has no FK to projects
      expect(() =>
        resolveRelation(
          'labels',
          { through: issueLabels, to: projects },
          issues,
        ),
      ).toThrow(/Cannot find FK from pivot table to target table/)
    })
  })

  // ── resolveColumn ───────────────────────────────────────────

  describe('resolveColumn', () => {
    const relations = resolveStandardRelations()

    it('should resolve a direct column by JS property name', () => {
      const field = makeDirectField('title', 'text', 'title')
      const col = resolveColumn(field, issues, relations)
      expect((col as any).name).toBe('title')
    })

    it('should resolve a direct column by DB column name', () => {
      // 'status_id' is the DB name, 'statusId' is the JS property name
      const field = makeDirectField('statusId', 'option', 'status_id')
      const col = resolveColumn(field, issues, relations)
      expect((col as any).name).toBe('status_id')
    })

    it('should resolve a belongs-to column', () => {
      const field = makeBelongsToField('status', 'option', 'status', 'name')
      const col = resolveColumn(field, issues, relations)
      expect((col as any).name).toBe('name')
    })

    it('should resolve a hasMany column', () => {
      const field = makeHasManyField('labels', 'multiOption', 'labels', 'name')
      const col = resolveColumn(field, issues, relations)
      expect((col as any).name).toBe('name')
    })

    it('should throw for unknown direct column', () => {
      const field = makeDirectField('unknown', 'text', 'nonexistent')
      expect(() => resolveColumn(field, issues, relations)).toThrow(
        /Cannot find column "nonexistent"/,
      )
    })

    it('should throw for unknown belongs-to relation', () => {
      const field = makeBelongsToField(
        'status',
        'option',
        'unknown_rel',
        'name',
      )
      expect(() => resolveColumn(field, issues, relations)).toThrow(
        /Relation "unknown_rel" not found/,
      )
    })

    it('should throw for unknown column on belongs-to related table', () => {
      const field = makeBelongsToField(
        'status',
        'option',
        'status',
        'nonexistent',
      )
      expect(() => resolveColumn(field, issues, relations)).toThrow(
        /Cannot find column "nonexistent"/,
      )
    })

    it('should throw for unknown hasMany relation', () => {
      const field = makeHasManyField(
        'labels',
        'multiOption',
        'unknown_rel',
        'name',
      )
      expect(() => resolveColumn(field, issues, relations)).toThrow(
        /Relation "unknown_rel" not found/,
      )
    })

    it('should throw when using belongs-to path with manyToMany relation', () => {
      const field = makeBelongsToField(
        'labels',
        'multiOption',
        'labels',
        'name',
      )
      expect(() => resolveColumn(field, issues, relations)).toThrow(
        /not a belongs-to relation/,
      )
    })

    it('should throw when using hasMany path with belongsTo relation', () => {
      const field = makeHasManyField('status', 'option', 'status', 'name')
      expect(() => resolveColumn(field, issues, relations)).toThrow(
        /not a many-to-many relation/,
      )
    })
  })

  // ── applyComparisonOp ─────────────────────────────────────

  describe('applyComparisonOp', () => {
    const col = getTableColumns(issues).title as PgColumn

    it('should produce SQL for eq', () => {
      const result = applyComparisonOp(col, 'eq', 'hello')
      expect(result).toBeDefined()
      // Drizzle SQL objects are truthy
    })

    it('should produce SQL for neq', () => {
      const result = applyComparisonOp(col, 'neq', 'hello')
      expect(result).toBeDefined()
    })

    it('should produce SQL for gt', () => {
      const result = applyComparisonOp(col, 'gt', 10)
      expect(result).toBeDefined()
    })

    it('should produce SQL for gte', () => {
      const result = applyComparisonOp(col, 'gte', 10)
      expect(result).toBeDefined()
    })

    it('should produce SQL for lt', () => {
      const result = applyComparisonOp(col, 'lt', 10)
      expect(result).toBeDefined()
    })

    it('should produce SQL for lte', () => {
      const result = applyComparisonOp(col, 'lte', 10)
      expect(result).toBeDefined()
    })

    it('should produce SQL for ilike', () => {
      const result = applyComparisonOp(col, 'ilike', '%test%')
      expect(result).toBeDefined()
    })

    it('should produce SQL for like', () => {
      const result = applyComparisonOp(col, 'like', '%test%')
      expect(result).toBeDefined()
    })

    it('should produce SQL for notIlike', () => {
      const result = applyComparisonOp(col, 'notIlike', '%test%')
      expect(result).toBeDefined()
    })

    it('should produce SQL for notLike', () => {
      const result = applyComparisonOp(col, 'notLike', '%test%')
      expect(result).toBeDefined()
    })

    it('should produce SQL for in', () => {
      const result = applyComparisonOp(col, 'in', ['a', 'b', 'c'])
      expect(result).toBeDefined()
    })

    it('should produce SQL for notIn', () => {
      const result = applyComparisonOp(col, 'notIn', ['a', 'b', 'c'])
      expect(result).toBeDefined()
    })

    it('should produce SQL for between', () => {
      const result = applyComparisonOp(col, 'between', [1, 10])
      expect(result).toBeDefined()
    })

    it('should produce SQL for notBetween', () => {
      const result = applyComparisonOp(col, 'notBetween', [1, 10])
      expect(result).toBeDefined()
    })

    it('should produce SQL for isNull', () => {
      const result = applyComparisonOp(col, 'isNull', null)
      expect(result).toBeDefined()
    })

    it('should produce SQL for isNotNull', () => {
      const result = applyComparisonOp(col, 'isNotNull', null)
      expect(result).toBeDefined()
    })

    it('should produce SQL for arrayContains', () => {
      const result = applyComparisonOp(col, 'arrayContains', ['a', 'b'])
      expect(result).toBeDefined()
    })

    it('should produce SQL for arrayOverlaps', () => {
      const result = applyComparisonOp(col, 'arrayOverlaps', ['a', 'b'])
      expect(result).toBeDefined()
    })

    it('should throw for unsupported operator', () => {
      expect(() => applyComparisonOp(col, 'unsupported' as any, 'val')).toThrow(
        /Unsupported comparison operator/,
      )
    })
  })

  // ── conditionToSQL ────────────────────────────────────────

  describe('conditionToSQL', () => {
    const relations = resolveStandardRelations()

    it('should handle a simple comparison condition (direct field)', () => {
      const cond: ComparisonCondition = {
        kind: 'comparison',
        field: makeDirectField('title', 'text', 'title'),
        op: 'eq',
        value: 'hello',
      }

      const result = conditionToSQL(cond, issues, relations)
      expect(result).toBeDefined()
    })

    it('should handle a belongs-to comparison condition', () => {
      const cond: ComparisonCondition = {
        kind: 'comparison',
        field: makeBelongsToField('status', 'option', 'status', 'name'),
        op: 'eq',
        value: 'open',
      }

      const result = conditionToSQL(cond, issues, relations)
      expect(result).toBeDefined()
    })

    it('should handle AND conditions', () => {
      const cond: Condition = {
        kind: 'and',
        conditions: [
          {
            kind: 'comparison',
            field: makeDirectField('title', 'text', 'title'),
            op: 'eq',
            value: 'hello',
          },
          {
            kind: 'comparison',
            field: makeDirectField('priority', 'number', 'priority'),
            op: 'gt',
            value: 5,
          },
        ],
      }

      const result = conditionToSQL(cond, issues, relations)
      expect(result).toBeDefined()
    })

    it('should handle OR conditions', () => {
      const cond: Condition = {
        kind: 'or',
        conditions: [
          {
            kind: 'comparison',
            field: makeDirectField('title', 'text', 'title'),
            op: 'ilike',
            value: '%bug%',
          },
          {
            kind: 'comparison',
            field: makeDirectField('title', 'text', 'title'),
            op: 'ilike',
            value: '%fix%',
          },
        ],
      }

      const result = conditionToSQL(cond, issues, relations)
      expect(result).toBeDefined()
    })

    it('should handle NOT conditions', () => {
      const cond: Condition = {
        kind: 'not',
        condition: {
          kind: 'comparison',
          field: makeDirectField('isArchived', 'boolean', 'isArchived'),
          op: 'eq',
          value: true,
        },
      }

      const result = conditionToSQL(cond, issues, relations)
      expect(result).toBeDefined()
    })

    it('should handle nested logical conditions', () => {
      const cond: Condition = {
        kind: 'and',
        conditions: [
          {
            kind: 'or',
            conditions: [
              {
                kind: 'comparison',
                field: makeDirectField('priority', 'number', 'priority'),
                op: 'eq',
                value: 1,
              },
              {
                kind: 'comparison',
                field: makeDirectField('priority', 'number', 'priority'),
                op: 'eq',
                value: 2,
              },
            ],
          },
          {
            kind: 'not',
            condition: {
              kind: 'comparison',
              field: makeDirectField('isArchived', 'boolean', 'isArchived'),
              op: 'eq',
              value: true,
            },
          },
        ],
      }

      const result = conditionToSQL(cond, issues, relations)
      expect(result).toBeDefined()
    })

    it('should route hasMany comparisons through existsSubquery', () => {
      const cond: ComparisonCondition = {
        kind: 'comparison',
        field: makeHasManyField('labels', 'multiOption', 'labels', 'name'),
        op: 'eq',
        value: 'bug',
      }

      const result = conditionToSQL(cond, issues, relations)
      expect(result).toBeDefined()
    })
  })

  // ── comparisonToSQL ───────────────────────────────────────

  describe('comparisonToSQL', () => {
    const relations = resolveStandardRelations()

    it('should resolve direct field and apply comparison', () => {
      const cond: ComparisonCondition = {
        kind: 'comparison',
        field: makeDirectField('title', 'text', 'title'),
        op: 'ilike',
        value: '%test%',
      }

      const result = comparisonToSQL(cond, issues, relations)
      expect(result).toBeDefined()
    })

    it('should resolve belongs-to field and apply comparison', () => {
      const cond: ComparisonCondition = {
        kind: 'comparison',
        field: makeBelongsToField('status', 'option', 'status', 'name'),
        op: 'in',
        value: ['open', 'in_progress'],
      }

      const result = comparisonToSQL(cond, issues, relations)
      expect(result).toBeDefined()
    })

    it('should generate EXISTS subquery for hasMany field', () => {
      const cond: ComparisonCondition = {
        kind: 'comparison',
        field: makeHasManyField('labels', 'multiOption', 'labels', 'name'),
        op: 'eq',
        value: 'bug',
      }

      const result = comparisonToSQL(cond, issues, relations)
      expect(result).toBeDefined()
    })
  })

  // ── existsSubquery ────────────────────────────────────────

  describe('existsSubquery', () => {
    const relations = resolveStandardRelations()

    it('should generate an EXISTS subquery for many-to-many eq', () => {
      const field = makeHasManyField('labels', 'multiOption', 'labels', 'name')
      const result = existsSubquery(field, 'eq', 'bug', issues, relations)
      expect(result).toBeDefined()
    })

    it('should generate an EXISTS subquery for many-to-many in', () => {
      const field = makeHasManyField('labels', 'multiOption', 'labels', 'name')
      const result = existsSubquery(
        field,
        'in',
        ['bug', 'feature'],
        issues,
        relations,
      )
      expect(result).toBeDefined()
    })

    it('should throw for non-hasMany field', () => {
      const field = makeDirectField('title', 'text', 'title')
      expect(() =>
        existsSubquery(field, 'eq', 'hello', issues, relations),
      ).toThrow(/existsSubquery called on non-hasMany field/)
    })

    it('should throw when relation is not many-to-many', () => {
      const field = makeHasManyField('status', 'option', 'status', 'name')
      expect(() =>
        existsSubquery(field, 'eq', 'open', issues, relations),
      ).toThrow(/must be a many-to-many relation/)
    })
  })

  // ── searchToSQL ───────────────────────────────────────────

  describe('searchToSQL', () => {
    const relations = resolveStandardRelations()

    it('should return null for empty query', () => {
      const search: SearchNode = {
        query: '',
        fields: [makeDirectField('title', 'text', 'title')],
        mode: 'contains',
      }
      expect(searchToSQL(search, issues, relations)).toBeNull()
    })

    it('should return null for whitespace-only query', () => {
      const search: SearchNode = {
        query: '   ',
        fields: [makeDirectField('title', 'text', 'title')],
        mode: 'contains',
      }
      expect(searchToSQL(search, issues, relations)).toBeNull()
    })

    it('should produce ILIKE conditions for contains mode with single field', () => {
      const search: SearchNode = {
        query: 'hello',
        fields: [makeDirectField('title', 'text', 'title')],
        mode: 'contains',
      }
      const result = searchToSQL(search, issues, relations)
      expect(result).toBeDefined()
      expect(result).not.toBeNull()
    })

    it('should produce OR of ILIKE conditions for multiple fields', () => {
      const search: SearchNode = {
        query: 'hello',
        fields: [
          makeDirectField('title', 'text', 'title'),
          makeDirectField('description', 'text', 'description'),
        ],
        mode: 'contains',
      }
      const result = searchToSQL(search, issues, relations)
      expect(result).toBeDefined()
      expect(result).not.toBeNull()
    })

    it('should handle belongs-to fields in contains mode', () => {
      const search: SearchNode = {
        query: 'open',
        fields: [makeBelongsToField('status', 'option', 'status', 'name')],
        mode: 'contains',
      }
      const result = searchToSQL(search, issues, relations)
      expect(result).toBeDefined()
    })

    it('should handle hasMany fields in contains mode via EXISTS', () => {
      const search: SearchNode = {
        query: 'bug',
        fields: [makeHasManyField('labels', 'multiOption', 'labels', 'name')],
        mode: 'contains',
      }
      const result = searchToSQL(search, issues, relations)
      expect(result).toBeDefined()
    })

    it('should produce tsvector/tsquery for fulltext mode', () => {
      const search: SearchNode = {
        query: 'hello world',
        fields: [
          makeDirectField('title', 'text', 'title'),
          makeDirectField('description', 'text', 'description'),
        ],
        mode: 'fulltext',
      }
      const result = searchToSQL(search, issues, relations)
      expect(result).toBeDefined()
    })

    it('should skip hasMany fields in fulltext mode', () => {
      const search: SearchNode = {
        query: 'hello',
        fields: [makeHasManyField('labels', 'multiOption', 'labels', 'name')],
        mode: 'fulltext',
      }
      // All fields are hasMany, so nothing left to search
      const result = searchToSQL(search, issues, relations)
      expect(result).toBeNull()
    })

    it('should return null when no fields yield conditions', () => {
      const search: SearchNode = {
        query: 'hello',
        fields: [],
        mode: 'contains',
      }
      const result = searchToSQL(search, issues, relations)
      expect(result).toBeNull()
    })

    it('should mix direct and hasMany fields in contains mode', () => {
      const search: SearchNode = {
        query: 'search term',
        fields: [
          makeDirectField('title', 'text', 'title'),
          makeHasManyField('labels', 'multiOption', 'labels', 'name'),
        ],
        mode: 'contains',
      }
      const result = searchToSQL(search, issues, relations)
      expect(result).toBeDefined()
    })
  })

  // ── sortToSQL ─────────────────────────────────────────────

  describe('sortToSQL', () => {
    const relations = resolveStandardRelations()

    it('should produce asc SQL for ascending sort', () => {
      const sorts: SortNode[] = [
        {
          field: makeDirectField('title', 'text', 'title'),
          direction: 'asc',
        },
      ]
      const result = sortToSQL(sorts, issues, relations)
      expect(result).toHaveLength(1)
      expect(result[0]).toBeDefined()
    })

    it('should produce desc SQL for descending sort', () => {
      const sorts: SortNode[] = [
        {
          field: makeDirectField('priority', 'number', 'priority'),
          direction: 'desc',
        },
      ]
      const result = sortToSQL(sorts, issues, relations)
      expect(result).toHaveLength(1)
    })

    it('should handle multiple sort rules', () => {
      const sorts: SortNode[] = [
        {
          field: makeDirectField('priority', 'number', 'priority'),
          direction: 'desc',
        },
        {
          field: makeDirectField('title', 'text', 'title'),
          direction: 'asc',
        },
      ]
      const result = sortToSQL(sorts, issues, relations)
      expect(result).toHaveLength(2)
    })

    it('should return empty array for empty sorts', () => {
      const result = sortToSQL([], issues, relations)
      expect(result).toEqual([])
    })

    it('should handle belongs-to field in sort', () => {
      const sorts: SortNode[] = [
        {
          field: makeBelongsToField('status', 'option', 'status', 'name'),
          direction: 'asc',
        },
      ]
      const result = sortToSQL(sorts, issues, relations)
      expect(result).toHaveLength(1)
    })
  })

  // ── collectRequiredJoins ──────────────────────────────────

  describe('collectRequiredJoins', () => {
    it('should collect belongs-to relations from WHERE conditions', () => {
      const ast: DataViewQueryAST = {
        where: {
          kind: 'comparison',
          field: makeBelongsToField('status', 'option', 'status', 'name'),
          op: 'eq',
          value: 'open',
        },
        orderBy: [],
        pagination: null,
        search: null,
      }

      const joins = new Set<string>()
      collectRequiredJoins(ast, joins)

      expect(joins.has('status')).toBe(true)
      expect(joins.size).toBe(1)
    })

    it('should collect belongs-to relations from ORDER BY', () => {
      const ast: DataViewQueryAST = {
        where: null,
        orderBy: [
          {
            field: makeBelongsToField('status', 'option', 'status', 'name'),
            direction: 'asc',
          },
        ],
        pagination: null,
        search: null,
      }

      const joins = new Set<string>()
      collectRequiredJoins(ast, joins)

      expect(joins.has('status')).toBe(true)
    })

    it('should collect belongs-to relations from search fields', () => {
      const ast: DataViewQueryAST = {
        where: null,
        orderBy: [],
        pagination: null,
        search: {
          query: 'test',
          fields: [makeBelongsToField('status', 'option', 'status', 'name')],
          mode: 'contains',
        },
      }

      const joins = new Set<string>()
      collectRequiredJoins(ast, joins)

      expect(joins.has('status')).toBe(true)
    })

    it('should NOT collect hasMany relations (they use EXISTS)', () => {
      const ast: DataViewQueryAST = {
        where: {
          kind: 'comparison',
          field: makeHasManyField('labels', 'multiOption', 'labels', 'name'),
          op: 'eq',
          value: 'bug',
        },
        orderBy: [],
        pagination: null,
        search: null,
      }

      const joins = new Set<string>()
      collectRequiredJoins(ast, joins)

      expect(joins.size).toBe(0)
    })

    it('should NOT collect direct field references', () => {
      const ast: DataViewQueryAST = {
        where: {
          kind: 'comparison',
          field: makeDirectField('title', 'text', 'title'),
          op: 'eq',
          value: 'hello',
        },
        orderBy: [],
        pagination: null,
        search: null,
      }

      const joins = new Set<string>()
      collectRequiredJoins(ast, joins)

      expect(joins.size).toBe(0)
    })

    it('should deduplicate joins from multiple sources', () => {
      const ast: DataViewQueryAST = {
        where: {
          kind: 'and',
          conditions: [
            {
              kind: 'comparison',
              field: makeBelongsToField('status', 'option', 'status', 'name'),
              op: 'eq',
              value: 'open',
            },
            {
              kind: 'comparison',
              field: makeBelongsToField('status', 'option', 'status', 'name'),
              op: 'neq',
              value: 'closed',
            },
          ],
        },
        orderBy: [
          {
            field: makeBelongsToField('status', 'option', 'status', 'name'),
            direction: 'asc',
          },
        ],
        pagination: null,
        search: null,
      }

      const joins = new Set<string>()
      collectRequiredJoins(ast, joins)

      // Should be deduplicated to just 'status'
      expect(joins.size).toBe(1)
      expect(joins.has('status')).toBe(true)
    })

    it('should collect multiple distinct relations', () => {
      const ast: DataViewQueryAST = {
        where: {
          kind: 'and',
          conditions: [
            {
              kind: 'comparison',
              field: makeBelongsToField('status', 'option', 'status', 'name'),
              op: 'eq',
              value: 'open',
            },
            {
              kind: 'comparison',
              field: makeBelongsToField(
                'assignee',
                'option',
                'assignee',
                'name',
              ),
              op: 'eq',
              value: 'Alice',
            },
          ],
        },
        orderBy: [],
        pagination: null,
        search: null,
      }

      const joins = new Set<string>()
      collectRequiredJoins(ast, joins)

      expect(joins.size).toBe(2)
      expect(joins.has('status')).toBe(true)
      expect(joins.has('assignee')).toBe(true)
    })

    it('should handle nested NOT conditions', () => {
      const ast: DataViewQueryAST = {
        where: {
          kind: 'not',
          condition: {
            kind: 'comparison',
            field: makeBelongsToField('status', 'option', 'status', 'name'),
            op: 'eq',
            value: 'closed',
          },
        },
        orderBy: [],
        pagination: null,
        search: null,
      }

      const joins = new Set<string>()
      collectRequiredJoins(ast, joins)

      expect(joins.has('status')).toBe(true)
    })

    it('should handle empty AST', () => {
      const ast: DataViewQueryAST = {
        where: null,
        orderBy: [],
        pagination: null,
        search: null,
      }

      const joins = new Set<string>()
      collectRequiredJoins(ast, joins)

      expect(joins.size).toBe(0)
    })
  })

  // ── applyDataView (integration) ───────────────────────────

  describe('applyDataView', () => {
    /**
     * Creates a mock Drizzle PgDatabase that captures the query structure
     * instead of executing against a real DB.
     */
    function createMockDb(mockData: any[] = [], mockCount = 0) {
      // Track what was called for assertions
      const calls: {
        select: any
        from: any
        joins: any[]
        where: any
        orderBy: any[]
        limit: any
        offset: any
      } = {
        select: null,
        from: null,
        joins: [],
        where: null,
        orderBy: [],
        limit: null,
        offset: null,
      }

      // Create a chainable query builder mock
      function createQueryChain(isCount = false) {
        const chain: any = {
          from(table: any) {
            if (isCount) {
              calls.from = table
            }
            return chain
          },
          innerJoin(table: any, on: any) {
            calls.joins.push({ table, on })
            return chain
          },
          where(condition: any) {
            calls.where = condition
            return chain
          },
          orderBy(...args: any[]) {
            calls.orderBy = args
            return chain
          },
          limit(n: any) {
            calls.limit = n
            return chain
          },
          offset(n: any) {
            calls.offset = n
            return chain
          },
          // biome-ignore lint/suspicious/noThenProperty: intentional thenable to mock Drizzle query chain
          then(resolve: any) {
            if (isCount) {
              resolve([{ count: mockCount }])
            } else {
              resolve(mockData)
            }
            return chain
          },
        }
        return chain
      }

      const db: any = {
        select(selectArgs?: any) {
          const isCount =
            selectArgs && Object.keys(selectArgs).includes('count')
          const chain = createQueryChain(isCount)
          calls.select = selectArgs
          return chain
        },
      }

      return { db, calls }
    }

    it('should execute and return data + totalCount', async () => {
      const mockRows = [
        { id: 1, title: 'Bug report' },
        { id: 2, title: 'Feature request' },
      ]
      const { db } = createMockDb(mockRows, 42)

      const { createColumnBuilder } = await import(
        '../core/columns/column-builder.js'
      )
      const c = createColumnBuilder<(typeof mockRows)[0]>()

      const titleCol = c
        .text()
        .id('title')
        .accessor((r) => r.title)
        .displayName('Title')
        .build()

      const result = await applyDataView(db, {
        table: issues,
        columns: [titleCol],
        view: { filters: [], sort: [] },
      })

      expect(result.data).toEqual(mockRows)
      expect(result.totalCount).toBe(42)
    })

    it('should handle offset pagination', async () => {
      const { db, calls } = createMockDb([], 100)
      const { createColumnBuilder } = await import(
        '../core/columns/column-builder.js'
      )
      const c = createColumnBuilder<{ id: number; title: string }>()
      const titleCol = c
        .text()
        .id('title')
        .accessor((r) => r.title)
        .displayName('Title')
        .build()

      await applyDataView(db, {
        table: issues,
        columns: [titleCol],
        view: { filters: [], sort: [] },
        pagination: { kind: 'offset', page: 3, pageSize: 25 },
      })

      // Page 3 with pageSize 25 → offset 50, limit 25
      expect(calls.limit).toBe(25)
      expect(calls.offset).toBe(50)
    })

    it('should handle cursor pagination', async () => {
      const { db, calls } = createMockDb([], 100)
      const { createColumnBuilder } = await import(
        '../core/columns/column-builder.js'
      )
      const c = createColumnBuilder<{ id: number; title: string }>()
      const titleCol = c
        .text()
        .id('title')
        .accessor((r) => r.title)
        .displayName('Title')
        .build()

      await applyDataView(db, {
        table: issues,
        columns: [titleCol],
        view: { filters: [], sort: [] },
        pagination: { kind: 'cursor', cursor: 'abc', limit: 10 },
      })

      // Cursor pagination: limit + 1 to detect hasNextPage
      expect(calls.limit).toBe(11)
    })

    it('should apply the transform hook', async () => {
      const { db } = createMockDb([], 0)
      const { createColumnBuilder } = await import(
        '../core/columns/column-builder.js'
      )
      const c = createColumnBuilder<{ id: number; title: string }>()
      const titleCol = c
        .text()
        .id('title')
        .accessor((r) => r.title)
        .displayName('Title')
        .build()

      let transformCalled = false
      let receivedAST: DataViewQueryAST | null = null

      await applyDataView(db, {
        table: issues,
        columns: [titleCol],
        view: { filters: [], sort: [] },
        transform: (ast) => {
          transformCalled = true
          receivedAST = ast
          // Add a soft-delete filter
          return {
            ...ast,
            where: ast.where
              ? {
                  kind: 'and',
                  conditions: [
                    ast.where,
                    {
                      kind: 'comparison',
                      field: makeDirectField(
                        'isArchived',
                        'boolean',
                        'isArchived',
                      ),
                      op: 'eq',
                      value: false,
                    },
                  ],
                }
              : {
                  kind: 'comparison',
                  field: makeDirectField('isArchived', 'boolean', 'isArchived'),
                  op: 'eq',
                  value: false,
                },
          }
        },
      })

      expect(transformCalled).toBe(true)
      expect(receivedAST).not.toBeNull()
    })

    it('should resolve belongs-to relations and add JOINs', async () => {
      const { db, calls } = createMockDb([], 0)
      const { createColumnBuilder } = await import(
        '../core/columns/column-builder.js'
      )
      const c = createColumnBuilder<{
        id: number
        title: string
        status: string
      }>()

      const statusCol = c
        .option()
        .id('status')
        .accessor((r) => r.status)
        .displayName('Status')
        .field('status.name')
        .build()

      await applyDataView(db, {
        table: issues,
        columns: [statusCol],
        view: {
          filters: [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is',
              values: ['open'],
            },
          ],
          sort: [],
        },
        relations: {
          status: statuses,
        },
      })

      // Should have added a JOIN for the status relation
      expect(calls.joins.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle many-to-many relations without adding JOINs', async () => {
      const { db, calls } = createMockDb([], 0)
      const { createColumnBuilder } = await import(
        '../core/columns/column-builder.js'
      )
      const c = createColumnBuilder<{
        id: number
        title: string
        labels: string[]
      }>()

      const labelsCol = c
        .multiOption()
        .id('labels')
        .accessor((r) => r.labels)
        .displayName('Labels')
        .field('labels.name')
        .build()

      await applyDataView(db, {
        table: issues,
        columns: [labelsCol],
        view: {
          filters: [
            {
              columnId: 'labels',
              type: 'multiOption',
              operator: 'include',
              values: ['bug'],
            },
          ],
          sort: [],
        },
        relations: {
          labels: { through: issueLabels, to: labels },
        },
      })

      // Many-to-many uses EXISTS, not JOINs — but the count query also
      // doesn't need a JOIN for hasMany. The join count should be 0 for
      // many-to-many relations (they use EXISTS subqueries).
      // Filter all joins for the labels table specifically
      const labelsJoins = calls.joins.filter((j: any) => j.table === labels)
      expect(labelsJoins).toHaveLength(0)
    })

    it('should handle empty view state', async () => {
      const { db } = createMockDb([{ id: 1, title: 'Test' }], 1)
      const { createColumnBuilder } = await import(
        '../core/columns/column-builder.js'
      )
      const c = createColumnBuilder<{ id: number; title: string }>()
      const titleCol = c
        .text()
        .id('title')
        .accessor((r) => r.title)
        .displayName('Title')
        .build()

      const result = await applyDataView(db, {
        table: issues,
        columns: [titleCol],
        view: { filters: [], sort: [] },
      })

      expect(result.data).toHaveLength(1)
      expect(result.totalCount).toBe(1)
    })
  })
})
