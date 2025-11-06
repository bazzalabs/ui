'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/registry/action-menu'

export function ActionMenu_RadioGroups() {
  const [fruit, setFruit] = useState('apple')

  return (
    <ActionMenu
      trigger={<Button variant="secondary">Trigger</Button>}
      menu={{
        id: 'root',
        hideSearchUntilActive: true,
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
    />
  )
}
