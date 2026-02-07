import { sub } from 'date-fns'
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { randomInteger, sample } from 'remeda'
import type { Issue, IssueLabel, IssueStatus, User } from './types'

// ── Static Reference Data ──────────────────────────────────

export const USERS: User[] = [
  { id: 'u1', name: 'John Smith', picture: '/avatars/john-smith.png' },
  { id: 'u2', name: 'Rose Eve', picture: '/avatars/rose-eve.png' },
  { id: 'u3', name: 'Adam Young', picture: '/avatars/adam-young.png' },
  { id: 'u4', name: 'Michael Scott', picture: '/avatars/michael-scott.png' },
]

export const ISSUE_STATUSES: IssueStatus[] = [
  { id: 'backlog', name: 'Backlog', icon: CircleDashedIcon },
  { id: 'todo', name: 'Todo', icon: CircleIcon },
  { id: 'in-progress', name: 'In Progress', icon: CircleDotIcon },
  { id: 'done', name: 'Done', icon: CircleCheckIcon },
]

export const ISSUE_LABELS: IssueLabel[] = [
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

/** Lookup table for label id -> IssueLabel. */
export const LABELS_BY_ID = new Map(ISSUE_LABELS.map((l) => [l.id, l]))

// ── Issue Title Generator ──────────────────────────────────

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

function generateIssueTitle(): string {
  const verb = pick(VERBS)
  const noun = pick(NOUNS)
  const suffix = Math.random() < 0.5 ? '' : ` ${pick(SUFFIXES)}`
  return `${verb} ${noun}${suffix}`
}

// ── Issue Generator ────────────────────────────────────────

function generateIssue(): Issue {
  const status = pick(ISSUE_STATUSES)
  const assignee = Math.random() > 0.3 ? pick(USERS) : undefined
  const labelCount = randomInteger(0, 2)
  const labels =
    labelCount > 0
      ? (sample(ISSUE_LABELS, labelCount) as IssueLabel[])
      : undefined
  const estimatedHours = randomInteger(1, 16)
  const startDate =
    status.id === 'backlog'
      ? undefined
      : sub(new Date(), { days: randomInteger(1, 90) })
  const isUrgent = Math.random() > 0.85

  return {
    id: nanoid(),
    title: generateIssueTitle(),
    status,
    labels,
    assignee,
    estimatedHours,
    startDate,
    isUrgent,
  }
}

export function generateIssues(count: number): Issue[] {
  const arr: Issue[] = []
  for (let i = 0; i < count; i++) {
    arr.push(generateIssue())
  }
  return arr
}

/** Default dataset: 30k rows. */
export const ISSUES = generateIssues(30_000)
