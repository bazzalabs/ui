'use client'

import {
  type GroupDef,
  type MenuDef,
  renderIcon,
  type SubmenuDef,
} from '@bazza-ui/action-menu'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { ActionMenu } from '@/registry/action-menu'
import { generateItems } from './shared/generate-items'
import {
  AssigneeIcon,
  DurationIcon,
  LabelsIcon,
  ProjectPropertiesIcon,
  ProjectStatus,
  ProjectStatusIcon,
  Status,
  StatusIcon,
} from './shared/icons'

export function ActionMenu_KitchenSink01() {
  return (
    <ActionMenu
      trigger={
        <Button variant="ghost" size="sm" className="w-fit">
          <FilterIcon />
          Filter
        </Button>
      }
      menu={menuData}
    />
  )
}

const FilterIcon = () => (
  <svg
    className="fill-muted-foreground size-4"
    viewBox="0 0 16 16"
    role="img"
    focusable="false"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.25 3a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5h12.5ZM4 8a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 4 8Zm2.75 3.5a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5h-2.5Z"
    ></path>
  </svg>
)

const statusMenu: SubmenuDef = {
  kind: 'submenu',
  id: 'status',
  icon: <StatusIcon />,
  label: 'Status',
  title: 'Status',
  inputPlaceholder: 'Status...',
  nodes: [
    {
      kind: 'item',
      id: 'icebox',
      label: 'Icebox',
      icon: <Status.Icebox />,
    },
    {
      kind: 'item',
      id: 'backlog',
      label: 'Backlog',
      icon: <Status.Backlog />,
    },
    {
      kind: 'item',
      id: 'todo',
      label: 'Todo',
      icon: <Status.Todo />,
    },
    {
      kind: 'item',
      id: 'in-progress',
      label: 'In Progress',
      icon: <Status.InProgress />,
    },
    {
      kind: 'item',
      id: 'done',
      label: 'Done',
      icon: <Status.Done />,
    },
  ],
}

const assigneeMenu: SubmenuDef = {
  kind: 'submenu',
  id: 'assignee',
  icon: <AssigneeIcon />,
  label: 'Assignee',
  title: 'Assignee',
  inputPlaceholder: 'Assignee...',
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

const durationMenu: SubmenuDef = {
  kind: 'submenu',
  id: 'duration',
  icon: <DurationIcon />,
  label: 'Duration',
  title: 'Duration',
  render: () => {
    return (
      <div className="w-[300px] h-[200px] p-4">
        <Slider />
      </div>
    )
  },
  // nodes: [
  //   {
  //     kind: 'item',
  //     id: 'duration-controller',
  //     render: ({ node, bind, search }) => {
  //     },
  //   },
  // ],
}

export const LABEL_STYLES_BG = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
  neutral: 'bg-neutral-500',
}

export type TW_COLOR = keyof typeof LABEL_STYLES_BG

