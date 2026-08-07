'use client'

import type {
  GroupLabelRenderParams,
  NodeDef,
} from '@bazza-ui/react/dropdown-menu'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export default function VirtualizedGroupsExample() {
  const [channel, setChannel] = React.useState('email-25')
  const content = React.useMemo<NodeDef[]>(
    () => [
      ...['Profile', 'Settings', 'Sign out'].map((value) => ({
        kind: 'item' as const,
        id: value.toLowerCase().replace(' ', '-'),
        value,
        render: ({ props }: { props: { id: string; value: string } }) => (
          <DropdownMenu.Item {...props}>{value}</DropdownMenu.Item>
        ),
      })),
      {
        kind: 'separator',
        id: 'sep-1',
        render: () => <DropdownMenu.Separator />,
      },
      {
        kind: 'group',
        id: 'labeled',
        label: 'Labeled group',
        nodes: Array.from({ length: 50 }, (_, index) => {
          const value = `Item L${index + 1}`
          return {
            kind: 'item' as const,
            id: `l-${index + 1}`,
            value,
            render: ({ props }: { props: { id: string; value: string } }) => (
              <DropdownMenu.Item {...props}>{value}</DropdownMenu.Item>
            ),
          }
        }),
      },
      {
        kind: 'group',
        id: 'unlabeled',
        nodes: Array.from({ length: 25 }, (_, index) => {
          const value = `Item U${index + 1}`
          return {
            kind: 'item' as const,
            id: `u-${index + 1}`,
            value,
            render: ({ props }: { props: { id: string; value: string } }) => (
              <DropdownMenu.Item {...props}>{value}</DropdownMenu.Item>
            ),
          }
        }),
      },
      {
        kind: 'separator',
        id: 'sep-2',
        render: () => <DropdownMenu.Separator />,
      },
      {
        kind: 'radio-group',
        id: 'channel',
        label: 'Channel (500 options)',
        value: channel,
        onValueChange: (value) => setChannel(value),
        nodes: Array.from({ length: 500 }, (_, index) => {
          const value = `email-${index + 1}`
          return {
            kind: 'radio-item' as const,
            id: value,
            value,
            render: ({ props }: { props: { id: string; value: string } }) => (
              <DropdownMenu.RadioItem {...props}>
                {value}
              </DropdownMenu.RadioItem>
            ),
          }
        }),
      },
      {
        kind: 'group',
        id: 'teams',
        label: 'Teams',
        renderLabel: ({ props, context }: GroupLabelRenderParams) => (
          <DropdownMenu.GroupLabel
            {...props}
            className="flex items-center gap-2"
          >
            {context.label}
            <span className="text-[10px] text-muted-foreground">custom</span>
          </DropdownMenu.GroupLabel>
        ),
        nodes: [
          createTeamNode(
            'Engineering',
            Array.from({ length: 30 }, (_, index) =>
              createTeamNode(`Team ${index + 1}`),
            ),
            false,
          ),
        ],
      },
    ],
    [channel],
  )

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Open virtualized groups
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface content={content}>
              <DropdownMenu.Input placeholder="Search..." />
              <DropdownMenu.List virtualized />
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function createTeamNode(
  value: string,
  nodes?: NodeDef[],
  selectable = true,
): NodeDef {
  return {
    kind: 'tree-item',
    value,
    selectable,
    nodes,
    render: ({ props, context }) => (
      <DropdownMenu.TreeItem {...props} depth={context.tree?.depth}>
        {context.tree && context.tree.depth > 0 && (
          <DropdownMenu.TreeConnector tree={context.tree} />
        )}
        <span className="truncate">{value}</span>
      </DropdownMenu.TreeItem>
    ),
  }
}
