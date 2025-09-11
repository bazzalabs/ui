'use client'

import {
  type MenuDef,
  renderIcon,
  type SubmenuDef,
  type SubmenuNode,
} from '@bazza-ui/action-menu'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/registry/action-menu'
import {
  AssigneeIcon,
  ProjectPropertiesIcon,
  ProjectStatus,
  ProjectStatusIcon,
  Status,
  StatusIcon,
} from './shared/icons'

export function ActionMenu_KitchenSink01() {
  return (
    <ActionMenu.Root modal={false}>
      <ActionMenu.Trigger asChild>
        <Button variant="ghost" size="sm" className="w-fit">
          <FilterIcon />
          Filter
        </Button>
      </ActionMenu.Trigger>
      <ActionMenu.Positioner alignToFirstItem={false}>
        <ActionMenu.Surface menu={menuData} />
      </ActionMenu.Positioner>
    </ActionMenu.Root>
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
      icon: (
        <Avatar>
          <AvatarImage src="https://github.com/t3dotgg.png" alt="@t3dotgg" />
          <AvatarFallback>TB</AvatarFallback>
        </Avatar>
      ),
    },
  ],
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

export const menuData: MenuDef = {
  id: 'issue-properties',
  defaults: {
    item: {
      closeOnSelect: true,
      onSelect: ({ node }) => {
        toast(`Changed ${node.parent.title?.toLowerCase()} to ${node.label}.`, {
          icon: renderIcon(node.icon),
        })
      },
    },
  },
  nodes: [statusMenu, assigneeMenu, projectPropertiesMenu],
}
