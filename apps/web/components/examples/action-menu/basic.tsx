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
            id: 'Apple',
            label: 'Apple',
            icon: '🍎',
          },
          {
            kind: 'item',
            id: 'Banana',
            label: 'Banana',
            icon: '🍌',
          },
          {
            kind: 'item',
            id: 'Orange',
            label: 'Orange',
            icon: '🍊',
          },
          {
            kind: 'item',
            id: 'Pineapple',
            label: 'Pineapple',
            icon: '🍍',
          },
          {
            kind: 'item',
            id: 'Strawberry',
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
