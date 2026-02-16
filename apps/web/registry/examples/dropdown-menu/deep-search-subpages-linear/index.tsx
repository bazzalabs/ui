'use client'

import type {
  DisplayNode,
  NodeDef,
  SubmenuDef,
  SubmenuRenderParams,
} from '@bazza-ui/react/dropdown-menu'
import { PlusIcon } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu, LabelWithBreadcrumbs } from '@/registry/ui/dropdown-menu'
import {
  createAssigneeItemNode,
  createItemNode,
  createLabelItemNode,
  createSubmenuNode,
  FilterIcon,
  LabelDot,
  type TW_COLOR,
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

interface LabelData {
  id: string
  name: string
  color: TW_COLOR
}

const CREATE_LABEL_SUBPAGE_ID = 'labels-create-color'
const CREATE_LABEL_TRIGGER_ID = 'labels-create-new'

const CREATE_LABEL_COLOR_OPTIONS: Array<{ label: string; value: TW_COLOR }> = [
  { label: 'Red', value: 'red' },
  { label: 'Orange', value: 'orange' },
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
  { label: 'Violet', value: 'violet' },
  { label: 'Pink', value: 'pink' },
]

const INITIAL_LABELS: LabelData[] = [
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

const PROJECT_LABELS: LabelData[] = [
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

const ASSIGNEES = [
  { id: '@kianbazza', name: 'Kian Bazza', username: 'kianbazza' },
  { id: '@shadcn', name: 'shadcn', username: 'shadcn' },
  { id: '@rauchg', name: 'Guillermo Rauch', username: 'rauchg' },
  { id: '@t3dotgg', name: 'Theo Browne', username: 't3dotgg' },
]

function normalizeLabelName(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

function getUniqueLabelId(name: string, existingLabels: LabelData[]): string {
  const baseId =
    normalizeLabelName(name)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'label'

  const usedIds = new Set(existingLabels.map((label) => label.id))
  if (!usedIds.has(baseId)) {
    return baseId
  }

  let index = 2
  let candidate = `${baseId}-${index}`

  while (usedIds.has(candidate)) {
    index += 1
    candidate = `${baseId}-${index}`
  }

  return candidate
}

function hasExactLabelMatch(nodes: DisplayNode[], query: string): boolean {
  const normalizedQuery = normalizeLabelName(query)
  if (!normalizedQuery) {
    return false
  }

  return nodes.some((node) => {
    if (!('node' in node)) {
      return false
    }

    return normalizeLabelName(node.node.value) === normalizedQuery
  })
}

function createCreatableLabelsSubmenuNode({
  labelNodes,
  pendingLabelName,
  onCreateLabelIntent,
  onChooseLabelColor,
}: {
  labelNodes: NodeDef[]
  pendingLabelName: string
  onCreateLabelIntent: (query: string) => void
  onChooseLabelColor: (color: TW_COLOR) => void
}): SubmenuDef {
  return {
    kind: 'submenu',
    id: 'labels',
    value: 'Labels',
    deepSearch: true,
    includeInDeepSearch: true,
    nodes: labelNodes,
    render: ({ props, context, nodes }: SubmenuRenderParams) => {
      const trimmedPendingLabelName = pendingLabelName.trim()
      const hasPendingLabelName = trimmedPendingLabelName.length > 0

      return (
        <DropdownMenu.Submenu>
          <DropdownMenu.SubmenuTrigger {...props}>
            <div className="flex items-center gap-2">
              <DropdownMenu.Icon>
                <LabelsIcon />
              </DropdownMenu.Icon>
              <LabelWithBreadcrumbs
                label="Labels"
                breadcrumbs={
                  context.isDeepSearchResult ? context.breadcrumbs : undefined
                }
              />
            </div>
          </DropdownMenu.SubmenuTrigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Positioner>
              <DropdownMenu.Popup>
                <DropdownMenu.Subpage pageId={CREATE_LABEL_SUBPAGE_ID}>
                  <DropdownMenu.Surface>
                    <div className="px-4 pt-2 pb-1 text-xs text-muted-foreground">
                      {hasPendingLabelName
                        ? `Pick a color for "${trimmedPendingLabelName}".`
                        : 'Pick a color for your new label.'}
                    </div>
                    <DropdownMenu.List>
                      <DropdownMenu.SubpageBackItem value="Back to labels">
                        Back to labels
                      </DropdownMenu.SubpageBackItem>
                      <DropdownMenu.Separator />
                      {CREATE_LABEL_COLOR_OPTIONS.map((option) => (
                        <DropdownMenu.SubpageBackItem
                          key={option.value}
                          value={`${option.label} label color`}
                          keywords={[option.label, trimmedPendingLabelName]}
                          disabled={!hasPendingLabelName}
                          onSelect={() => onChooseLabelColor(option.value)}
                        >
                          <DropdownMenu.Icon>
                            <LabelDot color={option.value} />
                          </DropdownMenu.Icon>
                          {option.label}
                        </DropdownMenu.SubpageBackItem>
                      ))}
                    </DropdownMenu.List>
                  </DropdownMenu.Surface>
                </DropdownMenu.Subpage>

                <DropdownMenu.DataSurface
                  content={nodes}
                  deepSearch={{ enabled: true, minLength: 0 }}
                >
                  <DropdownMenu.DataInput placeholder="Labels..." />
                  <DropdownMenu.DataList>
                    {({ search, nodes: filteredNodes, renderNode }) => {
                      const trimmedQuery = search.trim()
                      const shouldShowCreateRow =
                        trimmedQuery.length > 0 &&
                        !hasExactLabelMatch(filteredNodes, trimmedQuery)

                      return (
                        <>
                          {shouldShowCreateRow ? (
                            <DropdownMenu.SubpageTrigger
                              id={CREATE_LABEL_TRIGGER_ID}
                              value={`Create new label: ${trimmedQuery}`}
                              keywords={[trimmedQuery, 'create label']}
                              targetPageId={CREATE_LABEL_SUBPAGE_ID}
                              onClick={() => onCreateLabelIntent(trimmedQuery)}
                            >
                              <DropdownMenu.Icon>
                                <PlusIcon className="size-4" />
                              </DropdownMenu.Icon>
                              Create new label: "{trimmedQuery}"
                            </DropdownMenu.SubpageTrigger>
                          ) : null}

                          {filteredNodes.map((node) => renderNode(node))}
                        </>
                      )
                    }}
                  </DropdownMenu.DataList>
                </DropdownMenu.DataSurface>
              </DropdownMenu.Popup>
            </DropdownMenu.Positioner>
          </DropdownMenu.Portal>
        </DropdownMenu.Submenu>
      )
    },
  }
}

function buildMenuContent({
  labels,
  pendingLabelName,
  onCreateLabelIntent,
  onChooseLabelColor,
}: {
  labels: LabelData[]
  pendingLabelName: string
  onCreateLabelIntent: (query: string) => void
  onChooseLabelColor: (color: TW_COLOR) => void
}): NodeDef[] {
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

  const assigneeMenu = createSubmenuNode(
    'assignee',
    'Assignee',
    <AssigneeIcon />,
    ASSIGNEES.map((assignee) =>
      createAssigneeItemNode(assignee.id, assignee.name, assignee.username),
    ),
    { inputPlaceholder: 'Assignee...' },
  )

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

  const labelsMenu = createCreatableLabelsSubmenuNode({
    labelNodes: labels.map((label) =>
      createLabelItemNode(label.id, label.name, label.color),
    ),
    pendingLabelName,
    onCreateLabelIntent,
    onChooseLabelColor,
  })

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

  const projectLabelsMenu = createSubmenuNode(
    'project-labels',
    'Project labels',
    <LabelsIcon />,
    PROJECT_LABELS.map((label) =>
      createLabelItemNode(label.id, label.name, label.color),
    ),
    { inputPlaceholder: 'Project labels...' },
  )

  const projectLeadMenu = createSubmenuNode(
    'project-lead',
    'Project lead',
    <ProjectLeadIcon />,
    ASSIGNEES.map((assignee) =>
      createAssigneeItemNode(assignee.id, assignee.name, assignee.username),
    ),
    { inputPlaceholder: 'Project lead...' },
  )

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

export default function DropdownMenuDeepSearchSubpagesLinear() {
  const [labels, setLabels] = React.useState<LabelData[]>(() => INITIAL_LABELS)
  const [pendingLabelName, setPendingLabelName] = React.useState('')

  const handleCreateLabelIntent = React.useCallback((query: string) => {
    setPendingLabelName(query.trim())
  }, [])

  const handleChooseLabelColor = React.useCallback(
    (color: TW_COLOR) => {
      const trimmedName = pendingLabelName.trim()
      if (!trimmedName) {
        return
      }

      const alreadyExists = labels.some(
        (label) =>
          normalizeLabelName(label.name) === normalizeLabelName(trimmedName),
      )

      if (alreadyExists) {
        toast(`Label "${trimmedName}" already exists.`)
        setPendingLabelName('')
        return
      }

      setLabels((previous) => [
        ...previous,
        {
          id: getUniqueLabelId(trimmedName, previous),
          name: trimmedName,
          color,
        },
      ])
      toast(`Created label "${trimmedName}".`)
      setPendingLabelName('')
    },
    [labels, pendingLabelName],
  )

  const content = React.useMemo(
    () =>
      buildMenuContent({
        labels,
        pendingLabelName,
        onCreateLabelIntent: handleCreateLabelIntent,
        onChooseLabelColor: handleChooseLabelColor,
      }),
    [labels, pendingLabelName, handleCreateLabelIntent, handleChooseLabelColor],
  )

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
              deepSearch={{ enabled: true, minLength: 0 }}
            >
              <DropdownMenu.DataInput placeholder="Search all..." />
              <DropdownMenu.DataList virtualized>
                {({ nodes, renderNode }) => (
                  <>{nodes.map((node) => renderNode(node))}</>
                )}
              </DropdownMenu.DataList>
            </DropdownMenu.DataSurface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
