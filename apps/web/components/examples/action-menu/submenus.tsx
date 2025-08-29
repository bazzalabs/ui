'use client'

import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/registry/action-menu'

export function ActionMenu_Submenus() {
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
                kind: 'submenu',
                id: 'fruits',
                label: 'Fruits',
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
              },
              {
                kind: 'submenu',
                id: 'vegetables',
                label: 'Vegetables',
                nodes: [
                  {
                    kind: 'item',
                    id: 'Carrot',
                    label: 'Carrot',
                    icon: '🥕',
                  },
                  {
                    kind: 'item',
                    id: 'Broccoli',
                    label: 'Broccoli',
                    icon: '🥦',
                  },
                  {
                    kind: 'item',
                    id: 'Cauliflower',
                    label: 'Cauliflower',
                    icon: '🥐',
                  },
                  {
                    kind: 'item',
                    id: 'Tomato',
                    label: 'Tomato',
                    icon: '🍅',
                  },
                ],
              },
              {
                kind: 'submenu',
                id: 'meats',
                label: 'Meats',
                nodes: [
                  {
                    kind: 'item',
                    id: 'Chicken',
                    label: 'Chicken',
                    icon: '🐔',
                  },
                  {
                    kind: 'item',
                    id: 'Beef',
                    label: 'Beef',
                    icon: '🐮',
                  },
                  {
                    kind: 'item',
                    id: 'Pork',
                    label: 'Pork',
                    icon: '🐷',
                  },
                  {
                    kind: 'item',
                    id: 'Lamb',
                    label: 'Lamb',
                    icon: '🐶',
                  },
                ],
              },
            ],
          }}
        />
      </ActionMenu.Positioner>
    </ActionMenu.Root>
  )
}
