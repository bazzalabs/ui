'use client'

import { createVanillaQueryLoader } from '@bazza-ui/react/adapters'
import type { NodeDef } from '@bazza-ui/react/command-menu'
import {
  BellIcon,
  ClipboardIcon,
  ExternalLinkIcon,
  EyeIcon,
  GitBranchIcon,
  InboxIcon,
  MessageSquareIcon,
  Settings2Icon,
  TagsIcon,
  UserRoundIcon,
} from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CommandMenu } from '@/registry/ui/command-menu'
import type { AssigneeRecord, LabelRecord } from './components'
import {
  AssigneeAvatar,
  CommandMenuRows,
  createAssigneeItemNode,
  createAsyncSubpageNode,
  createGroupNode,
  createItemNode,
  createLabelCheckboxNode,
  createSeparatorNode,
  createSubpageNode,
  LabelDot,
} from './components'
import {
  AssigneeIcon,
  LabelsIcon,
  ProjectPriority,
  ProjectPriorityIcon,
  Status,
  StatusIcon,
} from './icons'

const issue = {
  key: 'UI-331',
  title: 'feat(data-views): add saved filters and grouped rows',
  branch: 'feat/data-views-saved-filters',
  project: 'Data views',
}

const assignees: AssigneeRecord[] = [
  {
    id: 'kianbazza',
    name: 'Kian Bazza',
    username: 'kianbazza',
    role: 'Design systems',
  },
  {
    id: 'leerob',
    name: 'Lee Robinson',
    username: 'leerob',
    role: 'Frameworks',
  },
  {
    id: 'rauchg',
    name: 'Guillermo Rauch',
    username: 'rauchg',
    role: 'Product',
  },
  {
    id: 'shuding',
    name: 'Shu Ding',
    username: 'shuding',
    role: 'Infrastructure',
  },
  {
    id: 'delbaoliveira',
    name: 'Delba de Oliveira',
    username: 'delbaoliveira',
    role: 'Developer experience',
  },
  {
    id: 'jaredpalmer',
    name: 'Jared Palmer',
    username: 'jaredpalmer',
    role: 'Data workflows',
  },
]

const labels: LabelRecord[] = [
  { id: 'frontend', name: 'Frontend', color: 'orange' },
  { id: 'data-views', name: 'Data views', color: 'blue' },
  { id: 'design-system', name: 'Design system', color: 'purple' },
  { id: 'accessibility', name: 'Accessibility', color: 'red' },
  { id: 'blocked', name: 'Blocked', color: 'indigo' },
  { id: 'customer-request', name: 'Customer request', color: 'green' },
  { id: 'performance', name: 'Performance', color: 'rose' },
  { id: 'polish', name: 'Polish', color: 'pink' },
]

const statuses = [
  { id: 'backlog', name: 'Backlog', icon: <Status.Backlog /> },
  { id: 'todo', name: 'Todo', icon: <Status.Todo /> },
  { id: 'in-progress', name: 'In Progress', icon: <Status.InProgress /> },
  { id: 'done', name: 'Done', icon: <Status.Done /> },
]

const priorities = [
  {
    id: 'no-priority',
    name: 'No priority',
    icon: <ProjectPriority.NoPriority />,
  },
  { id: 'urgent', name: 'Urgent', icon: <ProjectPriority.Urgent /> },
  { id: 'high', name: 'High', icon: <ProjectPriority.High /> },
  { id: 'medium', name: 'Medium', icon: <ProjectPriority.Medium /> },
  { id: 'low', name: 'Low', icon: <ProjectPriority.Low /> },
]

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function matchesAssignee(assignee: AssigneeRecord, query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return [assignee.name, assignee.username, assignee.role]
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery)
}

