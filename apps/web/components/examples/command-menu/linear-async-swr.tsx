'use client'

import type { MenuDef, NodeDef, SubmenuDef } from '@bazza-ui/command-menu'
import { swrLoader } from '@bazza-ui/loaders/swr'
import { SearchIcon } from 'lucide-react'
import { toast } from 'sonner'
import { SWRConfig } from 'swr'
import { sleep } from '@/app/demos/server/tst-query/_/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CommandMenu } from '@/registry/ui/command-menu'
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
} from './shared/icons'
import { LABEL_STYLES_BG, type TW_COLOR } from './shared/label-styles'

export function CommandMenu_LinearAsyncSWR() {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
      }}
    >
      <CommandMenu menu={menuData} placeholder="Search properties...">
        <Button variant="ghost" size="sm" className="w-fit">
          <SearchIcon className="size-4" />
          Search
        </Button>
      </CommandMenu>
    </SWRConfig>
  )
}

const statusMenu: SubmenuDef = {
  kind: 'submenu',
  icon: <StatusIcon />,
  label: 'Status',
  inputPlaceholder: 'Status...',
  nodes: [
    {
      kind: 'item',
      label: 'Icebox',
      icon: <Status.Icebox />,
    },
    {
      kind: 'item',
      label: 'Backlog',
      icon: <Status.Backlog />,
    },
    {
      kind: 'item',
      label: 'Todo',
      icon: <Status.Todo />,
    },
    {
      kind: 'item',
      label: 'In Progress',
      icon: <Status.InProgress />,
    },
    {
      kind: 'item',
      label: 'Done',
      icon: <Status.Done />,
    },
  ],
}

// Simulate fetching assignees from an API
async function fetchAssignees(): Promise<NodeDef[]> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const users = [
    { username: 'kianbazza', name: 'Kian Bazza' },
    { username: 'shadcn', name: 'shadcn' },
    { username: 'rauchg', name: 'Guillermo Rauch' },
    { username: 't3dotgg', name: 'Theo Browne' },
    { username: 'leerob', name: 'Lee Robinson' },
    { username: 'kentcdodds', name: 'Kent C. Dodds' },
    { username: 'wesbos', name: 'Wes Bos' },
    { username: 'sindresorhus', name: 'Sindre Sorhus' },
    { username: 'addyosmani', name: 'Addy Osmani' },
    { username: 'stolinski', name: 'Scott Tolinski' },
    { username: 'ryanflorence', name: 'Ryan Florence' },
    { username: 'mjackson', name: 'Michael Jackson' },
    { username: 'timneutkens', name: 'Tim Neutkens' },
    { username: 'skve', name: 'Luke Shiels' },
    { username: 'adamwathan', name: 'Adam Wathan' },
    { username: 'emilwidlund', name: 'Emil Widlund' },
    { username: 'aboodman', name: 'Aaron Boodman' },
    { username: 'raunofreiberg', name: 'Rauno Freiberg' },
    { username: 'jaredpalmer', name: 'Jared Palmer' },
    { username: 'pqoqubbw', name: 'dmytro' },
    { username: 'sebmarkbage', name: 'Sebastian Markbåge' },
    { username: 'sophiebits', name: 'Sophie Alpert' },
    { username: 'acdlite', name: 'Andrew Clark' },
    { username: 'gaearon', name: 'Dan Abramov' },
  ]

  return users.map((user) => ({
    kind: 'item',
    id: `@${user.username}`,
    label: user.name,
    keywords: [user.name],
    icon: (
      <Avatar>
        <AvatarImage
          src={`https://github.com/${user.username}.png`}
          alt={`@${user.username}`}
        />
        <AvatarFallback>
          {user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
    ),
  }))
}

const assigneeMenu: SubmenuDef = {
  kind: 'submenu',
  icon: <AssigneeIcon />,
  label: 'Assignee',
  inputPlaceholder: 'Assignee...',
  loader: swrLoader({
    key: 'assignees',
    fetcher: fetchAssignees,
    dedupingInterval: 5 * 60 * 1000, // 5 minutes
  }),
}

