'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/registry/components/action-menu'

export function ActionMenu_Groups() {
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
            kind: 'group',
            id: 'fruits',
            heading: 'Fruits',
            nodes: [
              {
                kind: 'item',
                id: 'apple',
                label: 'Apple',
                icon: '🍎',
              },
              {
                kind: 'item',
                id: 'banana',
                label: 'Banana',
                icon: '🍌',
              },
              {
                kind: 'item',
                id: 'orange',
                label: 'Orange',
                icon: '🍊',
              },
            ],
          },
          {
            kind: 'group',
            id: 'vegetables',
            heading: 'Vegetables',
            nodes: [
              {
                kind: 'item',
                id: 'carrot',
                label: 'Carrot',
                icon: '🥕',
              },
              {
                kind: 'item',
                id: 'broccoli',
                label: 'Broccoli',
                icon: '🥦',
              },
              {
                kind: 'item',
                id: 'cauliflower',
                label: 'Cauliflower',
                icon: '🥐',
              },
            ],
          },
          {
            kind: 'group',
            id: 'meats',
            heading: 'Meats',
            nodes: [
              {
                kind: 'item',
                id: 'chicken',
                label: 'Chicken',
                icon: '🐔',
              },
              {
                kind: 'item',
                id: 'beef',
                label: 'Beef',
                icon: '🐮',
              },
              {
                kind: 'item',
                id: 'pork',
                label: 'Pork',
                icon: '🐷',
              },
            ],
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
