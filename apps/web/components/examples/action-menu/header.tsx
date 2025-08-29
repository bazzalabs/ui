/** biome-ignore-all lint/correctness/noNestedComponentDefinitions: <explanation> */

'use client'

import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/registry/action-menu'

export function ActionMenu_Header() {
  return (
    <ActionMenu.Root defaultOpen modal={false}>
      <ActionMenu.Trigger asChild>
        <Button variant="secondary">Trigger</Button>
      </ActionMenu.Trigger>
      <ActionMenu.Positioner align="center">
        <ActionMenu.Content
          slots={{
            Header: ({ menu }) => {
              return (
                <div className="px-4 py-1.5 dark:bg-neutral-800 bg-neutral-200/75 rounded-t-lg rounded-b-xl text-xs border-b shadow-xs flex items-center justify-between select-none">
                  {menu.title}
                  <span className="text-muted-foreground">
                    {menu.nodes?.length} items
                  </span>
                </div>
              )
            },
          }}
          menu={{
            id: 'root',
            title: 'Fruits',
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
