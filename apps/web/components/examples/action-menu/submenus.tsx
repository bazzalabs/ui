'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/registry/action-menu'

export function ActionMenu_Submenus() {
  return (
    <ActionMenu
      trigger={<Button variant="secondary">Trigger</Button>}
      menu={{
        id: 'root',
        defaults: {
          item: {
            closeOnSelect: false,
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
            nodes: [
              {
                kind: 'group',
                variant: 'radio',
                id: 'fruits-group',
                nodes: [
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'Apple',
                    label: 'Apple',
                    icon: '🍎',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'Banana',
                    label: 'Banana',
                    icon: '🍌',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'Orange',
                    label: 'Orange',
                    icon: '🍊',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'Pineapple',
                    label: 'Pineapple',
                    icon: '🍍',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'Strawberry',
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
                nodes: [
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'Carrot',
                    label: 'Carrot',
                    icon: '🥕',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'Broccoli',
                    label: 'Broccoli',
                    icon: '🥦',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'Cauliflower',
                    label: 'Cauliflower',
                    icon: '🥐',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'Tomato',
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
                nodes: [
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'Chicken',
                    label: 'Chicken',
                    icon: '🐔',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'Beef',
                    label: 'Beef',
                    icon: '🐮',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'Pork',
                    label: 'Pork',
                    icon: '🐷',
                  },
                  {
                    kind: 'item',
                    variant: 'radio',
                    id: 'Lamb',
                    label: 'Lamb',
                    icon: '🐶',
                  },
                ],
              },
            ],
          },
        ],
      }}
    />
  )
}
