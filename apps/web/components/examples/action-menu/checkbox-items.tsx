'use client'

import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/registry/action-menu'

export function ActionMenu_CheckboxItems() {
  return (
    <ActionMenu
      trigger={<Button variant="secondary">Trigger</Button>}
      menu={{
        id: 'root',
        nodes: [
          {
            kind: 'item',
            variant: 'checkbox',
            id: 'apple',
            label: 'Apple',
            icon: '🍎',
          },
          {
            kind: 'item',
            variant: 'checkbox',
            disabled: true,
            id: 'banana',
            label: 'Banana',
            icon: '🍌',
          },
          {
            kind: 'item',
            variant: 'checkbox',
            id: 'orange',
            label: 'Orange',
            icon: '🍊',
          },
          {
            kind: 'item',
            variant: 'checkbox',
            id: 'pineapple',
            label: 'Pineapple',
            icon: '🍍',
          },
          {
            kind: 'item',
            variant: 'checkbox',
            id: 'strawberry',
            label: 'Strawberry',
            icon: '🍓',
          },
        ],
      }}
    />
  )
}