function buildMenuContent({
  selectedAssigneeId,
  selectedLabelIds,
  selectedStatusId,
  selectedPriorityId,
  watching,
  compactRows,
  onAssigneeChange,
  onLabelCheckedChange,
  onStatusChange,
  onPriorityChange,
  onWatchingChange,
  onCompactRowsChange,
}: {
  selectedAssigneeId: string
  selectedLabelIds: Set<string>
  selectedStatusId: string
  selectedPriorityId: string
  watching: boolean
  compactRows: boolean
  onAssigneeChange: (assignee: AssigneeRecord) => void
  onLabelCheckedChange: (labelId: string, checked: boolean) => void
  onStatusChange: (statusId: string, statusName: string) => void
  onPriorityChange: (priorityId: string, priorityName: string) => void
  onWatchingChange: (watching: boolean) => void
  onCompactRowsChange: (compactRows: boolean) => void
}): NodeDef[] {
  const assigneeLoader = createVanillaQueryLoader({
    fetcher: async (query) => {
      await sleep(650)

      return assignees
        .filter((assignee) => matchesAssignee(assignee, query))
        .map((assignee) =>
          createAssigneeItemNode({
            assignee,
            selected: assignee.id === selectedAssigneeId,
            onSelect: onAssigneeChange,
          }),
        )
    },
    initialQueryBehavior: false,
    minQueryLength: 1,
  })

  const assignSubpage = createAsyncSubpageNode({
    id: 'assign-to',
    title: 'Assign to…',
    description: 'Search teammates with simulated latency.',
    icon: <AssigneeIcon />,
    asyncNodes: assigneeLoader,
    inputPlaceholder: 'Search teammates…',
    loadingLabel: 'Searching teammates…',
    emptyLabel: 'No teammates found.',
  })

  const labelsSubpage = createSubpageNode({
    id: 'add-labels',
    title: 'Add labels…',
    description: 'Toggle multiple labels without closing the palette.',
    icon: <LabelsIcon />,
    inputPlaceholder: 'Filter labels…',
    emptyLabel: 'No labels found.',
    nodes: labels.map((label) =>
      createLabelCheckboxNode({
        label,
        selected: selectedLabelIds.has(label.id),
        onCheckedChange: onLabelCheckedChange,
      }),
    ),
  })

  const statusSubpage = createSubpageNode({
    id: 'change-status',
    title: 'Change status…',
    description: 'Move the issue through the Linear workflow.',
    icon: <StatusIcon />,
    inputPlaceholder: 'Filter statuses…',
    nodes: statuses.map((status) => {
      const selected = status.id === selectedStatusId

      return createItemNode({
        id: `status-${status.id}`,
        label: status.name,
        icon: status.icon,
        keywords: selected
          ? [status.id, status.name, 'current']
          : [status.id, status.name],
        disabled: selected,
        shortcut: status.id === 'done' ? 'd' : undefined,
        onSelect: () => onStatusChange(status.id, status.name),
      })
    }),
  })

  const prioritySubpage = createSubpageNode({
    id: 'set-priority',
    title: 'Set priority…',
    description: 'Pick the urgency for UI-331.',
    icon: <ProjectPriorityIcon />,
    inputPlaceholder: 'Filter priorities…',
    nodes: priorities.map((priority) => {
      const selected = priority.id === selectedPriorityId

      return createItemNode({
        id: `priority-${priority.id}`,
        label: priority.name,
        icon: priority.icon,
        keywords: selected
          ? [priority.id, priority.name, 'current']
          : [priority.id, priority.name],
        disabled: selected,
        shortcut: priority.id === 'high' ? 'h' : undefined,
        onSelect: () => onPriorityChange(priority.id, priority.name),
      })
    }),
  })

  return [
    createGroupNode('issue', 'Issue', [
      assignSubpage,
      labelsSubpage,
      statusSubpage,
      prioritySubpage,
      createSeparatorNode('issue-separator'),
      createItemNode({
        id: 'copy-issue-link',
        label: 'Copy issue link',
        icon: <ClipboardIcon className="size-4" />,
        keywords: ['copy', 'url', issue.key],
        shortcut: 'c',
        onSelect: () => toast(`Copied ${issue.key} link.`),
      }),
      createItemNode({
        id: 'mark-complete',
        label: 'Mark as completed',
        icon: <Status.Done />,
        keywords: ['done', 'complete', 'resolve'],
        shortcut: 'x',
        onSelect: () => onStatusChange('done', 'Done'),
      }),
    ]),
    createGroupNode('navigate', 'Navigate', [
      createItemNode({
        id: 'open-linear',
        label: 'Open issue in Linear',
        icon: <ExternalLinkIcon className="size-4" />,
        keywords: ['linear', 'browser', issue.key],
        shortcut: 'o',
        onSelect: () => toast(`Opened ${issue.key} in Linear.`),
      }),
      createItemNode({
        id: 'view-comments',
        label: 'View comments',
        icon: <MessageSquareIcon className="size-4" />,
        keywords: ['discussion', 'activity', 'comments'],
        onSelect: () => toast('Opened the activity thread.'),
      }),
      createItemNode({
        id: 'open-branch',
        label: `Open branch ${issue.branch}`,
        icon: <GitBranchIcon className="size-4" />,
        keywords: ['branch', 'git', issue.branch],
        onSelect: () => toast(`Opened ${issue.branch}.`),
      }),
      createItemNode({
        id: 'open-project',
        label: `Go to ${issue.project}`,
        icon: <InboxIcon className="size-4" />,
        keywords: ['project', issue.project],
        onSelect: () => toast(`Opened ${issue.project}.`),
      }),
    ]),
    createGroupNode('preferences', 'Preferences', [
      {
        kind: 'checkbox-item',
        id: 'watch-issue',
        value: 'Watch issue updates',
        keywords: ['watch', 'subscribe', 'notifications'],
        checked: watching,
        closeOnClick: false,
        onCheckedChange: (checked) => onWatchingChange(checked === true),
        render: ({ props }) => (
          <CommandMenu.CheckboxItem {...props}>
            <CommandMenu.CheckboxItemIndicator />
            <CommandMenu.Icon>
              <BellIcon className="size-4" />
            </CommandMenu.Icon>
            Watch issue updates
          </CommandMenu.CheckboxItem>
        ),
      },
      {
        kind: 'checkbox-item',
        id: 'compact-rows',
        value: 'Use compact rows',
        keywords: ['compact', 'density', 'rows'],
        checked: compactRows,
        closeOnClick: false,
        onCheckedChange: (checked) => onCompactRowsChange(checked === true),
        render: ({ props }) => (
          <CommandMenu.CheckboxItem {...props}>
            <CommandMenu.CheckboxItemIndicator />
            <CommandMenu.Icon>
              <EyeIcon className="size-4" />
            </CommandMenu.Icon>
            Use compact rows
          </CommandMenu.CheckboxItem>
        ),
      },
      createItemNode({
        id: 'command-preferences',
        label: 'Open command menu preferences',
        icon: <Settings2Icon className="size-4" />,
        keywords: ['settings', 'preferences', 'keyboard'],
        onSelect: () => toast('Opened command menu preferences.'),
      }),
    ]),
  ]
}

