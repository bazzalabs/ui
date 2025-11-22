'use client'

import { toast } from 'sonner'
import { DropdownMenu } from "@/registry/context-menu"

export function ContextMenu_SubmenusCustomized() {
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
            kind: 'submenu',
            id: 'fruits',
            label: 'Fruits',
            ui: {
              classNames: {
                input: 'bg-red-950',
                item: 'data-[focused=true]:bg-red-950',
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
    >
      <div className="h-32 bg-background w-auto aspect-video border rounded-lg border-dashed flex items-center justify-center">
        <span className="text-muted-foreground">Right click here.</span>
      </div>
    </ContextMenu>
  )
}
