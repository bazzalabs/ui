'use server'

import { createColumnBuilder } from '@bazza-ui/data-view'
import { applyDataView } from '@bazza-ui/data-view/drizzle/pg'
import type { DataViewState } from '@bazza-ui/data-view/react'
import { eq, ilike, inArray, sql } from 'drizzle-orm'
import { db, schema } from '@/lib/db'
import type { Issue, IssueLabel, IssueStatus, User } from './types'

// ── Server-only column config ────────────────────────────────
// Minimal column definitions for the Drizzle adapter. Only id, type,
// and field mapping are needed — the adapter never renders options or icons.

const col = createColumnBuilder<Issue>()

const noop = () => undefined as any
const serverColumnsConfig = [
  col
    .text()
    .id('title')
    .displayName('Title')
    .accessor(noop)
    .field('title')
    .build(),
  col
    .option()
    .id('status')
    .displayName('Status')
    .accessor(noop)
    .field('status.id')
    .build(),
  col
    .option()
    .id('assignee')
    .displayName('Assignee')
    .accessor(noop)
    .field('assignee.id')
    .build(),
  col
    .multiOption()
    .id('labels')
    .displayName('Labels')
    .accessor(noop)
    .field('labels.id')
    .build(),
  col
    .number()
    .id('estimatedHours')
    .displayName('Est. Hours')
    .accessor(noop)
    .field('estimated_hours')
    .build(),
  col
    .date()
    .id('startDate')
    .displayName('Start Date')
    .accessor(noop)
    .field('start_date')
    .build(),
  col
    .boolean()
    .id('isUrgent')
    .displayName('Urgent')
    .accessor(noop)
    .field('is_urgent')
    .build(),
] as const

// ── Types ────────────────────────────────────────────────────

type FetchIssuesInput = {
  view: DataViewState
  page: number
  pageSize: number
  search?: string
}

type FetchIssuesResult = {
  data: Issue[]
  totalCount: number
  page: number
  pageSize: number
}

// ── Server Action ────────────────────────────────────────────

