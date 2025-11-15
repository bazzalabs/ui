'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CommandMenu } from '@/registry/command-menu'

export function CommandMenu_NestedSubmenus() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open Command Menu
      </Button>

      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        shortcut="cmd+k"
        placeholder="Browse categories..."
        showBreadcrumbs={true}
        menu={{
          id: 'root',
          defaults: {
            item: {
              onSelect: ({ node }) => {
                toast(`Selected: ${node.label}`)
                setOpen(false)
              },
            },
          },
          nodes: [
            {
              kind: 'submenu',
              id: 'files',
              label: 'Files',
              title: 'File Operations',
              icon: '📁',
              nodes: [
                {
                  kind: 'item',
                  id: 'new-file',
                  label: 'New File',
                  icon: '📄',
                },
                {
                  kind: 'item',
                  id: 'open-file',
                  label: 'Open File',
                  icon: '📂',
                },
                {
                  kind: 'submenu',
                  id: 'export',
                  label: 'Export',
                  title: 'Export Options',
                  icon: '💾',
                  nodes: [
                    {
                      kind: 'item',
                      id: 'export-pdf',
                      label: 'Export as PDF',
                      icon: '📕',
                    },
                    {
                      kind: 'item',
                      id: 'export-csv',
                      label: 'Export as CSV',
                      icon: '📊',
                    },
                    {
                      kind: 'item',
                      id: 'export-json',
                      label: 'Export as JSON',
                      icon: '📋',
                    },
                  ],
                },
                {
                  kind: 'submenu',
                  id: 'import',
                  label: 'Import',
                  title: 'Import Options',
                  icon: '📥',
                  nodes: [
                    {
                      kind: 'item',
                      id: 'import-file',
                      label: 'Import from File',
                      icon: '📎',
                    },
                    {
                      kind: 'item',
                      id: 'import-url',
                      label: 'Import from URL',
                      icon: '🔗',
                    },
                  ],
                },
              ],
            },
            {
              kind: 'submenu',
              id: 'edit',
              label: 'Edit',
              title: 'Edit Operations',
              icon: '✏️',
              nodes: [
                {
                  kind: 'item',
                  id: 'undo',
                  label: 'Undo',
                  icon: '↩️',
                },
                {
                  kind: 'item',
                  id: 'redo',
                  label: 'Redo',
                  icon: '↪️',
                },
                {
                  kind: 'separator',
                  id: 'sep-1',
                },
                {
                  kind: 'item',
                  id: 'cut',
                  label: 'Cut',
                  icon: '✂️',
                },
                {
                  kind: 'item',
                  id: 'copy',
                  label: 'Copy',
                  icon: '📋',
                },
                {
                  kind: 'item',
                  id: 'paste',
                  label: 'Paste',
                  icon: '📌',
                },
              ],
            },
            {
              kind: 'submenu',
              id: 'view',
              label: 'View',
              title: 'View Options',
              icon: '👁️',
              nodes: [
                {
                  kind: 'item',
                  id: 'zoom-in',
                  label: 'Zoom In',
                  icon: '🔍',
                },
                {
                  kind: 'item',
                  id: 'zoom-out',
                  label: 'Zoom Out',
                  icon: '🔎',
                },
                {
                  kind: 'item',
                  id: 'fullscreen',
                  label: 'Toggle Fullscreen',
                  icon: '⛶',
                },
              ],
            },
          ],
        }}
      />
    </>
  )
}
