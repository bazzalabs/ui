'use client'

import type { ItemDef } from '@bazza-ui/action-menu'
import { ReactQueryLoaderAdapter } from '@bazza-ui/action-menu/react-query'
import { toast } from 'sonner'
import { sleep } from '@/app/demos/server/tst-query/_/utils'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/registry/action-menu'

export function ActionMenu_AsyncSubmenus() {
  return (
    <ActionMenu
      loaderAdapter={ReactQueryLoaderAdapter}
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
            loader: {
              queryKey: ['fruits'],
              queryFn: () => fetchFruits(),
              retry: false,
            },
          },
          {
            kind: 'submenu',
            id: 'vegetables',
            label: 'Vegetables',
            loader: {
              queryKey: ['vegetables'],
              queryFn: () => fetchVegetables(),
              retry: false,
            },
          },
          {
            kind: 'submenu',
            id: 'meats',
            label: 'Meats',
            loader: {
              queryKey: ['meats'],
              queryFn: () => fetchMeats(),
              retry: false,
            },
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

// Mock data fetching functions
async function fetchFruits(): Promise<ItemDef[]> {
  await sleep(5000)

  return [
    {
      kind: 'item',
      id: 'apple',
      label: 'Apple',
      icon: '🍎',
    },
    {
      kind: 'item',
      id: 'banana',
      label: 'Banana',
      icon: '🍌',
    },
    {
      kind: 'item',
      id: 'orange',
      label: 'Orange',
      icon: '🍊',
    },
    {
      kind: 'item',
      id: 'pineapple',
      label: 'Pineapple',
      icon: '🍍',
    },
    {
      kind: 'item',
      id: 'strawberry',
      label: 'Strawberry',
      icon: '🍓',
    },
  ]
}

async function fetchVegetables(): Promise<ItemDef[]> {
  await sleep(5000)

  return [
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
  ]
}

async function fetchMeats(): Promise<ItemDef[]> {
  await sleep(5000)

  return [
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
  ]
}
