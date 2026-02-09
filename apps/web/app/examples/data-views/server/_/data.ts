import type { LucideIcon } from 'lucide-react'
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
} from 'lucide-react'

// ── Status icon mapping (client-side only, icons aren't serializable) ──

export const STATUS_ICON_MAP: Record<string, LucideIcon> = {
  backlog: CircleDashedIcon,
  todo: CircleIcon,
  'in-progress': CircleDotIcon,
  done: CircleCheckIcon,
}

// ── Static option lists for the column builder (known ahead of time) ──

export const ISSUE_STATUSES = [
  { id: 'backlog', name: 'Backlog' },
  { id: 'todo', name: 'Todo' },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'done', name: 'Done' },
] as const

export const USERS = [
  { id: 'u1', name: 'John Smith' },
  { id: 'u2', name: 'Rose Eve' },
  { id: 'u3', name: 'Adam Young' },
  { id: 'u4', name: 'Michael Scott' },
] as const

export const ISSUE_LABELS = [
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
] as const

export const LABELS_BY_ID = new Map(
  ISSUE_LABELS.map((l) => [l.id as string, l] as const),
)
