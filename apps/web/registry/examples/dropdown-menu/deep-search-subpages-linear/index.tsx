'use client'

import type {
  NodeDef,
  SubmenuDef,
  SubmenuRenderParams,
  SubpageContentRenderParams,
  SubpageDef,
  SubpageTriggerRenderParams,
} from '@bazza-ui/react/dropdown-menu'
import { PlusIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DiamondSpinner,
  DropdownMenu,
  LabelWithBreadcrumbs,
} from '@/registry/ui/dropdown-menu'
import { AIFilterIcon } from '../subpage-linear/icons'
import {
  createAssigneeItemNode,
  createItemNode,
  createLabelItemNode,
  createSubmenuNode,
  createSubpageNode,
  FilterIcon,
  LabelDot,
} from './components'
import {
  AssigneeIcon,
  DurationIcon,
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

type LabelRecord = {
  id: string
  name: string
  color: string
}

const labelData: LabelRecord[] = [
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

const CREATABLE_LABEL_COLORS = [
  { id: 'red', label: 'Red' },
  { id: 'orange', label: 'Orange' },
  { id: 'green', label: 'Green' },
  { id: 'blue', label: 'Blue' },
  { id: 'violet', label: 'Violet' },
  { id: 'pink', label: 'Pink' },
] as const

function normalizeLabelName(value: string) {
  return value.trim().toLowerCase()
}

function toLabelId(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return slug || 'label'
}

function createCreateLabelSubpage(
  labelName: string,
  onCreateLabel: (name: string, color: string) => Promise<void | boolean>,
  isCreatingLabel: boolean,
): SubpageDef {
  return {
    kind: 'subpage',
    id: `create-new-label-${labelName}`,
    value: `Create new label: ${labelName}`,
    renderTrigger: ({ props }: SubpageTriggerRenderParams) => (
      <DropdownMenu.SubpageTrigger {...props} disabled={isCreatingLabel}>
        <DropdownMenu.Icon render={<PlusIcon />}></DropdownMenu.Icon>
        <span className="whitspace-nowrap truncate">
          Create new label:{' '}
          <span className="text-muted-foreground">"{labelName}"</span>
        </span>
      </DropdownMenu.SubpageTrigger>
    ),
    renderContent: ({ pageId }: SubpageContentRenderParams) => (
      <DropdownMenu.Subpage pageId={pageId}>
        <DropdownMenu.Surface>
          <DropdownMenu.DataInput
            placeholder="Pick color for label"
            disabled={isCreatingLabel}
          />
          <DropdownMenu.List>
            <DropdownMenu.Empty />
            {CREATABLE_LABEL_COLORS.map((color) => (
              <DropdownMenu.SubpageBackItem
                key={color.id}
                value={`${labelName}:${color.id}`}
                keywords={[labelName, color.label, 'create', 'label']}
                disabled={isCreatingLabel}
                onSelectAsync={async () =>
                  await onCreateLabel(labelName, color.id)
                }
              >
                <DropdownMenu.Icon>
                  <LabelDot color={color.id} />
                </DropdownMenu.Icon>
                {color.label}
              </DropdownMenu.SubpageBackItem>
            ))}
          </DropdownMenu.List>
        </DropdownMenu.Surface>
      </DropdownMenu.Subpage>
    ),
  }
}

function createLabelsSubmenu(params: {
  labels: LabelRecord[]
  selectedLabelIds: Set<string>
  labelSearchQuery: string
  onLabelSearchQueryChange: (value: string) => void
  onLabelCheckedChange: (labelId: string, checked: boolean) => void
  onCreateLabel: (name: string, color: string) => Promise<void | boolean>
  isCreatingLabel: boolean
  creatingLabelName: string | null
  creatingLabelColor: string
  onHighlightChange: (id: string | null, index: number) => void
}): SubmenuDef {
  const {
    labels,
    selectedLabelIds,
    labelSearchQuery,
    onLabelSearchQueryChange,
    onLabelCheckedChange,
    onCreateLabel,
    isCreatingLabel,
    creatingLabelName,
    creatingLabelColor,
    onHighlightChange,
  } = params

  const trimmedQuery = labelSearchQuery.trim()
  const normalizedQuery = normalizeLabelName(trimmedQuery)

  const hasExactMatch =
    normalizedQuery.length > 0 &&
    labels.some((label) => normalizeLabelName(label.name) === normalizedQuery)

  const nodes: NodeDef[] = labels.map((label) => ({
    kind: 'checkbox-item',
    id: label.id,
    value: label.name,
    keywords: [label.name],
    checked: selectedLabelIds.has(label.id),
    onCheckedChange: (checked) =>
      onLabelCheckedChange(label.id, checked === true),
    render: ({ props, context }) => (
      <DropdownMenu.CheckboxItem {...props} disabled={isCreatingLabel}>
        <DropdownMenu.CheckboxItemIndicator className="opacity-0 data-checked:opacity-100 data-unchecked:group-data-highlighted/row:opacity-100" />
        <DropdownMenu.Icon>
          <LabelDot color={label.color} />
        </DropdownMenu.Icon>
        <LabelWithBreadcrumbs
          label={label.name}
          breadcrumbs={
            context.isDeepSearchResult ? context.breadcrumbs : undefined
          }
        />
      </DropdownMenu.CheckboxItem>
    ),
  }))

  if (normalizedQuery.length > 0 && !hasExactMatch) {
    nodes.push(
      createCreateLabelSubpage(trimmedQuery, onCreateLabel, isCreatingLabel),
    )
  }

  return {
    kind: 'submenu',
    id: 'labels',
    value: 'Labels',
    deepSearch: true,
    nodes,
    render: ({ props, context, nodes }: SubmenuRenderParams) => (
      <DropdownMenu.Submenu onHighlightChange={onHighlightChange}>
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
          <DropdownMenu.Positioner align="list-start" className="relative">
            <DropdownMenu.Popup
              render={({ className, children, ...props }, state) => (
                <>
                  <AnimatePresence>
                    {(state.hasOpenSubpage || isCreatingLabel) && (
                      <motion.div
                        className="absolute -z-10 -top-8 pb-4 left-0 right-0 rounded-t-2xl bg-muted border"
                        initial={{
                          y: 50,
                          filter: 'blur(4px)',
                          opacity: 0,
                          scale: 0.95,
                        }}
                        animate={{
                          y: 0,
                          filter: 'blur(0px)',
                          opacity: 1,
                          scale: 1,
                        }}
                        exit={{
                          y: 50,
                          filter: 'blur(4px)',
                          opacity: 0,
                          scale: 0.95,
                        }}
                        transition={{
                          duration: 0.2,
                          ease: 'easeOut',
                        }}
                      >
                        <div className="px-4.5 py-2 text-xs flex items-center gap-2">
                          {isCreatingLabel ? (
                            <DiamondSpinner className="size-4" />
                          ) : (
                            <LabelsIcon />
                          )}
                          {isCreatingLabel && creatingLabelName ? (
                            <div className="inline-flex items-center gap-1">
                              <span className="text-muted-foreground">
                                Creating
                              </span>
                              <LabelDot
                                color={creatingLabelColor}
                                className="size-2"
                              />
                              <span>{creatingLabelName}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <span className="text-muted-foreground">
                                New label:
                              </span>{' '}
                              <LabelDot
                                color={creatingLabelColor}
                                className="size-2"
                              />
                              <span>{trimmedQuery}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div
                    {...props}
                    className={cn(
                      // (state.hasOpenSubpage || isCreatingLabel) &&
                      // '-mx-px -mb-px',
                      className,
                      '!outline-none',
                    )}
                    // className={cn(
                    //   'rounded-t-2xl rounded-b-lg flex flex-col outline-none',
                    //   (state.hasOpenSubpage || isCreatingLabel) &&
                    //     'border border-border bg-muted',
                    // )}
                  >
                    {children}
                  </div>
                </>
              )}
            >
              <DropdownMenu.DataSurface
                content={nodes}
                deepSearch={{ enabled: true, minLength: 0 }}
              >
                <DropdownMenu.DataInput
                  placeholder="Labels..."
                  disabled={isCreatingLabel}
                  onValueChange={onLabelSearchQueryChange}
                />
                <DropdownMenu.DataList virtualized>
                  {({
                    nodes: filteredNodes,
                    renderNode: renderFilteredNode,
                  }) => (
                    <>{filteredNodes.map((node) => renderFilteredNode(node))}</>
                  )}
                </DropdownMenu.DataList>
              </DropdownMenu.DataSurface>
              <DropdownMenu.DataSubpages />
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    ),
  }
}

function buildMenuContent(params: {
  labels: LabelRecord[]
  selectedLabelIds: Set<string>
  labelSearchQuery: string
  onLabelSearchQueryChange: (value: string) => void
  onLabelCheckedChange: (labelId: string, checked: boolean) => void
  onCreateLabel: (name: string, color: string) => Promise<void | boolean>
  isCreatingLabel: boolean
  creatingLabelName: string | null
  creatingLabelColor: string
  onLabelHighlightChange: (id: string | null, index: number) => void
}): NodeDef[] {
  const {
    labels,
    selectedLabelIds,
    labelSearchQuery,
    onLabelSearchQueryChange,
    onLabelCheckedChange,
    onCreateLabel,
    isCreatingLabel,
    creatingLabelName,
    creatingLabelColor,
    onLabelHighlightChange,
  } = params

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
    [
      createAssigneeItemNode('@kianbazza', 'Kian Bazza', 'kianbazza'),
      createAssigneeItemNode('@shadcn', 'shadcn', 'shadcn'),
      createAssigneeItemNode('@rauchg', 'Guillermo Rauch', 'rauchg'),
      createAssigneeItemNode('@t3dotgg', 'Theo Browne', 't3dotgg'),
    ],
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

  const labelsMenu = createLabelsSubmenu({
    labels,
    selectedLabelIds,
    labelSearchQuery,
    onLabelSearchQueryChange,
    onLabelCheckedChange,
    onCreateLabel,
    isCreatingLabel,
    creatingLabelName,
    creatingLabelColor,
    onHighlightChange: onLabelHighlightChange,
  })

  const aiFilterSubpage = createSubpageNode(
    'ai-filter',
    'AI Filter',
    <AIFilterIcon />,
    [
      createItemNode('ai-triage', 'Smart triage'),
      createItemNode('ai-risk', 'Risk prediction'),
      createItemNode('ai-duplicates', 'Duplicate detection'),
      createSubmenuNode(
        'ai-confidence',
        'Confidence',
        <ProjectPriorityIcon />,
        [
          createItemNode('high-confidence', 'High confidence'),
          createItemNode('medium-confidence', 'Medium confidence'),
          createItemNode('low-confidence', 'Low confidence'),
        ],
        { inputPlaceholder: 'AI confidence...' },
      ),
    ],
    { inputPlaceholder: 'AI filters...' },
  )

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
    projectLabelData.map((label) =>
      createLabelItemNode(label.id, label.name, label.color),
    ),
    { inputPlaceholder: 'Project labels...' },
  )

  const projectLeadMenu = createSubmenuNode(
    'project-lead',
    'Project lead',
    <ProjectLeadIcon />,
    [
      createAssigneeItemNode('@kianbazza', 'Kian Bazza', 'kianbazza'),
      createAssigneeItemNode('@shadcn', 'shadcn', 'shadcn'),
      createAssigneeItemNode('@rauchg', 'Guillermo Rauch', 'rauchg'),
      createAssigneeItemNode('@t3dotgg', 'Theo Browne', 't3dotgg'),
    ],
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
    // aiFilterSubpage,
    // {
    //   kind: 'separator',
    //   id: 'ai-filter-separator',
    //   render: ({ props }) => <DropdownMenu.Separator {...props} />,
    // },
    statusMenu,
    assigneeMenu,
    priorityMenu,
    labelsMenu,
    projectPropertiesMenu,
  ]
}

export default function DropdownMenuDeepSearchSubpagesLinear() {
  const [labels, setLabels] = React.useState<LabelRecord[]>(() => [
    ...labelData,
  ])
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<Set<string>>(
    () => new Set(),
  )
  const [labelSearchQuery, setLabelSearchQuery] = React.useState('')
  const [isCreatingLabel, setIsCreatingLabel] = React.useState(false)
  const [creatingLabelName, setCreatingLabelName] = React.useState<
    string | null
  >(null)
  const [creatingLabelColor, setCreatingLabelColor] = React.useState<string>(
    CREATABLE_LABEL_COLORS[0].id,
  )

  const createdLabelIndex = React.useRef(0)

  const handleLabelSearchQueryChange = React.useCallback((value: string) => {
    setLabelSearchQuery(value)
  }, [])

  const handleLabelCheckedChange = React.useCallback(
    (labelId: string, checked: boolean) => {
      setSelectedLabelIds((prev) => {
        const next = new Set(prev)
        if (checked) {
          next.add(labelId)
        } else {
          next.delete(labelId)
        }
        return next
      })
    },
    [],
  )

  const handleCreateLabel = React.useCallback(
    async (name: string, color: string) => {
      if (isCreatingLabel) {
        return false
      }

      const trimmedName = name.trim()
      if (!trimmedName) {
        return false
      }

      const normalizedName = normalizeLabelName(trimmedName)
      const exists = labels.some(
        (label) => normalizeLabelName(label.name) === normalizedName,
      )

      if (exists) {
        toast(`Label "${trimmedName}" already exists.`)
        return false
      }

      setCreatingLabelName(trimmedName)
      setCreatingLabelColor(color)
      setIsCreatingLabel(true)

      try {
        await new Promise((resolve) => setTimeout(resolve, 4000))

        createdLabelIndex.current += 1
        const createdLabelId = `${toLabelId(trimmedName)}-${createdLabelIndex.current}`

        setLabels((prevLabels) => [
          ...prevLabels,
          {
            id: createdLabelId,
            name: trimmedName,
            color,
          },
        ])

        setSelectedLabelIds((prev) => {
          const next = new Set(prev)
          next.add(createdLabelId)
          return next
        })

        setLabelSearchQuery(trimmedName)
        toast(`Created label "${trimmedName}".`)
      } finally {
        setCreatingLabelName(null)
        setIsCreatingLabel(false)
      }
    },
    [isCreatingLabel, labels],
  )

  const handleLabelHighlightChange = React.useCallback(
    (id: string | null, _index: number) => {
      if (!id) return
      // Color items have values like "labelName:colorId"
      const colonIndex = id.lastIndexOf(':')
      if (colonIndex === -1) return
      const colorId = id.slice(colonIndex + 1)
      if (CREATABLE_LABEL_COLORS.some((c) => c.id === colorId)) {
        setCreatingLabelColor(colorId)
      }
    },
    [],
  )

  const content = React.useMemo(
    () =>
      buildMenuContent({
        labels,
        selectedLabelIds,
        labelSearchQuery,
        onLabelSearchQueryChange: handleLabelSearchQueryChange,
        onLabelCheckedChange: handleLabelCheckedChange,
        onCreateLabel: handleCreateLabel,
        isCreatingLabel,
        creatingLabelName,
        creatingLabelColor,
        onLabelHighlightChange: handleLabelHighlightChange,
      }),
    [
      labels,
      selectedLabelIds,
      labelSearchQuery,
      isCreatingLabel,
      creatingLabelName,
      creatingLabelColor,
      handleLabelSearchQueryChange,
      handleLabelCheckedChange,
      handleCreateLabel,
      handleLabelHighlightChange,
    ],
  )

  return (
    <DropdownMenu.Root
      onOpenChange={(open) => {
        if (!open) {
          setLabelSearchQuery('')
        }
      }}
    >
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
            <DropdownMenu.DataSubpages />
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
