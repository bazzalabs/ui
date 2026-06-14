'use client'

import { createQueryLoader, createStaticLoader } from '@bazza-ui/react/adapters'
import type { NodeDef } from '@bazza-ui/react/dropdown-menu'
import { useQuery } from '@tanstack/react-query'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import {
  createAssigneeItemNode,
  createAsyncSubmenuNode,
  createItemNode,
  createLabelItemNode,
  createSubmenuNode,
  FilterIcon,
} from './components'
import {
  AssigneeIcon,
  LabelsIcon,
  ProjectLeadIcon,
  ProjectPriority,
  ProjectPriorityIcon,
  ProjectPropertiesIcon,
  ProjectStatus,
  ProjectStatusIcon,
  ProjectStatusType,
  ProjectStatusTypeIcon,
  Status,
  StatusIcon,
} from './icons'

// =============================================================================
// Simulated API Functions (with artificial delays)
// =============================================================================

/** Simulates fetching labels from an API */
async function fetchLabels(query?: string): Promise<NodeDef[]> {
  const normalizedQuery = query?.trim().toLowerCase()

  console.log('fetching labels', query ? `for query "${query}"` : '', '...')
  await new Promise((resolve) => setTimeout(resolve, 3000))

  console.log('labels fetched!')

  const labelData = [
    { id: 'bug', name: 'Bug', color: 'red' },
    { id: 'enhancement', name: 'Enhancement', color: 'green' },
    { id: 'task', name: 'Task', color: 'blue' },
    { id: 'urgent', name: 'Urgent', color: 'pink' },
    { id: 'low-priority', name: 'Low Priority', color: 'lime' },
    { id: 'frontend', name: 'Frontend', color: 'orange' },
    { id: 'backend', name: 'Backend', color: 'teal' },
    { id: 'database', name: 'Database', color: 'violet' },
    { id: 'api', name: 'API', color: 'red' },
    { id: 'ai-model', name: 'AI Model', color: 'cyan' },
    { id: 'data-pipeline', name: 'Data Pipeline', color: 'amber' },
    { id: 'inference', name: 'Inference', color: 'emerald' },
    { id: 'ai-integration', name: 'AI Integration', color: 'purple' },
    { id: 'ethics', name: 'Ethics', color: 'fuchsia' },
    { id: 'refactor', name: 'Refactor', color: 'lime' },
    { id: 'performance', name: 'Performance', color: 'red' },
    { id: 'security', name: 'Security', color: 'sky' },
    { id: 'testing', name: 'Testing', color: 'yellow' },
    { id: 'documentation', name: 'Documentation', color: 'rose' },
    { id: 'in-progress', name: 'In Progress', color: 'green' },
    { id: 'blocked', name: 'Blocked', color: 'indigo' },
    { id: 'needs-review', name: 'Needs Review', color: 'orange' },
    { id: 'done', name: 'Done', color: 'teal' },
    { id: 'ui', name: 'UI', color: 'red' },
    { id: 'ux', name: 'UX', color: 'sky' },
    { id: 'accessibility', name: 'Accessibility', color: 'red' },
    { id: 'deployment', name: 'Deployment', color: 'emerald' },
    { id: 'infrastructure', name: 'Infrastructure', color: 'purple' },
    { id: 'monitoring', name: 'Monitoring', color: 'pink' },
    { id: 'real-time', name: 'Real-Time', color: 'lime' },
  ]

  const filtered = normalizedQuery
    ? labelData.filter((label) =>
        label.name.toLowerCase().includes(normalizedQuery),
      )
    : labelData

  return filtered.map((label) =>
    createLabelItemNode(label.id, label.name, label.color),
  )
}

