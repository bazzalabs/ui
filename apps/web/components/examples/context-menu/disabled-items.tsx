'use client'

import { toast } from 'sonner'
import { ContextMenu } from '@/registry/components/context-menu'

export function ContextMenu_DisabledItems() {
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
            id: 'Apple',
            label: 'Apple',
            icon: '🍎',
          },
          {
            kind: 'item',
            id: 'Banana',
            label: 'Banana',
            icon: '🍌',
            disabled: true,
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
            disabled: true,
          },
          {
            kind: 'item',
            id: 'Strawberry',
            label: 'Strawberry',
            icon: '🍓',
          },
        ],
      }}
    >
      <div className="h-32 bg-background w-auto aspect-video border rounded-lg border-dashed flex items-center justify-center">
        <span className="text-muted-foreground select-none">
          Right click here.
        </span>
      </div>
    </ContextMenu>
  )
}
