'use client'

import type {
  GroupDef,
  NodeDef,
  SuggestionMenuTextTriggerMatch,
} from '@bazza-ui/react/suggestion-menu'
import { BoxIcon } from 'lucide-react'
import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SuggestionMenu } from '@/registry/ui/suggestion-menu'

type User = { name: string; username: string; agent?: boolean }
type Project = { name: string; status: string; color: string }

const users: User[] = [
  { name: 'Kian Bazza', username: 'kianbazza' },
  { name: 'Lee Robinson', username: 'leerob' },
  { name: 'Shu Ding', username: 'shuding' },
  { name: 'Delba de Oliveira', username: 'delbaoliveira' },
  { name: 'Triage', username: 'triage', agent: true },
]

const projects: Project[] = [
  { name: 'Menu v2', status: 'In Progress', color: 'text-amber-500' },
  { name: 'Data views', status: 'Planned', color: 'text-blue-500' },
  { name: 'Docs refresh', status: 'Backlog', color: 'text-muted-foreground' },
  { name: 'Suggestion menu', status: 'Completed', color: 'text-violet-500' },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}

function group(id: string, label: string, nodes: NodeDef[]): GroupDef {
  return {
    kind: 'group',
    id,
    label,
    nodes,
    render: ({ props, children, context }) => (
      <SuggestionMenu.Group {...props}>
        <SuggestionMenu.GroupLabel>{context.label}</SuggestionMenu.GroupLabel>
        {children}
      </SuggestionMenu.Group>
    ),
  }
}

function Rows() {
  const { nodes, renderNode } = SuggestionMenu.useDataList()
  return <>{nodes.map(renderNode)}</>
}

export default function SuggestionMenuMentions() {
  const [menu] = React.useState(() =>
    SuggestionMenu.createHandle<SuggestionMenuTextTriggerMatch>(),
  )
  const triggerRef = SuggestionMenu.useTextTrigger(menu, {
    triggers: [{ char: '@', allowSpaces: true }],
  })

  // Replaces the trigger and its query with `text`.
  const insert = React.useCallback(
    (text: string) => {
      const field = menu.host as HTMLTextAreaElement | null
      const match = menu.payload
      if (!field || !match) return
      field.setRangeText(text, match.from, match.to, 'end')
      field.dispatchEvent(new Event('input', { bubbles: true }))
    },
    [menu],
  )

  const content = React.useMemo(
    (): NodeDef[] => [
      group(
        'users',
        'Users',
        users.map((user) => ({
          kind: 'item',
          value: user.username,
          label: user.name,
          keywords: [user.name],
          onSelect: () => insert(`@${user.username} `),
          render: ({ props }) => (
            <SuggestionMenu.Item {...props}>
              <Avatar className="size-4">
                {!user.agent && (
                  <AvatarImage
                    alt=""
                    src={`https://github.com/${user.username}.png`}
                  />
                )}
                <AvatarFallback className="text-[8px]">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{user.name}</span>
              {user.agent ? (
                <span className="rounded-sm bg-muted px-1 py-px text-[10px] font-medium text-muted-foreground">
                  Agent
                </span>
              ) : (
                <span className="truncate text-muted-foreground">
                  {user.username}
                </span>
              )}
            </SuggestionMenu.Item>
          ),
        })),
      ),
      {
        kind: 'separator',
        id: 'users-projects',
        render: ({ props }) => <SuggestionMenu.Separator {...props} />,
      },
      group(
        'projects',
        'Projects',
        projects.map((project) => ({
          kind: 'item',
          value: project.name,
          keywords: [project.status],
          onSelect: () => insert(`${project.name} `),
          render: ({ props }) => (
            <SuggestionMenu.Item {...props}>
              <SuggestionMenu.Icon className={project.color}>
                <BoxIcon />
              </SuggestionMenu.Icon>
              <span className="truncate">{project.name}</span>
              <span className="ml-auto shrink-0 pl-4 text-xs text-muted-foreground">
                {project.status}
              </span>
            </SuggestionMenu.Item>
          ),
        })),
      ),
    ],
    [insert],
  )

  return (
    <div className="w-full max-w-md">
      <textarea
        ref={triggerRef}
        rows={4}
        placeholder="Leave a comment… type @ to mention someone or a project"
        className="[font-feature-settings:'calt'_0] w-full resize-none rounded-lg border bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      <SuggestionMenu.Root handle={menu}>
        <SuggestionMenu.Portal>
          <SuggestionMenu.Positioner>
            <SuggestionMenu.Popup className="w-80">
              <SuggestionMenu.Surface content={content}>
                <SuggestionMenu.List maxHeight={400}>
                  <Rows />
                  <SuggestionMenu.Empty>
                    No people or projects found.
                  </SuggestionMenu.Empty>
                </SuggestionMenu.List>
              </SuggestionMenu.Surface>
            </SuggestionMenu.Popup>
          </SuggestionMenu.Positioner>
        </SuggestionMenu.Portal>
      </SuggestionMenu.Root>
    </div>
  )
}
