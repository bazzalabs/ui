/** biome-ignore-all lint/complexity/useLiteralKeys: not needed */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/registry/action-menu'

const DEFAULT_STATE = {
  apple: false,
  banana: false,
  orange: false,
  pineapple: false,
  strawberry: false,
}

export function ActionMenu_CheckboxItems() {
  const [state, setState] = useState<Record<string, boolean>>(DEFAULT_STATE)

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
            checked: Boolean(state['apple']),
            onCheckedChange: () =>
              setState((prev) => ({
                ...prev,
                apple: !prev['apple'],
              })),
          },
          {
            kind: 'item',
            variant: 'checkbox',
            disabled: true,
            id: 'banana',
            label: 'Banana',
            icon: '🍌',
            checked: Boolean(state['banana']),
            onCheckedChange: () =>
              setState((prev) => ({
                ...prev,
                banana: !prev['banana'],
              })),
          },
          {
            kind: 'item',
            variant: 'checkbox',
            id: 'orange',
            label: 'Orange',
            icon: '🍊',
            checked: Boolean(state['orange']),
            onCheckedChange: () =>
              setState((prev) => ({
                ...prev,
                orange: !prev['orange'],
              })),
          },
          {
            kind: 'item',
            variant: 'checkbox',
            id: 'pineapple',
            label: 'Pineapple',
            icon: '🍍',
            checked: Boolean(state['pineapple']),
            onCheckedChange: () =>
              setState((prev) => ({
                ...prev,
                pineapple: !prev['pineapple'],
              })),
          },
          {
            kind: 'item',
            variant: 'checkbox',
            id: 'strawberry',
            label: 'Strawberry',
            icon: '🍓',
            checked: Boolean(state['strawberry']),
            onCheckedChange: () =>
              setState((prev) => ({
                ...prev,
                strawberry: !prev['strawberry'],
              })),
          },
        ],
      }}
    />
  )
}
