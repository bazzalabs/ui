import type { LucideIcon } from 'lucide-react'

// ── Module augmentation ────────────────────────────────────
// Extends DataViewState.meta with app-specific fields so that
// a DataViewState *is* a saved view — no wrapper type needed.

declare module '@bazza-ui/data-view' {
  interface DataViewStateMeta {
    /** Optional description of what this view shows. */
    description?: string
    /** Whether this is a built-in preset (cannot be edited or deleted). */
    isPreset?: boolean
  }
}

// ── Domain Types ───────────────────────────────────────────

export type Issue = {
  id: string
  title: string
  description?: string
  status: IssueStatus
  labels?: IssueLabel[]
  assignee?: User
  estimatedHours: number
  startDate?: Date
  isUrgent: boolean
}

export type User = {
  id: string
  name: string
  picture: string
}

export type IssueLabel = {
  id: string
  name: string
  color: string
}

export type IssueStatus = {
  id: 'backlog' | 'todo' | 'in-progress' | 'done'
  name: string
  icon: LucideIcon
}