const labelsMenu: SubmenuDef = {
  kind: 'submenu',
  id: 'labels',
  icon: LabelsIcon,
  title: 'Labels',
  label: 'Labels',
  inputPlaceholder: 'Labels...',
  nodes: [
    // {
    //   id: '550e8401-e29b-41d4-a716-446655440000',
    //   name: 'A super, duper long label for testing overflow behaviour and truncating',
    //   color: 'red',
    // },
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
    {
      id: '6ba7b823-9dad-11d1-80b4-00c04fd430c8',
      name: 'Blocked',
      color: 'indigo',
    },
    {
      id: '6ba7b824-9dad-11d1-80b4-00c04fd430c8',
      name: 'Needs Review',
      color: 'orange',
    },
    { id: '6ba7b825-9dad-11d1-80b4-00c04fd430c8', name: 'Done', color: 'teal' },
    { id: '6ba7b826-9dad-11d1-80b4-00c04fd430c8', name: 'UI', color: 'red' },
    { id: '6ba7b827-9dad-11d1-80b4-00c04fd430c8', name: 'UX', color: 'sky' },
    {
      id: '6ba7b828-9dad-11d1-80b4-00c04fd430c8',
      name: 'Accessibility',
      color: 'red',
    },
    {
      id: '6ba7b829-9dad-11d1-80b4-00c04fd430c8',
      name: 'Deployment',
      color: 'emerald',
    },
    {
      id: '6ba7b82a-9dad-11d1-80b4-00c04fd430c8',
      name: 'Infrastructure',
      color: 'purple',
    },
    {
      id: '6ba7b82b-9dad-11d1-80b4-00c04fd430c8',
      name: 'Monitoring',
      color: 'pink',
    },
    {
      id: '6ba7b82c-9dad-11d1-80b4-00c04fd430c8',
      name: 'Real-Time',
      color: 'lime',
    },
    {
      id: '6ba7b82d-9dad-11d1-80b4-00c04fd430c8',
      name: 'Scalability',
      color: 'amber',
    },
    {
      id: '6ba7b82e-9dad-11d1-80b4-00c04fd430c8',
      name: 'Third-Party',
      color: 'cyan',
    },
    {
      id: '6ba7b82f-9dad-11d1-80b4-00c04fd430c8',
      name: 'Authentication',
      color: 'rose',
    },
    {
      id: '6ba7b830-9dad-11d1-80b4-00c04fd430c8',
      name: 'Authorization',
      color: 'green',
    },
    {
      id: '6ba7b831-9dad-11d1-80b4-00c04fd430c8',
      name: 'Caching',
      color: 'lime',
    },
    {
      id: '6ba7b832-9dad-11d1-80b4-00c04fd430c8',
      name: 'Logging',
      color: 'red',
    },
    {
      id: '6ba7b833-9dad-11d1-80b4-00c04fd430c8',
      name: 'Analytics',
      color: 'sky',
    },
    {
      id: '6ba7b834-9dad-11d1-80b4-00c04fd430c8',
      name: 'Feature Request',
      color: 'orange',
    },
    {
      id: '6ba7b835-9dad-11d1-80b4-00c04fd430c8',
      name: 'Regression',
      color: 'teal',
    },
    {
      id: '6ba7b836-9dad-11d1-80b4-00c04fd430c8',
      name: 'Hotfix',
      color: 'red',
    },
    {
      id: '6ba7b837-9dad-11d1-80b4-00c04fd430c8',
      name: 'Code Review',
      color: 'emerald',
    },
    {
      id: '6ba7b838-9dad-11d1-80b4-00c04fd430c8',
      name: 'Tech Debt',
      color: 'purple',
    },
    {
      id: '6ba7b839-9dad-11d1-80b4-00c04fd430c8',
      name: 'Migration',
      color: 'pink',
    },
    {
      id: '6ba7b83a-9dad-11d1-80b4-00c04fd430c8',
      name: 'Configuration',
      color: 'lime',
    },
    {
      id: '6ba7b83b-9dad-11d1-80b4-00c04fd430c8',
      name: 'Validation',
      color: 'amber',
    },
    {
      id: '6ba7b83c-9dad-11d1-80b4-00c04fd430c8',
      name: 'Input Handling',
      color: 'cyan',
    },
    {
      id: '6ba7b83d-9dad-11d1-80b4-00c04fd430c8',
      name: 'Error Handling',
      color: 'rose',
    },
    {
      id: '6ba7b83e-9dad-11d1-80b4-00c04fd430c8',
      name: 'Session Management',
      color: 'green',
    },
    {
      id: '6ba7b83f-9dad-11d1-80b4-00c04fd430c8',
      name: 'Concurrency',
      color: 'lime',
    },
    {
      id: '6ba7b840-9dad-11d1-80b4-00c04fd430c8',
      name: 'Load Balancing',
      color: 'red',
    },
    {
      id: '6ba7b841-9dad-11d1-80b4-00c04fd430c8',
      name: 'Data Migration',
      color: 'sky',
    },
    {
      id: '6ba7b842-9dad-11d1-80b4-00c04fd430c8',
      name: 'Model Training',
      color: 'orange',
    },
    {
      id: '6ba7b843-9dad-11d1-80b4-00c04fd430c8',
      name: 'Hyperparameters',
      color: 'teal',
    },
    {
      id: '6ba7b844-9dad-11d1-80b4-00c04fd430c8',
      name: 'Overfitting',
      color: 'red',
    },
    {
      id: '6ba7b845-9dad-11d1-80b4-00c04fd430c8',
      name: 'Underfitting',
      color: 'emerald',
    },
    {
      id: '6ba7b846-9dad-11d1-80b4-00c04fd430c8',
      name: 'Feature Engineering',
      color: 'purple',
    },
    {
      id: '6ba7b847-9dad-11d1-80b4-00c04fd430c8',
      name: 'Data Quality',
      color: 'pink',
    },
    {
      id: '6ba7b848-9dad-11d1-80b4-00c04fd430c8',
      name: 'Preprocessing',
      color: 'lime',
    },
    {
      id: '6ba7b849-9dad-11d1-80b4-00c04fd430c8',
      name: 'Model Deployment',
      color: 'amber',
    },
    {
      id: '6ba7b84a-9dad-11d1-80b4-00c04fd430c8',
      name: 'Latency',
      color: 'cyan',
    },
    {
      id: '6ba7b84b-9dad-11d1-80b4-00c04fd430c8',
      name: 'Throughput',
      color: 'rose',
    },
    {
      id: '6ba7b84c-9dad-11d1-80b4-00c04fd430c8',
      name: 'API Versioning',
      color: 'green',
    },
    {
      id: '6ba7b84d-9dad-11d1-80b4-00c04fd430c8',
      name: 'Rate Limiting',
      color: 'lime',
    },
    {
      id: '6ba7b84e-9dad-11d1-80b4-00c04fd430c8',
      name: 'Throttling',
      color: 'red',
    },
    {
      id: '6ba7b84f-9dad-11d1-80b4-00c04fd430c8',
      name: 'Retry Logic',
      color: 'sky',
    },
    {
      id: '6ba7b850-9dad-11d1-80b4-00c04fd430c8',
      name: 'Fallback',
      color: 'orange',
    },
    {
      id: '6ba7b851-9dad-11d1-80b4-00c04fd430c8',
      name: 'Circuit Breaker',
      color: 'teal',
    },
    {
      id: '6ba7b852-9dad-11d1-80b4-00c04fd430c8',
      name: 'Queue Management',
      color: 'red',
    },
    {
      id: '6ba7b853-9dad-11d1-80b4-00c04fd430c8',
      name: 'Batch Processing',
      color: 'emerald',
    },
    {
      id: '6ba7b854-9dad-11d1-80b4-00c04fd430c8',
      name: 'Streaming',
      color: 'purple',
    },
    {
      id: '6ba7b855-9dad-11d1-80b4-00c04fd430c8',
      name: 'Event Handling',
      color: 'pink',
    },
    {
      id: '6ba7b856-9dad-11d1-80b4-00c04fd430c8',
      name: 'WebSocket',
      color: 'lime',
    },
    {
      id: '6ba7b857-9dad-11d1-80b4-00c04fd430c8',
      name: 'Cron Job',
      color: 'amber',
    },
    {
      id: '6ba7b858-9dad-11d1-80b4-00c04fd430c8',
      name: 'Scheduled Task',
      color: 'cyan',
    },
    {
      id: '6ba7b859-9dad-11d1-80b4-00c04fd430c8',
      name: 'File Upload',
      color: 'rose',
    },
    {
      id: '6ba7b85a-9dad-11d1-80b4-00c04fd430c8',
      name: 'File Processing',
      color: 'green',
    },
    {
      id: '6ba7b85b-9dad-11d1-80b4-00c04fd430c8',
      name: 'Export',
      color: 'lime',
    },
    {
      id: '6ba7b85c-9dad-11d1-80b4-00c04fd430c8',
      name: 'Import',
      color: 'red',
    },
    {
      id: '6ba7b85d-9dad-11d1-80b4-00c04fd430c8',
      name: 'Localization',
      color: 'sky',
    },
    {
      id: '6ba7b85e-9dad-11d1-80b4-00c04fd430c8',
      name: 'Internationalization',
      color: 'orange',
    },
    {
      id: '6ba7b85f-9dad-11d1-80b4-00c04fd430c8',
      name: 'Notifications',
      color: 'teal',
    },
    { id: '6ba7b860-9dad-11d1-80b4-00c04fd430c8', name: 'Email', color: 'red' },
    {
      id: '6ba7b861-9dad-11d1-80b4-00c04fd430c8',
      name: 'Push Notifications',
      color: 'emerald',
    },
    {
      id: '6ba7b862-9dad-11d1-80b4-00c04fd430c8',
      name: 'SMS',
      color: 'purple',
    },
    {
      id: '6ba7b863-9dad-11d1-80b4-00c04fd430c8',
      name: 'Audit Log',
      color: 'pink',
    },
    {
      id: '6ba7b864-9dad-11d1-80b4-00c04fd430c8',
      name: 'Backup',
      color: 'lime',
    },
    {
      id: '6ba7b865-9dad-11d1-80b4-00c04fd430c8',
      name: 'Restore',
      color: 'amber',
    },
    {
      id: '6ba7b866-9dad-11d1-80b4-00c04fd430c8',
      name: 'Disaster Recovery',
      color: 'cyan',
    },
    {
      id: '6ba7b867-9dad-11d1-80b4-00c04fd430c8',
      name: 'Compliance',
      color: 'rose',
    },
    {
      id: '6ba7b868-9dad-11d1-80b4-00c04fd430c8',
      name: 'GDPR',
      color: 'green',
    },
    {
      id: '6ba7b869-9dad-11d1-80b4-00c04fd430c8',
      name: 'HIPAA',
      color: 'lime',
    },
    {
      id: '6ba7b86a-9dad-11d1-80b4-00c04fd430c8',
      name: 'Debugging',
      color: 'red',
    },
    {
      id: '6ba7b86b-9dad-11d1-80b4-00c04fd430c8',
      name: 'Profiling',
      color: 'sky',
    },
    {
      id: '6ba7b86c-9dad-11d1-80b4-00c04fd430c8',
      name: 'Optimization',
      color: 'orange',
    },
    {
      id: '6ba7b86d-9dad-11d1-80b4-00c04fd430c8',
      name: 'Research',
      color: 'teal',
    },
    {
      id: '6ba7b86e-9dad-11d1-80b4-00c04fd430c8',
      name: 'Experiment',
      color: 'red',
    },
    {
      id: '6ba7b86f-9dad-11d1-80b4-00c04fd430c8',
      name: 'Proof of Concept',
      color: 'emerald',
    },
  ].map((label) => ({
    kind: 'item',
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

const projectStatusMenu: SubmenuDef = {
  kind: 'submenu',
  id: 'project-status',
  icon: <ProjectStatusIcon />,
  title: 'Project status',
  label: 'Project status',
  inputPlaceholder: 'Project status...',
  hideSearchUntilActive: true,
  nodes: [
    {
      kind: 'item',
      id: 'failed',
      label: 'Failed',
      icon: <ProjectStatus.Failed />,
    },
    {
      kind: 'item',
      id: 'backlog',
      label: 'Backlog',
      icon: <ProjectStatus.Backlog />,
    },
    {
      kind: 'item',
      id: 'planned',
      label: 'Planned',
      icon: <ProjectStatus.Planned />,
    },
    {
      kind: 'item',
      id: 'in-progress',
      label: 'In Progress',
      icon: <ProjectStatus.InProgress />,
    },
    {
      kind: 'item',
      id: 'completed',
      label: 'Completed',
      icon: <ProjectStatus.Completed />,
    },
    {
      kind: 'item',
      id: 'canceled',
      label: 'Canceled',
      icon: <ProjectStatus.Canceled />,
    },
  ],
}

const projectPropertiesMenu: SubmenuDef = {
  kind: 'submenu',
  id: 'project-properties',
  icon: <ProjectPropertiesIcon />,
  title: 'Project properties',
  label: 'Project properties',
  inputPlaceholder: 'Project properties...',
  nodes: [projectStatusMenu],
}

const groupAMenu: GroupDef = {
  kind: 'group',
  id: 'group-a',
  heading: 'Group A',
  nodes: generateItems(3),
}

const groupBMenu: GroupDef = {
  kind: 'group',
  id: 'group-b',
  heading: 'Group B',
  nodes: generateItems(5),
}

const groupCMenu: GroupDef = {
  kind: 'group',
  id: 'group-c',
  heading: 'Group C',
  nodes: generateItems(7),
}

export const menuData: MenuDef = {
  id: 'issue-properties',
  defaults: {
    item: {
      closeOnSelect: true,
      onSelect: ({ node }) => {
        toast(`Changed ${node.parent.title?.toLowerCase()} to ${node.label}.`, {
          icon: renderIcon(node.icon, 'size-4'),
        })
      },
    },
  },
  nodes: [
    // groupAMenu,
    statusMenu,
    assigneeMenu,
    durationMenu,
    labelsMenu,
    projectPropertiesMenu,
    // groupCMenu,
  ],
}