export async function fetchIssues(
  input: FetchIssuesInput,
): Promise<FetchIssuesResult> {
  const { view, page, pageSize, search } = input

  console.log(
    '[fetchIssues] input:',
    JSON.stringify({ view, page, pageSize, search }, null, 2),
  )

  // Quick sanity check: count all issues in the DB
  const [sanityCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.issues)
  console.log('[fetchIssues] total issues in DB:', sanityCount?.count)

  let result: { data: unknown[]; totalCount: number }

  try {
    result = await applyDataView(db as any, {
      table: schema.issues,
      columns: serverColumnsConfig,
      view,
      relations: {
        status: schema.statuses,
        assignee: schema.users,
        labels: { through: schema.issueLabels, to: schema.labels },
      },
      pagination: {
        kind: 'offset',
        page,
        pageSize,
      },
      search: search
        ? {
            query: search,
            columns: ['title'],
            mode: 'contains',
          }
        : undefined,
    })
  } catch (err) {
    console.error('[fetchIssues] applyDataView error:', err)
    return { data: [], totalCount: 0, page, pageSize }
  }

  console.log('[fetchIssues] result:', result)

  console.log('[fetchIssues] applyDataView result:', {
    dataLength: result.data.length,
    totalCount: result.totalCount,
    firstRow: result.data[0],
  })

  const rawResult = result.data as any[]

  if (rawResult.length === 0) {
    console.log(
      '[fetchIssues] no rows returned, totalCount:',
      result.totalCount,
    )
    return { data: [], totalCount: result.totalCount, page, pageSize }
  }

  // Inspect raw row shape
  console.log('[fetchIssues] raw row keys:', Object.keys(rawResult[0]))
  console.log(
    '[fetchIssues] raw row sample:',
    JSON.stringify(rawResult[0], null, 2),
  )

  // Normalize row shape: when applyDataView adds JOINs, Drizzle returns nested objects
  // like { issues: { id, title, ... }, statuses: { id, name, ... } }
  // Without JOINs, rows are flat: { id, title, statusId, ... }
  const rawRows = rawResult.map((row) => {
    // If the row has a nested 'issues' key, it's a joined result
    if (row.issues && typeof row.issues === 'object') {
      return row.issues
    }
    return row
  })

  console.log('[fetchIssues] normalized row keys:', Object.keys(rawRows[0]))

  // Step 2: Hydrate the results with related data
  // Note: Drizzle returns JS property names (camelCase), not DB column names (snake_case)
  const issueIds = rawRows.map((r: any) => r.id as string)
  const statusIds = [...new Set(rawRows.map((r: any) => r.statusId as string))]
  const assigneeIds = [
    ...new Set(
      rawRows.map((r: any) => r.assigneeId as string | null).filter(Boolean),
    ),
  ] as string[]

  const [statusRows, userRows, issueLabelRows] = await Promise.all([
    db
      .select()
      .from(schema.statuses)
      .where(inArray(schema.statuses.id, statusIds)),
    assigneeIds.length > 0
      ? db
          .select()
          .from(schema.users)
          .where(inArray(schema.users.id, assigneeIds))
      : Promise.resolve([]),
    db
      .select({
        issueId: schema.issueLabels.issueId,
        labelId: schema.issueLabels.labelId,
        labelName: schema.labels.name,
        labelColor: schema.labels.color,
      })
      .from(schema.issueLabels)
      .innerJoin(
        schema.labels,
        eq(schema.labels.id, schema.issueLabels.labelId),
      )
      .where(inArray(schema.issueLabels.issueId, issueIds)),
  ])

  console.log('[fetchIssues] hydration:', {
    statuses: statusRows.length,
    users: userRows.length,
    issueLabels: issueLabelRows.length,
  })

  // Build lookup maps
  const statusMap = new Map<string, IssueStatus>(
    statusRows.map((s) => [s.id, { id: s.id, name: s.name, order: s.order }]),
  )

  const userMap = new Map<string, User>(
    userRows.map((u) => [
      u.id,
      { id: u.id, name: u.name, email: u.email, picture: u.picture },
    ]),
  )

  const labelsByIssueId = new Map<string, IssueLabel[]>()
  for (const row of issueLabelRows) {
    const existing = labelsByIssueId.get(row.issueId) ?? []
    existing.push({
      id: row.labelId,
      name: row.labelName,
      color: row.labelColor,
    })
    labelsByIssueId.set(row.issueId, existing)
  }

  // Step 3: Assemble hydrated Issue objects
  // Drizzle uses JS names: statusId, assigneeId, estimatedHours, startDate, isUrgent, createdAt
  const data: Issue[] = rawRows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: statusMap.get(row.statusId) ?? {
      id: row.statusId,
      name: 'Unknown',
      order: 0,
    },
    assignee: row.assigneeId ? (userMap.get(row.assigneeId) ?? null) : null,
    labels: labelsByIssueId.get(row.id) ?? [],
    priority: row.priority,
    estimatedHours: row.estimatedHours,
    startDate: row.startDate,
    isUrgent: row.isUrgent,
    createdAt: row.createdAt,
  }))

  console.log('[fetchIssues] returning', data.length, 'hydrated issues')

  return {
    data,
    totalCount: result.totalCount,
    page,
    pageSize,
  }
}

// ── Option-fetching server actions ───────────────────────────
// Called by the client via React Query to populate async filter options.

export async function fetchStatuses(): Promise<{ id: string; name: string }[]> {
  return db
    .select({ id: schema.statuses.id, name: schema.statuses.name })
    .from(schema.statuses)
}

export async function fetchUsers(): Promise<{ id: string; name: string }[]> {
  return db
    .select({ id: schema.users.id, name: schema.users.name })
    .from(schema.users)
}

export async function fetchLabels(
  query?: string,
): Promise<{ id: string; name: string }[]> {
  const base = db
    .select({ id: schema.labels.id, name: schema.labels.name })
    .from(schema.labels)

  if (query) {
    return base.where(ilike(schema.labels.name, `%${query}%`))
  }

  return base
}
