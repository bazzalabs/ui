'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/registry/action-menu'

export function ActionMenu_RadioGroups() {
  const [fruit, setFruit] = useState('apple')

  return (
    <ActionMenu
      menu={{
        id: 'root',
        hideSearchUntilActive: true,
        defaults: {
          item: {
            closeOnSelect: false,
          },
        },
        nodes: [
          {
            id: 'fruits',
            kind: 'group',
            variant: 'radio',
            value: fruit,
            onValueChange: (value) => {
              setFruit(value)
              console.log('changed fruit:', value)
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
                disabled: true,
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
      }}
    >
      <ActionMenu.Trigger asChild>
        <Button variant="secondary">Trigger</Button>
      </ActionMenu.Trigger>
    </ActionMenu>
  )
}
