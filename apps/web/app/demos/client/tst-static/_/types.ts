import type { LucideIcon } from 'lucide-react'

export type Issue = {
  id: string
  title: string
  description?: string
  status: IssueStatus
  labels?: IssueLabel[]
  assignee?: User
  startDate?: Date
  endDate?: Date
  /** Estimated time in hours (supports duration unit parsing like "1hr", "30min") */
  estimatedHours?: number
  /** Priority score (1-100, plain number without units) */
  priority: number
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
  order: number
  icon: LucideIcon
}
