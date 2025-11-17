'use client'

import type { MenuDef } from '@bazza-ui/context-menu'
import {
  LoaderAdapterProvider,
  renderIcon,
  type SubmenuDef,
} from '@bazza-ui/menu'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { ContextMenu } from '@/registry/context-menu'
import {
  AssigneeIcon,
  LabelsIcon,
  ProjectPropertiesIcon,
  ProjectStatus,
  ProjectStatusIcon,
  Status,
  StatusIcon,
} from '../action-menu/shared/icons'
import { ReactQueryLoaderAdapter } from '@bazza-ui/command-menu/loaders/tanstack-query'

export function ContextMenu_Linear() {
  return (
    <LoaderAdapterProvider adapter={ReactQueryLoaderAdapter}>
      <ContextMenu
        menu={menuData}
        disableOutsidePointerEvents
        onEscapeKeyDown={() => {
          console.log('escaping outside!!')
        }}
      >
        <div className="relative h-48 w-full rounded-lg border p-4">
          <div className="prose prose-sm dark:prose-invert">
            <p className="font-semibold">Project Task Card</p>
            <p className="text-muted-foreground text-sm">
              Right-click on this card to change issue properties like status,
              assignee, labels, and project settings.
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="text-xs bg-muted px-2 py-1 rounded">
                Status: Todo
              </span>
              <span className="text-xs bg-muted px-2 py-1 rounded">
                Assignee: None
              </span>
            </div>
          </div>
        </div>
      </ContextMenu>
    </LoaderAdapterProvider>
  )
}

const statusMenu: SubmenuDef = {
  kind: 'submenu',
  label: 'Status',
  icon: <StatusIcon />,
  nodes: [
    {
      kind: 'item',
      label: 'Icebox',
      icon: <Status.Icebox />,
      onSelect: () =>
        toast('Changed status to Icebox.', {
          icon: renderIcon(<Status.Icebox />, 'size-4'),
        }),
    },
    {
      kind: 'item',
      label: 'Backlog',
      icon: <Status.Backlog />,
      onSelect: () =>
        toast('Changed status to Backlog.', {
          icon: renderIcon(<Status.Backlog />, 'size-4'),
        }),
    },
    {
      kind: 'item',
      label: 'Todo',
      icon: <Status.Todo />,
      onSelect: () =>
        toast('Changed status to Todo.', {
          icon: renderIcon(<Status.Todo />, 'size-4'),
        }),
    },
    {
      kind: 'item',
      label: 'In Progress',
      icon: <Status.InProgress />,
      onSelect: () =>
        toast('Changed status to In Progress.', {
          icon: renderIcon(<Status.InProgress />, 'size-4'),
        }),
    },
    {
      kind: 'item',
      label: 'Done',
      icon: <Status.Done />,
      onSelect: () =>
        toast('Changed status to Done.', {
          icon: renderIcon(<Status.Done />, 'size-4'),
        }),
    },
  ],
}

