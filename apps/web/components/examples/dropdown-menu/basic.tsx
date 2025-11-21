'use client'

import type { MenuDef } from '@bazza-ui/dropdown-menu'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/dropdown-menu'

export function DropdownMenu_Basic(props: Partial<MenuDef>) {
  return (
    <DropdownMenu
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
        nodes: [
          {
            kind: 'item',
            label: 'Apple',
            icon: '🍎',
          },
          {
            kind: 'item',
            label: 'Banana',
            icon: '🍌',
          },
          {
            kind: 'item',
            label: 'Orange',
            icon: '🍊',
          },
          {
            kind: 'item',
            label: 'Pineapple',
            icon: '🍍',
          },
          {
            kind: 'item',
            label: 'Strawberry',
            icon: '🍓',
          },
        ],
        ...props,
      }}
    >
      <DropdownMenu.Trigger asChild>
        <Button variant="secondary">Fruits</Button>
      </DropdownMenu.Trigger>
    </DropdownMenu>
  )
}