export default function CommandMenuLinear() {
  const [selectedAssigneeId, setSelectedAssigneeId] =
    React.useState('kianbazza')
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<Set<string>>(
    () => new Set(['frontend', 'data-views']),
  )
  const [selectedStatusId, setSelectedStatusId] = React.useState('in-progress')
  const [selectedPriorityId, setSelectedPriorityId] = React.useState('high')
  const [watching, setWatching] = React.useState(true)
  const [compactRows, setCompactRows] = React.useState(false)

  const selectedAssignee =
    assignees.find((assignee) => assignee.id === selectedAssigneeId) ??
    assignees[0]!
  const selectedStatus =
    statuses.find((status) => status.id === selectedStatusId) ?? statuses[0]!
  const selectedPriority =
    priorities.find((priority) => priority.id === selectedPriorityId) ??
    priorities[0]!
  const selectedLabels = labels.filter((label) =>
    selectedLabelIds.has(label.id),
  )

  const handleAssigneeChange = React.useCallback((assignee: AssigneeRecord) => {
    setSelectedAssigneeId(assignee.id)
  }, [])

  const handleLabelCheckedChange = React.useCallback(
    (labelId: string, checked: boolean) => {
      setSelectedLabelIds((current) => {
        const next = new Set(current)

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

  const handleStatusChange = React.useCallback(
    (statusId: string, statusName: string) => {
      setSelectedStatusId(statusId)
      toast(`Moved ${issue.key} to ${statusName}.`)
    },
    [],
  )

  const handlePriorityChange = React.useCallback(
    (priorityId: string, priorityName: string) => {
      setSelectedPriorityId(priorityId)
      toast(`Set ${issue.key} priority to ${priorityName}.`)
    },
    [],
  )

  const handleWatchingChange = React.useCallback((nextWatching: boolean) => {
    setWatching(nextWatching)
    toast(nextWatching ? 'Watching UI-331.' : 'Stopped watching UI-331.')
  }, [])

  const handleCompactRowsChange = React.useCallback((nextCompact: boolean) => {
    setCompactRows(nextCompact)
    toast(nextCompact ? 'Compact rows enabled.' : 'Compact rows disabled.')
  }, [])

  const content = React.useMemo(
    () =>
      buildMenuContent({
        selectedAssigneeId,
        selectedLabelIds,
        selectedStatusId,
        selectedPriorityId,
        watching,
        compactRows,
        onAssigneeChange: handleAssigneeChange,
        onLabelCheckedChange: handleLabelCheckedChange,
        onStatusChange: handleStatusChange,
        onPriorityChange: handlePriorityChange,
        onWatchingChange: handleWatchingChange,
        onCompactRowsChange: handleCompactRowsChange,
      }),
    [
      selectedAssigneeId,
      selectedLabelIds,
      selectedStatusId,
      selectedPriorityId,
      watching,
      compactRows,
      handleAssigneeChange,
      handleLabelCheckedChange,
      handleStatusChange,
      handlePriorityChange,
      handleWatchingChange,
      handleCompactRowsChange,
    ],
  )

  return (
    <CommandMenu.Root hotkey="mod+k">
      <CommandMenu.Trigger render={<Button variant="outline" />}>
        Open issue actions
        <CommandMenu.Kbd keys="mod+k" />
      </CommandMenu.Trigger>
      <CommandMenu.Portal>
        <CommandMenu.Backdrop />
        <CommandMenu.Popup>
          <CommandMenu.Surface
            content={content}
            deepSearch={{ enabled: true, minLength: 1 }}
          >
            <CommandMenu.Header>
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-mono text-foreground">{issue.key}</span>
                <span>·</span>
                <span className="truncate">{issue.title}</span>
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <AssigneeAvatar assignee={selectedAssignee} />
                <span>{selectedStatus.name}</span>
              </div>
            </CommandMenu.Header>
            <div className="flex items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <UserRoundIcon className="size-3.5" />
                {selectedAssignee.name}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <StatusIcon />
                {selectedStatus.name}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <ProjectPriorityIcon />
                {selectedPriority.name}
              </span>
              <span>·</span>
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <TagsIcon className="size-3.5 shrink-0" />
                <span className="truncate">
                  {selectedLabels.length === 0
                    ? 'No labels'
                    : selectedLabels.map((label) => label.name).join(', ')}
                </span>
              </span>
              <div className="ml-auto hidden items-center gap-1.5 md:flex">
                {selectedLabels.slice(0, 3).map((label) => (
                  <LabelDot key={label.id} color={label.color} />
                ))}
              </div>
            </div>
            <CommandMenu.Input placeholder="Search issue commands…" />
            <CommandMenu.List>
              <CommandMenuRows />
            </CommandMenu.List>
            <CommandMenu.Loading>Searching…</CommandMenu.Loading>
            <CommandMenu.Empty>No matching commands.</CommandMenu.Empty>
          </CommandMenu.Surface>
        </CommandMenu.Popup>
      </CommandMenu.Portal>
    </CommandMenu.Root>
  )
}
