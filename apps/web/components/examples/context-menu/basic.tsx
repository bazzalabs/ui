'use client'

import type { MenuDef } from '@bazza-ui/context-menu'
import { toast } from 'sonner'
import { ContextMenu } from '@/registry/ui/context-menu'

export function ContextMenu_Basic(props: Partial<MenuDef>) {
  return (
    <ContextMenu
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
      <div className="h-32 bg-background w-auto aspect-video border rounded-lg border-dashed flex items-center justify-center">
        <span className="text-muted-foreground select-none">Click here.</span>
      </div>
    </ContextMenu>
  )
}
