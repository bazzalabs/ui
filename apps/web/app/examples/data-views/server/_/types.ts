import type { LucideIcon } from 'lucide-react'

declare module '@bazza-ui/data-view' {
  interface DataViewStateMeta {
    description?: string
    isPreset?: boolean
  }
}

/** Hydrated issue type — matches the shape returned by the server action. */
export type Issue = {
  id: string
  title: string
  description: string | null
  status: IssueStatus
  assignee: User | null
  labels: IssueLabel[]
  priority: number
  estimatedHours: number
  startDate: string | null
  isUrgent: boolean
  createdAt: string
}

export type User = {
  id: string
  name: string
  email: string
  picture: string | null
}

export type IssueLabel = {
  id: string
  name: string
  color: string
}

export type IssueStatus = {
  id: string
  name: string
  order: number
}

/** The icon mapping is kept client-side only (icons aren't serializable). */
export const STATUS_ICONS: Record<string, LucideIcon> = {}