/** Simulates fetching assignees from an API */
async function fetchAssignees(query?: string): Promise<NodeDef[]> {
  const normalizedQuery = query?.trim().toLowerCase()

  console.log(
    'fetching assignees',
    normalizedQuery ? `for ${normalizedQuery}` : '',
    '...',
  )

  await new Promise((resolve) => setTimeout(resolve, 600))

  console.log('fetched assignees!')

  const assigneeData = [
    { id: '@kianbazza', name: 'Kian Bazza', username: 'kianbazza' },
    { id: '@shadcn', name: 'shadcn', username: 'shadcn' },
    { id: '@rauchg', name: 'Guillermo Rauch', username: 'rauchg' },
    { id: '@t3dotgg', name: 'Theo Browne', username: 't3dotgg' },
    { id: '@leerob', name: 'Lee Robinson', username: 'leerob' },
    { id: '@delba', name: 'Delba de Oliveira', username: 'delbaoliveira' },
    { id: '@shuding', name: 'Shu Ding', username: 'shuding' },
    { id: '@jaredpalmer', name: 'Jared Palmer', username: 'jaredpalmer' },
  ]

  const filtered = normalizedQuery
    ? assigneeData.filter((assignee) =>
        [assignee.name, assignee.username]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : assigneeData

  return filtered.map((assignee) =>
    createAssigneeItemNode(assignee.id, assignee.name, assignee.username),
  )
}

/** Simulates fetching project labels from an API */
async function fetchProjectLabels(query?: string): Promise<NodeDef[]> {
  const normalizedQuery = query?.trim().toLowerCase()

  console.log('fetching project labels...')

  await new Promise((resolve) => setTimeout(resolve, 500))

  console.log('fetched project labels!')

  const projectLabelData = [
    { id: 'pl-1', name: 'Strategic Initiative', color: 'purple' },
    { id: 'pl-2', name: 'Customer Facing', color: 'blue' },
    { id: 'pl-3', name: 'Internal Tooling', color: 'teal' },
    { id: 'pl-4', name: 'Technical Debt', color: 'orange' },
    { id: 'pl-5', name: 'Revenue Impact', color: 'green' },
    { id: 'pl-6', name: 'Cost Reduction', color: 'emerald' },
    { id: 'pl-7', name: 'Compliance', color: 'red' },
    { id: 'pl-8', name: 'Platform', color: 'indigo' },
    { id: 'pl-9', name: 'Infrastructure', color: 'violet' },
    { id: 'pl-10', name: 'Growth', color: 'lime' },
    { id: 'pl-11', name: 'Maintenance', color: 'amber' },
    { id: 'pl-12', name: 'Research', color: 'cyan' },
    { id: 'pl-13', name: 'Partnership', color: 'pink' },
    { id: 'pl-14', name: 'Migration', color: 'sky' },
    { id: 'pl-15', name: 'Deprecation', color: 'rose' },
  ]

  const filtered = normalizedQuery
    ? projectLabelData.filter((label) =>
        label.name.toLowerCase().includes(normalizedQuery),
      )
    : projectLabelData

  return filtered.map((label) =>
    createLabelItemNode(label.id, label.name, label.color),
  )
}

/** Simulates fetching project leads from an API */
async function fetchProjectLeads(query?: string): Promise<NodeDef[]> {
  const normalizedQuery = query?.trim().toLowerCase()

  console.log('fetching project leads...')

  await new Promise((resolve) => setTimeout(resolve, 700))

  console.log('fetched project leads!')

  const projectLeadData = [
    { id: '@kianbazza', name: 'Kian Bazza', username: 'kianbazza' },
    { id: '@shadcn', name: 'shadcn', username: 'shadcn' },
    { id: '@rauchg', name: 'Guillermo Rauch', username: 'rauchg' },
    { id: '@t3dotgg', name: 'Theo Browne', username: 't3dotgg' },
  ]

  const filtered = normalizedQuery
    ? projectLeadData.filter((user) =>
        [user.name, user.username]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : projectLeadData

  return filtered.map((lead) =>
    createAssigneeItemNode(lead.id, lead.name, lead.username),
  )
}

// =============================================================================
// Async Loaders (using TanStack Query adapter)
// =============================================================================

const labelsLoader = createQueryLoader({
  useQuery: (query, options) =>
    useQuery({
      queryKey: ['deep-search-linear-async-tanstack', 'labels', query],
      queryFn: () => fetchLabels(query),
      ...options,
    }),
})

const assigneesLoader = createQueryLoader({
  useQuery: (query, options) =>
    useQuery({
      queryKey: ['deep-search-linear-async-tanstack', 'assignees', query],
      queryFn: () => fetchAssignees(query),
      ...options,
    }),
})

const projectLabelsLoader = createQueryLoader({
  useQuery: (query, options) =>
    useQuery({
      queryKey: ['deep-search-linear-async-tanstack', 'project-labels', query],
      queryFn: () => fetchProjectLabels(query),
      ...options,
    }),
})

const projectLeadsLoader = createQueryLoader({
  useQuery: (query, options) =>
    useQuery({
      queryKey: ['deep-search-linear-async-tanstack', 'project-leads'],
      queryFn: () => fetchProjectLeads(query),
      ...options,
    }),
})

// =============================================================================
// Menu Definitions
// =============================================================================

function buildMenuContent(): NodeDef[] {
  // Status submenu (SYNC - fast static data)
  const statusMenu = createSubmenuNode(
    'status',
    'Status',
    <StatusIcon />,
    [
      createItemNode('icebox', 'Icebox', <Status.Icebox />),
      createItemNode('backlog', 'Backlog', <Status.Backlog />),
      createItemNode('todo', 'Todo', <Status.Todo />),
      createItemNode('in-progress', 'In Progress', <Status.InProgress />),
      createItemNode('done', 'Done', <Status.Done />),
    ],
    { inputPlaceholder: 'Status...' },
  )

  // Assignee submenu (ASYNC - fetched from API)
  const assigneeMenu = createAsyncSubmenuNode(
    'assignee',
    'Assignee',
    <AssigneeIcon />,
    assigneesLoader,
    { inputPlaceholder: 'Assignee...', includeInDeepSearch: true },
  )

  // Priority submenu (SYNC - fast static data)
  const priorityMenu = createSubmenuNode(
    'priority',
    'Priority',
    <ProjectPriorityIcon />,
    [
      createItemNode(
        'no-priority',
        'No priority',
        <ProjectPriority.NoPriority />,
      ),
      createItemNode('urgent', 'Urgent', <ProjectPriority.Urgent />),
      createItemNode('high', 'High', <ProjectPriority.High />),
      createItemNode('medium', 'Medium', <ProjectPriority.Medium />),
      createItemNode('low', 'Low', <ProjectPriority.Low />),
    ],
    { inputPlaceholder: 'Priority...' },
  )

  // Labels submenu (ASYNC - fetched from API)
  const labelsMenu = createAsyncSubmenuNode(
    'labels',
    'Labels',
    <LabelsIcon />,
    labelsLoader,
    { inputPlaceholder: 'Labels...', includeInDeepSearch: true },
  )

  // Project Properties > Project Status submenu (SYNC)
  const projectStatusMenu = createSubmenuNode(
    'project-status',
    'Project status',
    <ProjectStatusIcon />,
    [
      createItemNode('failed', 'Failed', <ProjectStatus.Failed />),
      createItemNode('backlog', 'Backlog', <ProjectStatus.Backlog />),
      createItemNode('planned', 'Planned', <ProjectStatus.Planned />),
      createItemNode(
        'in-progress',
        'In Progress',
        <ProjectStatus.InProgress />,
      ),
      createItemNode('completed', 'Completed', <ProjectStatus.Completed />),
      createItemNode('canceled', 'Canceled', <ProjectStatus.Canceled />),
    ],
    { inputPlaceholder: 'Project status...', hideInputUntilActive: true },
  )

  // Project Properties > Project Status Type submenu (SYNC)
  const projectStatusTypeMenu = createSubmenuNode(
    'project-status-type',
    'Project status type',
    <ProjectStatusTypeIcon />,
    [
      createItemNode('backlog', 'Backlog', <ProjectStatusType.Backlog />),
      createItemNode('planned', 'Planned', <ProjectStatusType.Planned />),
      createItemNode(
        'in-progress',
        'In Progress',
        <ProjectStatusType.InProgress />,
      ),
      createItemNode('completed', 'Completed', <ProjectStatusType.Completed />),
      createItemNode('canceled', 'Canceled', <ProjectStatusType.Canceled />),
    ],
    { inputPlaceholder: 'Project status type...' },
  )

  // Project Properties > Project Priority submenu (SYNC)
  const projectPriorityMenu = createSubmenuNode(
    'project-priority',
    'Project priority',
    <ProjectPriorityIcon />,
    [
      createItemNode(
        'no-priority',
        'No priority',
        <ProjectPriority.NoPriority />,
      ),
      createItemNode('urgent', 'Urgent', <ProjectPriority.Urgent />),
      createItemNode('high', 'High', <ProjectPriority.High />),
      createItemNode('medium', 'Medium', <ProjectPriority.Medium />),
      createItemNode('low', 'Low', <ProjectPriority.Low />),
    ],
    { inputPlaceholder: 'Project priority...' },
  )

  // Project Properties > Project Labels submenu (ASYNC)
  const projectLabelsMenu = createAsyncSubmenuNode(
    'project-labels',
    'Project labels',
    <LabelsIcon />,
    projectLabelsLoader,
    { inputPlaceholder: 'Project labels...', includeInDeepSearch: true },
  )

  // Project Properties > Project Lead submenu (ASYNC)
  const projectLeadMenu = createAsyncSubmenuNode(
    'project-lead',
    'Project lead',
    <ProjectLeadIcon />,
    projectLeadsLoader,
    { inputPlaceholder: 'Project lead...', includeInDeepSearch: true },
  )

  // Project Properties submenu (nested - contains mix of sync and async)
  const projectPropertiesMenu = createSubmenuNode(
    'project-properties',
    'Project properties',
    <ProjectPropertiesIcon />,
    [
      projectStatusMenu,
      projectStatusTypeMenu,
      projectPriorityMenu,
      projectLabelsMenu,
      projectLeadMenu,
    ],
    { inputPlaceholder: 'Project properties...', includeInDeepSearch: false },
  )

  return [
    statusMenu,
    assigneeMenu,
    priorityMenu,
    labelsMenu,
    projectPropertiesMenu,
  ]
}

// =============================================================================
// Main Component
// =============================================================================

export default function DropdownMenuDeepSearchLinearAsyncTanstack() {
  const content = React.useMemo(() => buildMenuContent(), [])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="ghost" size="sm" />}>
        <FilterIcon />
        Filter
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface
              content={content}
              deepSearch={{
                enabled: true,
                minLength: 2,
                asyncResultBehavior: 'block',
              }}
            >
              <DropdownMenu.Input placeholder="Search all..." />
              <DropdownMenu.List virtualized />
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
