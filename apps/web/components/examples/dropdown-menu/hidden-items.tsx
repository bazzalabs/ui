'use client'

import {
  type ButtonItemDef,
  type DropdownMenuDef,
  renderIcon,
} from '@bazza-ui/dropdown-menu'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export function DropdownMenu_HiddenItems() {
  const [hiddenItems, setHiddenItems] = useState<string[]>([])

  console.log('hiddenItems:', hiddenItems)

  const menu: DropdownMenuDef = useMemo(
    () => ({
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
          id: 'apple',
          label: 'Apple',
          icon: '🍎',
          hidden: hiddenItems.includes('apple'),
        },
        {
          kind: 'item',
          id: 'banana',
          label: 'Banana',
          icon: '🍌',
          hidden: hiddenItems.includes('banana'),
        },
        {
          kind: 'item',
          id: 'orange',
          label: 'Orange',
          icon: '🍊',
          hidden: hiddenItems.includes('orange'),
        },
        {
          kind: 'item',
          id: 'pineapple',
          label: 'Pineapple',
          icon: '🍍',
          hidden: hiddenItems.includes('pineapple'),
        },
        {
          kind: 'item',
          id: 'strawberry',
          label: 'Strawberry',
          icon: '🍓',
          hidden: hiddenItems.includes('strawberry'),
        },
      ],
    }),
    [hiddenItems],
  )

  return (
    <div className="flex gap-8">
      <div className="flex flex-col gap-1 w-[150px]">
        <div className="flex flex-col gap-1 mb-2">
          <span className="font-medium text-lg">Hidden items</span>
          <p className="text-sm leading-4">
            Select items to hide them from the menu.
          </p>
        </div>
        <Separator className="my-2" />
        {menu.nodes?.map((_node) => {
          const node = _node as ButtonItemDef & { id: string }

          return (
            <div key={node.id} className="flex items-center gap-2">
              <Checkbox
                checked={hiddenItems.includes(node.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setHiddenItems([...hiddenItems, node.id])
                  } else {
                    setHiddenItems(hiddenItems.filter((id) => id !== node.id))
                  }
                }}
              />
              <div>
                {renderIcon(node.icon)} {node.label}
              </div>
            </div>
          )
        })}
      </div>
      <DropdownMenu menu={menu} modal={false}>
        <DropdownMenu.Trigger asChild>
          <Button variant="secondary">Trigger</Button>
        </DropdownMenu.Trigger>
      </DropdownMenu>
    </div>
  )
}
