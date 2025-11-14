'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/registry/action-menu'

export function ActionMenu_Basic() {
  return (
    <ActionMenu
      menu={{
        id: 'root',
        defaults: {
          item: {
            closeOnSelect: true,
            onSelect: ({ node }) => {
              toast(`${node.icon} ${node.label}`)
            },
          },
        },
        nodes: [
          {
            kind: 'item',
            label: 'Apple',
            icon: '🍎',
          },
          {
            kind: 'item',
            label: 'Banana',
            icon: '🍌',
          },
          {
            kind: 'item',
            label: 'Orange',
            icon: '🍊',
          },
          {
            kind: 'item',
            label: 'Pineapple',
            icon: '🍍',
          },
          {
            kind: 'item',
            label: 'Strawberry',
            icon: '🍓',
          },
        ],
      }}
    >
      <ActionMenu.Trigger asChild>
        <Button variant="secondary">Trigger</Button>
      </ActionMenu.Trigger>
    </ActionMenu>
  )
}
