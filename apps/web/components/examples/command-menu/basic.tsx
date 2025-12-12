'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CommandMenu } from '@/registry/ui/command-menu'

export function CommandMenu_Basic() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open Command Menu
      </Button>

      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        placeholder="Search fruits..."
        menu={{
          id: 'root',
          defaults: {
            item: {
              onSelect: ({ node }) => {
                toast(`${node.icon} ${node.label}`)
                setOpen(false)
              },
            },
          },
          nodes: [
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
          ],
        }}
      />
    </>
  )
}
