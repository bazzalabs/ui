'use client'

import {
  type CommandMenuControl,
  composeMiddleware,
  createNew,
  type MenuDef,
  type NodeDef,
  renderIcon,
  type SubmenuDef,
} from '@bazza-ui/command-menu'
import { queryLoader } from '@bazza-ui/loaders/query'
import { DialogContent } from '@radix-ui/react-dialog'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PlusIcon, SearchIcon } from 'lucide-react'
import { motion, useAnimate } from 'motion/react'
import { useRef } from 'react'
import { toast } from 'sonner'
import { sleep } from '@/app/demos/server/tst-query/_/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CommandMenu } from '@/registry/components/command-menu'
import { LABEL_STYLES_BG, type TW_COLOR } from '../action-menu/linear-async'
import {
  AssigneeIcon,
  LabelsIcon,
  ProjectPropertiesIcon,
  ProjectStatus,
  ProjectStatusIcon,
  Status,
  StatusIcon,
} from '../action-menu/shared/icons'

const queryClient = new QueryClient()

export function CommandMenu_LinearAsync() {
  const controlRef = useRef<CommandMenuControl>(null!)
  const [scope, animate] = useAnimate()

  return (
    <QueryClientProvider client={queryClient}>
      <CommandMenu
        controlRef={controlRef}
        slots={{
          DialogContent: ({ children, bind }) => {
            const props = bind.getDialogContentProps()

            return (
              <DialogContent asChild {...props} ref={scope}>
                <motion.div>{children}</motion.div>
              </DialogContent>
            )
          },
        }}
        onNavigationChange={(event) => {
          if (event.nextBreadcrumbs.length === 0) return

          animate(scope.current, { scale: [1, 0.98, 1] }, { duration: 0.15 })
        }}
        defaults={{
          item: {
            onSelect: ({ node }) => {
              // Now works! parent can be RootMenuNode (no label) or SubmenuNode (has label)
              const parentLabel =
                node.parent.kind === 'submenu'
                  ? node.parent.label || node.parent.title
                  : node.parent.title

              toast(`Changed ${parentLabel?.toLowerCase()} to ${node.label}.`, {
                icon: renderIcon(node.icon, 'size-4'),
              })
            },
          },
        }}
        menu={menuData}
        placeholder="Search properties..."
      >
        <Button variant="ghost" size="sm" className="w-fit">
          <SearchIcon className="size-4" />
          Search
        </Button>
      </CommandMenu>
    </QueryClientProvider>
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
  loader: queryLoader(() => ({
    queryKey: ['assignees'],
    queryFn: fetchAssignees,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })),
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
  loader: queryLoader(({ query }) => ({
    queryKey: ['labels', query],
    queryFn: () => fetchLabels(query),
  })),
  middleware: composeMiddleware([
    createNew({
      showWhen: 'no-exact-match',
      position: 'bottom',
      id: '__create-new-label',
      label: (query) => `Create new label: ${query}`,
      icon: <PlusIcon />,
      onCreate: async ({ control }) => {
        // Disable entire menu (input, navigation, items, including this "create new" item)
        const enable = control?.disable()

        await sleep(3000)

        toast('Label created successfully')

        // Re-enable menu and return focus to input
        if (enable) enable()
      },
    }),
  ]),
}

const projectStatusMenu: SubmenuDef = {
  kind: 'submenu',
  icon: <ProjectStatusIcon />,
  label: 'Project status',
  title: 'Project status',
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

const projectPropertiesMenu: SubmenuDef = {
  kind: 'submenu',
  icon: <ProjectPropertiesIcon />,
  label: 'Project properties',
  title: 'Project properties',
  inputPlaceholder: 'Project properties...',
  nodes: [projectStatusMenu],
}

export const menuData: MenuDef = {
  id: 'issue-properties',
  // defaults: {
  //   item: {
  //     closeOnSelect: true,
  //     onSelect: ({ node }) => {
  //       const parentTitle = node.parent.title?.toLowerCase() || 'property'
  //       toast(`Changed ${parentTitle} to ${node.label}.`)
  //     },
  //   },
  // },
  search: {
    minLength: 2,
  },
  nodes: [statusMenu, assigneeMenu, labelsMenu, projectPropertiesMenu],
}
