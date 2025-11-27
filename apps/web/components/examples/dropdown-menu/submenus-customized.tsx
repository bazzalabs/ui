'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export function DropdownMenu_SubmenusCustomized() {
  return (
    <DropdownMenu
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
            kind: 'submenu',
            id: 'fruits',
            label: 'Fruits',
            ui: {
              classNames: {
                input: 'bg-red-950',
                item: 'data-[focused=true]:bg-red-950',
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
    >
      <DropdownMenu.Trigger asChild>
        <Button variant="secondary">Trigger</Button>
      </DropdownMenu.Trigger>
    </DropdownMenu>
  )
}
