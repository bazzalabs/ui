'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/registry/action-menu'

export function ActionMenu_Submenus() {
  const [input, setInput] = useState('')
  const [fruitsInput, setFruitsInput] = useState('')
  const [vegetablesInput, setVegetablesInput] = useState('')
  const [meatsInput, setMeatsInput] = useState('')

  useEffect(() => {
    console.log('root input:', input)
  }, [input])

  useEffect(() => {
    console.log('fruits input:', fruitsInput)
  }, [fruitsInput])

  useEffect(() => {
    console.log('vegetables input:', vegetablesInput)
  }, [vegetablesInput])

  return (
    <ActionMenu.Root modal={true}>
      <ActionMenu.Trigger asChild>
        <Button variant="secondary">Trigger</Button>
      </ActionMenu.Trigger>
      <ActionMenu.Positioner align="center">
        <ActionMenu.Surface
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
            input: {
              value: input,
              onValueChange: setInput,
            },
            nodes: [
              {
                kind: 'submenu',
                id: 'fruits',
                label: 'Fruits',
                input: {
                  value: fruitsInput,
                  onValueChange: setFruitsInput,
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
                input: {
                  value: vegetablesInput,
                  onValueChange: setVegetablesInput,
                },
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
                input: {
                  value: meatsInput,
                  onValueChange: setMeatsInput,
                },
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
