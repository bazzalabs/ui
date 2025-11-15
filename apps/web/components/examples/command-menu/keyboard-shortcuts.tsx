'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CommandMenu } from '@/registry/command-menu'

export function CommandMenu_KeyboardShortcuts() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-2">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Open Command Menu
        </Button>
        <p className="text-sm text-muted-foreground">
          Press{' '}
          <kbd className="px-1.5 py-0.5 text-xs border rounded bg-muted">
            ⌘K
          </kbd>
          ,{' '}
          <kbd className="px-1.5 py-0.5 text-xs border rounded bg-muted">
            Ctrl+K
          </kbd>
          , or{' '}
          <kbd className="px-1.5 py-0.5 text-xs border rounded bg-muted">/</kbd>{' '}
          to open
        </p>
      </div>

      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        // shortcut={['cmd+k', 'ctrl+k', '/']}
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
      />
    </>
  )
}
