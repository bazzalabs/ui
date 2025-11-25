'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CommandMenu } from '@/registry/command-menu'

export function CommandMenu_VimBindings() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-2">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Open Command Menu
        </Button>
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">Vim-style navigation enabled:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>
              <kbd className="px-1 py-0.5 border rounded bg-muted">Ctrl+j</kbd>{' '}
              or{' '}
              <kbd className="px-1 py-0.5 border rounded bg-muted">Ctrl+n</kbd>{' '}
              - Next item
            </li>
            <li>
              <kbd className="px-1 py-0.5 border rounded bg-muted">Ctrl+k</kbd>{' '}
              or{' '}
              <kbd className="px-1 py-0.5 border rounded bg-muted">Ctrl+p</kbd>{' '}
              - Previous item
            </li>
            <li>
              <kbd className="px-1 py-0.5 border rounded bg-muted">↑</kbd> /{' '}
              <kbd className="px-1 py-0.5 border rounded bg-muted">↓</kbd> -
              Also work
            </li>
          </ul>
        </div>
      </div>

      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        placeholder="Type a command..."
        vimBindings
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
              id: 'actions',
              heading: 'Quick Actions',
              nodes: [
                {
                  kind: 'item',
                  id: 'new',
                  label: 'New Document',
                  icon: '📄',
                },
                {
                  kind: 'item',
                  id: 'open',
                  label: 'Open Document',
                  icon: '📂',
                },
                {
                  kind: 'item',
                  id: 'save',
                  label: 'Save Document',
                  icon: '💾',
                },
                {
                  kind: 'item',
                  id: 'print',
                  label: 'Print',
                  icon: '🖨️',
                },
              ],
            },
            {
              kind: 'group',
              id: 'navigation',
              heading: 'Navigate',
              nodes: [
                {
                  kind: 'item',
                  id: 'prev',
                  label: 'Previous Page',
                  icon: '⬅️',
                },
                {
                  kind: 'item',
                  id: 'next',
                  label: 'Next Page',
                  icon: '➡️',
                },
                {
                  kind: 'item',
                  id: 'top',
                  label: 'Go to Top',
                  icon: '⬆️',
                },
                {
                  kind: 'item',
                  id: 'bottom',
                  label: 'Go to Bottom',
                  icon: '⬇️',
                },
              ],
            },
          ],
        }}
      />
    </>
  )
}
