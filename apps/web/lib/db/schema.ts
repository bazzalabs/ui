import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// ── Reference Tables ────────────────────────────────────────

export const statuses = pgTable('statuses', {
  id: text('id').primaryKey(), // e.g. 'backlog', 'todo', 'in-progress', 'done'
  name: text('name').notNull(),
  order: integer('order').notNull().default(0),
})

export const users = pgTable('users', {
  id: text('id').primaryKey(), // e.g. 'u1', 'u2', ...
  name: text('name').notNull(),
  email: text('email').notNull(),
  picture: text('picture'),
})

export const labels = pgTable('labels', {
  id: text('id').primaryKey(), // e.g. 'l1', 'l2', ...
  name: text('name').notNull(),
  color: text('color').notNull(),
})

// ── Issues Table ────────────────────────────────────────────

export const issues = pgTable('issues', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  statusId: text('status_id')
    .notNull()
    .references(() => statuses.id),
  assigneeId: text('assignee_id').references(() => users.id),
  priority: integer('priority').notNull().default(0),
  estimatedHours: integer('estimated_hours').notNull().default(0),
  startDate: timestamp('start_date', { mode: 'string' }),
  isUrgent: boolean('is_urgent').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
})

// ── Pivot Table (Issues ↔ Labels, many-to-many) ─────────────

export const issueLabels = pgTable('issue_labels', {
  issueId: text('issue_id')
    .notNull()
    .references(() => issues.id, { onDelete: 'cascade' }),
  labelId: text('label_id')
    .notNull()
    .references(() => labels.id, { onDelete: 'cascade' }),
})
