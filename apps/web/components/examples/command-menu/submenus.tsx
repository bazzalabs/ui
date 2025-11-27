'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CommandMenu } from '@/registry/ui/command-menu'

export function CommandMenu_Submenus() {
  const [open, setOpen] = useState(false)
  const [fruit, setFruit] = useState<string>('apple')
  const [vegetable, setVegetable] = useState<string>('carrot')
  const [meat, setMeat] = useState<string>('beef')

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open Command Menu
      </Button>

      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        placeholder="Search categories..."
        showBreadcrumbs={true}
        menu={{
          id: 'root',
          defaults: {
            item: {
              onSelect: ({ node }) => {
                toast(`Selected: ${node.label}`)
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
                  value: fruit,
                  onValueChange: (value) => {
                    setFruit(value)
                    toast(`Selected: ${value}`)
                  },
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
                  onValueChange: (value) => {
                    setVegetable(value)
                    toast(`Selected: ${value}`)
                  },
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
                      icon: '🥬',
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
                  onValueChange: (value) => {
                    setMeat(value)
                    toast(`Selected: ${value}`)
                  },
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
                      icon: '🐑',
                    },
                  ],
                },
              ],
            },
          ],
        }}
      />
    </>
  )
}
