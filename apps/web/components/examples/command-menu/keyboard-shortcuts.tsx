'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CommandMenu } from '@/registry/command-menu'

export function CommandMenu_KeyboardShortcuts() {
  const [open, setOpen] = useState(false)

  return (
    <CommandMenu
      open={open}
      onOpenChange={setOpen}
      placeholder="Type a command..."
      menu={{
        id: 'root',
        defaults: {
          item: {
            onSelect: ({ node }) => {
              toast(`Executed: ${node.label}`)
              setOpen(false)
            },
          },
        },
        nodes: [
          {
            kind: 'group',
            id: 'navigation',
            heading: 'Navigation',
            nodes: [
              {
                kind: 'item',
                id: 'home',
                label: 'Go to Home',
                icon: '🏠',
                keywords: ['home', 'dashboard', 'index'],
              },
              {
                kind: 'item',
                id: 'settings',
                label: 'Open Settings',
                icon: '⚙️',
                keywords: ['settings', 'preferences', 'config'],
              },
              {
                kind: 'item',
                id: 'profile',
                label: 'View Profile',
                icon: '👤',
                keywords: ['profile', 'user', 'account'],
              },
            ],
          },
          {
            kind: 'group',
            id: 'actions',
            heading: 'Actions',
            nodes: [
              {
                kind: 'item',
                id: 'new',
                label: 'Create New',
                icon: '➕',
                keywords: ['new', 'create', 'add'],
              },
              {
                kind: 'item',
                id: 'search',
                label: 'Search',
                icon: '🔍',
                keywords: ['search', 'find', 'query'],
              },
              {
                kind: 'item',
                id: 'help',
                label: 'Help & Support',
                icon: '❓',
                keywords: ['help', 'support', 'docs', 'documentation'],
              },
            ],
          },
        ],
      }}
    >
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open Command Menu
      </Button>
    </CommandMenu>
  )
}
