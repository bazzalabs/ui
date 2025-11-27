'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CommandMenu } from '@/registry/ui/command-menu'

export function CommandMenu_Groups() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open Command Menu
      </Button>

      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        placeholder="Search food..."
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
              kind: 'group',
              id: 'fruits',
              heading: 'Fruits',
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
              ],
            },
            {
              kind: 'group',
              id: 'vegetables',
              heading: 'Vegetables',
              nodes: [
                {
                  kind: 'item',
                  id: 'carrot',
                  label: 'Carrot',
                  icon: '🥕',
                },
                {
                  kind: 'item',
                  id: 'broccoli',
                  label: 'Broccoli',
                  icon: '🥦',
                },
                {
                  kind: 'item',
                  id: 'tomato',
                  label: 'Tomato',
                  icon: '🍅',
                },
              ],
            },
            {
              kind: 'group',
              id: 'meats',
              heading: 'Meats',
              nodes: [
                {
                  kind: 'item',
                  id: 'chicken',
                  label: 'Chicken',
                  icon: '🐔',
                },
                {
                  kind: 'item',
                  id: 'beef',
                  label: 'Beef',
                  icon: '🐮',
                },
                {
                  kind: 'item',
                  id: 'pork',
                  label: 'Pork',
                  icon: '🐷',
                },
              ],
            },
          ],
        }}
      />
    </>
  )
}
