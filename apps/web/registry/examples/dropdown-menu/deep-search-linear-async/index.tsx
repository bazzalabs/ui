'use client'

import type { NodeDef } from '@bazza-ui/react'
import { createVanillaStaticLoader } from '@bazza-ui/react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { DiamondSpinner, DropdownMenu } from '@/registry/ui/dropdown-menu'
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
async function fetchLabels(): Promise<NodeDef[]> {
  console.log('fetching labels!')
  await new Promise((resolve) => setTimeout(resolve, 800))

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

  return labelData.map((label) =>
    createLabelItemNode(label.id, label.name, label.color),
  )
}

/** Simulates fetching assignees from an API */
async function fetchAssignees(): Promise<NodeDef[]> {
  await new Promise((resolve) => setTimeout(resolve, 600))

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

  return assigneeData.map((assignee) =>
    createAssigneeItemNode(assignee.id, assignee.name, assignee.username),
  )
}

/** Simulates fetching project labels from an API */
async function fetchProjectLabels(): Promise<NodeDef[]> {
  await new Promise((resolve) => setTimeout(resolve, 500))

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

  return projectLabelData.map((label) =>
    createLabelItemNode(label.id, label.name, label.color),
  )
}

/** Simulates fetching project leads from an API */
async function fetchProjectLeads(): Promise<NodeDef[]> {
  await new Promise((resolve) => setTimeout(resolve, 700))

  const projectLeadData = [
    { id: '@kianbazza', name: 'Kian Bazza', username: 'kianbazza' },
    { id: '@shadcn', name: 'shadcn', username: 'shadcn' },
    { id: '@rauchg', name: 'Guillermo Rauch', username: 'rauchg' },
    { id: '@t3dotgg', name: 'Theo Browne', username: 't3dotgg' },
  ]

  return projectLeadData.map((lead) =>
    createAssigneeItemNode(lead.id, lead.name, lead.username),
  )
}

// =============================================================================
// Async Loaders (using vanilla adapter - no TanStack Query needed for demo)
// =============================================================================

const labelsLoader = createVanillaStaticLoader({
  fetcher: fetchLabels,
})

const assigneesLoader = createVanillaStaticLoader({
  fetcher: fetchAssignees,
})

const projectLabelsLoader = createVanillaStaticLoader({
  fetcher: fetchProjectLabels,
})

const projectLeadsLoader = createVanillaStaticLoader({
  fetcher: fetchProjectLeads,
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
    {
      ...assigneesLoader,
      loadStrategy: 'lazy', // Pre-load for deep search
      includeInDeepSearch: true,
    },
    { inputPlaceholder: 'Assignee...' },
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
    {
      ...labelsLoader,
      loadStrategy: 'lazy', // Pre-load for deep search
      includeInDeepSearch: true,
    },
    { inputPlaceholder: 'Labels...' },
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
    {
      ...projectLabelsLoader,
      loadStrategy: 'lazy',
      includeInDeepSearch: true,
    },
    { inputPlaceholder: 'Project labels...' },
  )

  // Project Properties > Project Lead submenu (ASYNC)
  const projectLeadMenu = createAsyncSubmenuNode(
    'project-lead',
    'Project lead',
    <ProjectLeadIcon />,
    {
      ...projectLeadsLoader,
      loadStrategy: 'lazy',
      includeInDeepSearch: true,
    },
    { inputPlaceholder: 'Project lead...' },
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
    { inputPlaceholder: 'Project properties...' },
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

export default function DropdownMenuDeepSearchLinearAsync() {
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
            <DropdownMenu.DataSurface
              content={content}
              deepSearch={{ enabled: true, minLength: 2 }}
            >
              <DropdownMenu.DataInput placeholder="Search all..." />
              <DropdownMenu.DataList>
                {({ nodes, renderNode, isDeepSearching, count, async }) => (
                  <>
                    {isDeepSearching && (
                      <div className="px-4 py-1.5 text-xs text-muted-foreground border-b border-border bg-muted/30 -mt-1 mb-1">
                        {async.isLoading
                          ? 'Searching all menus...'
                          : `Found ${count} results`}
                      </div>
                    )}
                    {/* Show DiamondSpinner while loading during deep search, Empty when no results */}
                    {isDeepSearching && async.isLoading ? (
                      <div className="flex items-center justify-center py-6 text-muted-foreground">
                        <DiamondSpinner className="size-5" />
                      </div>
                    ) : (
                      count === 0 && <DropdownMenu.Empty />
                    )}
                    {nodes.map((node) => renderNode(node))}
                  </>
                )}
              </DropdownMenu.DataList>
            </DropdownMenu.DataSurface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