// Simulate fetching labels from an API
async function fetchLabels(query?: string): Promise<NodeDef[]> {
  await sleep(800)

  const labels = [
    { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Bug', color: 'red' },
    {
      id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      name: 'Enhancement',
      color: 'green',
    },
    { id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', name: 'Task', color: 'blue' },
    {
      id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
      name: 'Urgent',
      color: 'pink',
    },
    {
      id: '6ba7b813-9dad-11d1-80b4-00c04fd430c8',
      name: 'Low Priority',
      color: 'lime',
    },
    {
      id: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
      name: 'Frontend',
      color: 'orange',
    },
    {
      id: '6ba7b815-9dad-11d1-80b4-00c04fd430c8',
      name: 'Backend',
      color: 'teal',
    },
    {
      id: '6ba7b816-9dad-11d1-80b4-00c04fd430c8',
      name: 'Database',
      color: 'violet',
    },
    { id: '6ba7b817-9dad-11d1-80b4-00c04fd430c8', name: 'API', color: 'red' },
    {
      id: '6ba7b818-9dad-11d1-80b4-00c04fd430c8',
      name: 'AI Model',
      color: 'cyan',
    },
    {
      id: '6ba7b819-9dad-11d1-80b4-00c04fd430c8',
      name: 'Data Pipeline',
      color: 'amber',
    },
    {
      id: '6ba7b81a-9dad-11d1-80b4-00c04fd430c8',
      name: 'Inference',
      color: 'emerald',
    },
    {
      id: '6ba7b81b-9dad-11d1-80b4-00c04fd430c8',
      name: 'AI Integration',
      color: 'purple',
    },
    {
      id: '6ba7b81c-9dad-11d1-80b4-00c04fd430c8',
      name: 'Ethics',
      color: 'fuchsia',
    },
    {
      id: '6ba7b81d-9dad-11d1-80b4-00c04fd430c8',
      name: 'Refactor',
      color: 'lime',
    },
    {
      id: '6ba7b81e-9dad-11d1-80b4-00c04fd430c8',
      name: 'Performance',
      color: 'red',
    },
    {
      id: '6ba7b81f-9dad-11d1-80b4-00c04fd430c8',
      name: 'Security',
      color: 'sky',
    },
    {
      id: '6ba7b820-9dad-11d1-80b4-00c04fd430c8',
      name: 'Testing',
      color: 'yellow',
    },
    {
      id: '6ba7b821-9dad-11d1-80b4-00c04fd430c8',
      name: 'Documentation',
      color: 'rose',
    },
    {
      id: '6ba7b822-9dad-11d1-80b4-00c04fd430c8',
      name: 'In Progress',
      color: 'green',
    },
  ]

  const menuItems = labels.map((label) => ({
    kind: 'item' as const,
    id: label.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-'),
    label: label.name,
    keywords: [label.name],
    icon: (
      <div
        className={cn(
          'rounded-full !size-2.5',
          LABEL_STYLES_BG[label.color as TW_COLOR],
        )}
      />
    ),
  }))

  if (!query) return menuItems.slice(0, 20)

  return menuItems
    .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 20)
}

const labelsMenu: SubmenuDef = {
  kind: 'submenu',
  icon: LabelsIcon,
  label: 'Labels',
  inputPlaceholder: 'Labels...',
  search: { mode: 'server' },
  loader: swrLoader(({ query }) => ({
    key: query ? `labels-${query}` : 'labels',
    fetcher: () => fetchLabels(query),
  })),
}

const projectStatusMenu: SubmenuDef = {
  kind: 'submenu',
  icon: <ProjectStatusIcon />,
  label: 'Project status',
  inputPlaceholder: 'Project status...',
  nodes: [
    {
      kind: 'item',
      label: 'Failed',
      icon: <ProjectStatus.Failed />,
    },
    {
      kind: 'item',
      label: 'Backlog',
      icon: <ProjectStatus.Backlog />,
    },
    {
      kind: 'item',
      label: 'Planned',
      icon: <ProjectStatus.Planned />,
    },
    {
      kind: 'item',
      label: 'In Progress',
      icon: <ProjectStatus.InProgress />,
    },
    {
      kind: 'item',
      label: 'Completed',
      icon: <ProjectStatus.Completed />,
    },
    {
      kind: 'item',
      label: 'Canceled',
      icon: <ProjectStatus.Canceled />,
    },
  ],
}

const projectStatusTypeMenu: SubmenuDef = {
  kind: 'submenu',
  id: 'project-status-type',
  icon: <ProjectStatusTypeIcon />,
  title: 'Project status type',
  label: 'Project status type',
  inputPlaceholder: 'Project status type...',
  nodes: [
    {
      kind: 'item',
      id: 'backlog',
      label: 'Backlog',
      icon: <ProjectStatusType.Backlog />,
    },
    {
      kind: 'item',
      id: 'planned',
      label: 'Planned',
      icon: <ProjectStatusType.Planned />,
    },
    {
      kind: 'item',
      id: 'in-progress',
      label: 'In Progress',
      icon: <ProjectStatusType.InProgress />,
    },
    {
      kind: 'item',
      id: 'completed',
      label: 'Completed',
      icon: <ProjectStatusType.Completed />,
    },
    {
      kind: 'item',
      id: 'canceled',
      label: 'Canceled',
      icon: <ProjectStatusType.Canceled />,
    },
  ],
}

const projectPriorityMenu: SubmenuDef = {
  kind: 'submenu',
  id: 'project-priority',
  icon: <ProjectPriorityIcon />,
  title: 'Project priority',
  label: 'Project priority',
  inputPlaceholder: 'Project priority...',
  nodes: [
    {
      kind: 'item',
      id: 'no-priority',
      label: 'No priority',
      icon: <ProjectPriority.NoPriority />,
    },
    {
      kind: 'item',
      id: 'urgent',
      label: 'Urgent',
      icon: <ProjectPriority.Urgent />,
    },
    {
      kind: 'item',
      id: 'high',
      label: 'High',
      icon: <ProjectPriority.High />,
    },
    {
      kind: 'item',
      id: 'medium',
      label: 'Medium',
      icon: <ProjectPriority.Medium />,
    },
    {
      kind: 'item',
      id: 'low',
      label: 'Low',
      icon: <ProjectPriority.Low />,
    },
  ],
}

const projectLabelNodes = [
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

const projectLabelsMenu: SubmenuDef = {
  kind: 'submenu',
  id: 'project-labels',
  icon: <LabelsIcon />,
  title: 'Project labels',
  label: 'Project labels',
  inputPlaceholder: 'Project labels...',
  nodes: projectLabelNodes.map((label) => ({
    kind: 'item' as const,
    id: label.id,
    label: label.name,
    keywords: [label.name],
    icon: (
      <div
        className={cn(
          'rounded-full !size-2.5',
          LABEL_STYLES_BG[label.color as TW_COLOR],
        )}
      />
    ),
  })),
}

const projectLeadMenu: SubmenuDef = {
  kind: 'submenu',
  id: 'project-lead',
  icon: <ProjectLeadIcon />,
  title: 'Project lead',
  label: 'Project lead',
  inputPlaceholder: 'Project lead...',
  nodes: [
    {
      kind: 'item',
      id: '@kianbazza',
      label: 'Kian Bazza',
      keywords: ['Kian Bazza'],
      icon: (
        <Avatar>
          <AvatarImage
            src="https://github.com/kianbazza.png"
            alt="@kianbazza"
          />
          <AvatarFallback>KB</AvatarFallback>
        </Avatar>
      ),
    },
    {
      kind: 'item',
      id: '@shadcn',
      label: 'shadcn',
      keywords: ['shadcn'],
      icon: (
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      ),
    },
    {
      kind: 'item',
      id: '@rauchg',
      label: 'Guillermo Rauch',
      keywords: ['Guillermo Rauch'],
      icon: (
        <Avatar>
          <AvatarImage src="https://github.com/rauchg.png" alt="@rauchg" />
          <AvatarFallback>RG</AvatarFallback>
        </Avatar>
      ),
    },
    {
      kind: 'item',
      id: '@t3dotgg',
      label: 'Theo Browne',
      keywords: ['Theo Browne'],
      icon: (
        <Avatar>
          <AvatarImage src="https://github.com/t3dotgg.png" alt="@t3dotgg" />
          <AvatarFallback>TB</AvatarFallback>
        </Avatar>
      ),
    },
  ],
}

const projectPropertiesMenu: SubmenuDef = {
  kind: 'submenu',
  icon: <ProjectPropertiesIcon />,
  title: 'Project properties',
  label: 'Project properties',
  inputPlaceholder: 'Project properties...',
  nodes: [
    projectStatusMenu,
    projectStatusTypeMenu,
    projectPriorityMenu,
    projectLabelsMenu,
    projectLeadMenu,
  ],
}

const priorityMenu: SubmenuDef = {
  kind: 'submenu',
  id: 'priority',
  icon: <ProjectPriorityIcon />,
  title: 'Priority',
  label: 'Priority',
  inputPlaceholder: 'Priority...',
  nodes: [
    {
      kind: 'item',
      id: 'no-priority',
      label: 'No priority',
      icon: <ProjectPriority.NoPriority />,
    },
    {
      kind: 'item',
      id: 'urgent',
      label: 'Urgent',
      icon: <ProjectPriority.Urgent />,
    },
    {
      kind: 'item',
      id: 'high',
      label: 'High',
      icon: <ProjectPriority.High />,
    },
    {
      kind: 'item',
      id: 'medium',
      label: 'Medium',
      icon: <ProjectPriority.Medium />,
    },
    {
      kind: 'item',
      id: 'low',
      label: 'Low',
      icon: <ProjectPriority.Low />,
    },
  ],
}

export const menuData: MenuDef = {
  id: 'issue-properties',
  defaults: {
    item: {
      closeOnSelect: true,
      onSelect: ({ node }) => {
        const parentTitle = node.parent.title?.toLowerCase() || 'property'
        toast(`Changed ${parentTitle} to ${node.label}.`)
      },
    },
  },
  search: {
    minLength: 2,
  },
  nodes: [
    statusMenu,
    assigneeMenu,
    priorityMenu,
    labelsMenu,
    projectPropertiesMenu,
  ],
}
