'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/registry/components/action-menu'

export function ActionMenu_DisabledItems() {
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
            disabled: true,
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
            disabled: true,
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