const assigneeMenu: SubmenuDef = {
  kind: 'submenu',
  label: 'Assignee',
  icon: <AssigneeIcon />,
  nodes: [
    {
      kind: 'item',
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
      onSelect: () =>
        toast('Changed assignee to Kian Bazza.', {
          icon: renderIcon(
            <Avatar>
              <AvatarImage
                src="https://github.com/kianbazza.png"
                alt="@kianbazza"
              />
              <AvatarFallback>KB</AvatarFallback>
            </Avatar>,
            'size-4',
          ),
        }),
    },
    {
      kind: 'item',
      label: 'shadcn',
      icon: (
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      ),
      onSelect: () =>
        toast('Changed assignee to shadcn.', {
          icon: renderIcon(
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>,
            'size-4',
          ),
        }),
    },
    {
      kind: 'item',
      label: 'Guillermo Rauch',
      icon: (
        <Avatar>
          <AvatarImage src="https://github.com/rauchg.png" alt="@rauchg" />
          <AvatarFallback>RG</AvatarFallback>
        </Avatar>
      ),
      onSelect: () =>
        toast('Changed assignee to Guillermo Rauch.', {
          icon: renderIcon(
            <Avatar>
              <AvatarImage src="https://github.com/rauchg.png" alt="@rauchg" />
              <AvatarFallback>RG</AvatarFallback>
            </Avatar>,
            'size-4',
          ),
        }),
    },
    {
      kind: 'item',
      label: 'Theo Browne',
      icon: (
        <Avatar>
          <AvatarImage src="https://github.com/t3dotgg.png" alt="@t3dotgg" />
          <AvatarFallback>TB</AvatarFallback>
        </Avatar>
      ),
      onSelect: () =>
        toast('Changed assignee to Theo Browne.', {
          icon: renderIcon(
            <Avatar>
              <AvatarImage
                src="https://github.com/t3dotgg.png"
                alt="@t3dotgg"
              />
              <AvatarFallback>TB</AvatarFallback>
            </Avatar>,
            'size-4',
          ),
        }),
    },
  ],
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

const labelNodes = [
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
    name: 'Documentation',
    color: 'rose',
  },
  {
    id: '6ba7b819-9dad-11d1-80b4-00c04fd430c8',
    name: 'Testing',
    color: 'yellow',
  },
  {
    id: '6ba7b81a-9dad-11d1-80b4-00c04fd430c8',
    name: 'Security',
    color: 'sky',
  },
].map((label) => ({
  kind: 'item' as const,
  label: label.name,
  icon: (
    <div
      className={cn(
        'rounded-full !size-2.5',
        LABEL_STYLES_BG[label.color as TW_COLOR],
      )}
    />
  ),
  onSelect: () =>
    toast(`Added label: ${label.name}.`, {
      icon: renderIcon(
        <div
          className={cn(
            'rounded-full !size-2.5',
            LABEL_STYLES_BG[label.color as TW_COLOR],
          )}
        />,
        'size-4',
      ),
    }),
}))

const labelsMenu: SubmenuDef = {
  kind: 'submenu',
  label: 'Labels',
  icon: LabelsIcon,
  nodes: labelNodes,
}

const projectStatusMenu: SubmenuDef = {
  kind: 'submenu',
  label: 'Project status',
  icon: <ProjectStatusIcon />,
  hideSearchUntilActive: true,
  nodes: [
    {
      kind: 'item',
      label: 'Failed',
      icon: <ProjectStatus.Failed />,
      onSelect: () =>
        toast('Changed project status to Failed.', {
          icon: renderIcon(<ProjectStatus.Failed />, 'size-4'),
        }),
    },
    {
      kind: 'item',
      label: 'Backlog',
      icon: <ProjectStatus.Backlog />,
      onSelect: () =>
        toast('Changed project status to Backlog.', {
          icon: renderIcon(<ProjectStatus.Backlog />, 'size-4'),
        }),
    },
    {
      kind: 'item',
      label: 'Planned',
      icon: <ProjectStatus.Planned />,
      onSelect: () =>
        toast('Changed project status to Planned.', {
          icon: renderIcon(<ProjectStatus.Planned />, 'size-4'),
        }),
    },
    {
      kind: 'item',
      label: 'In Progress',
      icon: <ProjectStatus.InProgress />,
      onSelect: () =>
        toast('Changed project status to In Progress.', {
          icon: renderIcon(<ProjectStatus.InProgress />, 'size-4'),
        }),
    },
    {
      kind: 'item',
      label: 'Completed',
      icon: <ProjectStatus.Completed />,
      onSelect: () =>
        toast('Changed project status to Completed.', {
          icon: renderIcon(<ProjectStatus.Completed />, 'size-4'),
        }),
    },
    {
      kind: 'item',
      label: 'Canceled',
      icon: <ProjectStatus.Canceled />,
      onSelect: () =>
        toast('Changed project status to Canceled.', {
          icon: renderIcon(<ProjectStatus.Canceled />, 'size-4'),
        }),
    },
  ],
}

const projectPropertiesMenu: SubmenuDef = {
  kind: 'submenu',
  label: 'Project properties',
  icon: <ProjectPropertiesIcon />,
  nodes: [projectStatusMenu],
}

export const menuData: MenuDef = {
  id: 'unique',
  nodes: [statusMenu, assigneeMenu, labelsMenu, projectPropertiesMenu],
}
