/**
 * Seed script for the server-side data-view example.
 * Usage: bun run scripts/seed.ts
 *
 * Populates the database with:
 * - 4 statuses
 * - 4 users
 * - 20 labels
 * - 500 issues (with random labels via pivot table)
 */

import { drizzle } from 'drizzle-orm/neon-http'
import { nanoid } from 'nanoid'
import * as schema from '../lib/db/schema'

const db = drizzle(process.env.DATABASE_URL!)

// ── Reference Data ──────────────────────────────────────────

const STATUSES = [
  { id: 'backlog', name: 'Backlog', order: 0 },
  { id: 'todo', name: 'Todo', order: 1 },
  { id: 'in-progress', name: 'In Progress', order: 2 },
  { id: 'done', name: 'Done', order: 3 },
]

const USERS = [
  {
    id: 'u1',
    name: 'John Smith',
    email: 'john@example.com',
    picture: '/avatars/john-smith.png',
  },
  {
    id: 'u2',
    name: 'Rose Eve',
    email: 'rose@example.com',
    picture: '/avatars/rose-eve.png',
  },
  {
    id: 'u3',
    name: 'Adam Young',
    email: 'adam@example.com',
    picture: '/avatars/adam-young.png',
  },
  {
    id: 'u4',
    name: 'Michael Scott',
    email: 'michael@example.com',
    picture: '/avatars/michael-scott.png',
  },
]

const LABELS = [
  { id: 'l1', name: 'Bug', color: 'red' },
  { id: 'l2', name: 'Enhancement', color: 'green' },
  { id: 'l3', name: 'Task', color: 'blue' },
  { id: 'l4', name: 'Urgent', color: 'pink' },
  { id: 'l5', name: 'Frontend', color: 'orange' },
  { id: 'l6', name: 'Backend', color: 'teal' },
  { id: 'l7', name: 'Performance', color: 'purple' },
  { id: 'l8', name: 'Documentation', color: 'amber' },
  { id: 'l9', name: 'Security', color: 'sky' },
  { id: 'l10', name: 'Testing', color: 'yellow' },
  { id: 'l11', name: 'Refactor', color: 'lime' },
  { id: 'l12', name: 'API', color: 'red' },
  { id: 'l13', name: 'Database', color: 'violet' },
  { id: 'l14', name: 'AI Model', color: 'cyan' },
  { id: 'l15', name: 'Infrastructure', color: 'emerald' },
  { id: 'l16', name: 'Accessibility', color: 'rose' },
  { id: 'l17', name: 'Monitoring', color: 'indigo' },
  { id: 'l18', name: 'Authentication', color: 'fuchsia' },
  { id: 'l19', name: 'Deployment', color: 'green' },
  { id: 'l20', name: 'Feature Request', color: 'orange' },
]

// ── Issue Generator ─────────────────────────────────────────

const VERBS = [
  'Fix',
  'Add',
  'Improve',
  'Refactor',
  'Update',
  'Remove',
  'Implement',
  'Optimize',
  'Redesign',
  'Revert',
]

const NOUNS = [
  'task sidebar',
  'project view',
  'keyboard shortcuts',
  'user permissions',
  'search performance',
  'issue modal',
  'auth flow',
  'API integration',
  'activity feed',
  'notifications',
  'team management',
  'board drag & drop',
  'custom workflows',
  'mobile responsiveness',
  'comment threading',
  'GitHub sync',
  'dark mode',
  'date picker',
  'status badges',
  'workspace settings',
]

const SUFFIXES = [
  'in Safari',
  'for enterprise customers',
  'on slow connections',
  'edge case in Firefox',
  'when duplicating issues',
  'for archived projects',
  'in mobile view',
  'on user onboarding',
  'when using keyboard nav',
  'for SSO users',
]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sample<T>(arr: readonly T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function generateTitle(): string {
  const verb = pick(VERBS)
  const noun = pick(NOUNS)
  const suffix = Math.random() < 0.5 ? '' : ` ${pick(SUFFIXES)}`
  return `${verb} ${noun}${suffix}`
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

// ── Seed ────────────────────────────────────────────────────

async function seed() {
  console.log('Seeding database...')

  // Clear existing data (order matters for FK constraints)
  console.log('  Clearing existing data...')
  await db.delete(schema.issueLabels)
  await db.delete(schema.issues)
  await db.delete(schema.labels)
  await db.delete(schema.users)
  await db.delete(schema.statuses)

  // Insert reference data
  console.log('  Inserting statuses...')
  await db.insert(schema.statuses).values(STATUSES)

  console.log('  Inserting users...')
  await db.insert(schema.users).values(USERS)

  console.log('  Inserting labels...')
  await db.insert(schema.labels).values(LABELS)

  // Generate issues
  const ISSUE_COUNT = 500
  console.log(`  Generating ${ISSUE_COUNT} issues...`)

  const issueRows: (typeof schema.issues.$inferInsert)[] = []
  const issueLabelRows: (typeof schema.issueLabels.$inferInsert)[] = []

  for (let i = 0; i < ISSUE_COUNT; i++) {
    const id = nanoid()
    const statusId = pick(STATUSES).id
    const assigneeId = Math.random() > 0.3 ? pick(USERS).id : null
    const estimatedHours = randomInt(1, 16)
    const startDate = statusId === 'backlog' ? null : daysAgo(randomInt(1, 90))
    const isUrgent = Math.random() > 0.85
    const priority = randomInt(0, 4)

    issueRows.push({
      id,
      title: generateTitle(),
      description:
        Math.random() > 0.5 ? `Description for issue ${i + 1}` : null,
      statusId,
      assigneeId,
      priority,
      estimatedHours,
      startDate,
      isUrgent,
      createdAt: daysAgo(randomInt(0, 120)),
    })

    // Assign 0-3 random labels
    const labelCount = randomInt(0, 3)
    if (labelCount > 0) {
      const selectedLabels = sample(LABELS, labelCount)
      for (const label of selectedLabels) {
        issueLabelRows.push({
          issueId: id,
          labelId: label.id,
        })
      }
    }
  }

  // Batch insert issues (Neon has query size limits, batch in groups)
  const BATCH_SIZE = 100
  for (let i = 0; i < issueRows.length; i += BATCH_SIZE) {
    const batch = issueRows.slice(i, i + BATCH_SIZE)
    await db.insert(schema.issues).values(batch)
    console.log(
      `  Inserted issues ${i + 1}-${Math.min(i + BATCH_SIZE, issueRows.length)}`,
    )
  }

  // Batch insert issue-label associations
  if (issueLabelRows.length > 0) {
    for (let i = 0; i < issueLabelRows.length; i += BATCH_SIZE) {
      const batch = issueLabelRows.slice(i, i + BATCH_SIZE)
      await db.insert(schema.issueLabels).values(batch)
    }
    console.log(`  Inserted ${issueLabelRows.length} issue-label associations`)
  }

  console.log('Done! Database seeded successfully.')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
