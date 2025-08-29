'use client'

import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/registry/action-menu'

export function ActionMenu_Basic() {
  return (
    <ActionMenu.Root defaultOpen modal={false}>
      <ActionMenu.Trigger asChild>
        <Button variant="secondary">Trigger</Button>
      </ActionMenu.Trigger>
      <ActionMenu.Positioner align="center">
        <ActionMenu.Content
          menu={{
            id: 'root',
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
        />
      </ActionMenu.Positioner>
    </ActionMenu.Root>
  )
}
