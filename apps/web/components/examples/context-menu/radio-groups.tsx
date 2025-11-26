'use client'

import { useState } from 'react'
import { ContextMenu } from '@/registry/components/context-menu'

export function ContextMenu_RadioGroups() {
  const [fruit, setFruit] = useState('apple')

  return (
    <ContextMenu
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
      <div className="h-32 bg-background w-auto aspect-video border rounded-lg border-dashed flex items-center justify-center">
        <span className="text-muted-foreground">Right click here.</span>
      </div>
    </ContextMenu>
  )
}
