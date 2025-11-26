'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/components/dropdown-menu'

export function DropdownMenu_Submenus() {
  const [fruit, setFruit] = useState<string>('apple')
  const [vegetable, setVegetable] = useState<string>('carrot')
  const [meat, setMeat] = useState<string>('beef')

  return (
    <DropdownMenu
      defaults={{
        item: {
          onSelect: ({ node }) => {
            toast(`${node.icon} ${node.label}`)
          },
          closeOnSelect: true,
        },
      }}
      menu={{
        id: 'root',
        defaults: {
          item: {
            closeOnSelect: true,
          },
        },
        search: {
          minLength: 2,
        },
        nodes: [
          {
            kind: 'submenu',
            id: 'fruits',
            label: 'Fruits',
            deepSearch: false,
            nodes: [
              {
                kind: 'group',
                variant: 'radio',
                id: 'fruits-group',
                value: fruit,
                onValueChange: setFruit,
                nodes: [
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'apple',
                    label: 'Apple',
                    icon: '🍎',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'banana',
                    label: 'Banana',
                    icon: '🍌',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'orange',
                    label: 'Orange',
                    icon: '🍊',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'pineapple',
                    label: 'Pineapple',
                    icon: '🍍',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'strawberry',
                    label: 'Strawberry',
                    icon: '🍓',
                  },
                ],
              },
            ],
          },
          {
            kind: 'submenu',
            id: 'vegetables',
            label: 'Vegetables',
            nodes: [
              {
                kind: 'group',
                variant: 'radio',
                id: 'vegetables-group',
                value: vegetable,
                onValueChange: setVegetable,
                nodes: [
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'carrot',
                    label: 'Carrot',
                    icon: '🥕',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'broccoli',
                    label: 'Broccoli',
                    icon: '🥦',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'cauliflower',
                    label: 'Cauliflower',
                    icon: '🥐',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'tomato',
                    label: 'Tomato',
                    icon: '🍅',
                  },
                ],
              },
            ],
          },
          {
            kind: 'submenu',
            id: 'meats',
            label: 'Meats',
            nodes: [
              {
                kind: 'group',
                variant: 'radio',
                id: 'meats-group',
                value: meat,
                onValueChange: setMeat,
                nodes: [
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'chicken',
                    label: 'Chicken',
                    icon: '🐔',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'beef',
                    label: 'Beef',
                    icon: '🐮',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'pork',
                    label: 'Pork',
                    icon: '🐷',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'lamb',
                    label: 'Lamb',
                    icon: '🐶',
                  },
                ],
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
