'use client'

import type { MenuDef } from '@bazza-ui/context-menu'
import { toast } from 'sonner'
import { ContextMenu } from '@/registry/context-menu'

export function ContextMenu_WithSubmenus() {
  return (
    <ContextMenu menu={menuDef}>
      <div className="flex h-48 w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground">
        Right-click to see nested menus
      </div>
    </ContextMenu>
  )
}

const menuDef: MenuDef = {
  id: 'submenu-context-menu',
  nodes: [
    {
      kind: 'item',
      label: 'New File',
      onSelect: () => toast('Created new file'),
    },
    {
      kind: 'item',
      label: 'New Folder',
      onSelect: () => toast('Created new folder'),
    },
    { kind: 'separator', id: 'sep-1' },
    {
      kind: 'submenu',
      label: 'Share',
      nodes: [
        {
          kind: 'item',
          label: 'Copy Link',
          onSelect: () => toast('Link copied'),
        },
        {
          kind: 'item',
          label: 'Email',
          onSelect: () => toast('Opening email...'),
        },
        {
          kind: 'submenu',
          label: 'Social Media',
          nodes: [
            {
              kind: 'item',
              label: 'Twitter',
              onSelect: () => toast('Sharing on Twitter'),
            },
            {
              kind: 'item',
              label: 'LinkedIn',
              onSelect: () => toast('Sharing on LinkedIn'),
            },
            {
              kind: 'item',
              label: 'Facebook',
              onSelect: () => toast('Sharing on Facebook'),
            },
          ],
        },
      ],
    },
    {
      kind: 'submenu',
      label: 'Open with',
      nodes: [
        {
          kind: 'item',
          label: 'VS Code',
          onSelect: () => toast('Opening in VS Code'),
        },
        {
          kind: 'item',
          label: 'Sublime Text',
          onSelect: () => toast('Opening in Sublime'),
        },
        {
          kind: 'item',
          label: 'Notepad',
          onSelect: () => toast('Opening in Notepad'),
        },
      ],
    },
    { kind: 'separator', id: 'sep-2' },
    {
      kind: 'item',
      label: 'Delete',
      onSelect: () => toast('Deleted'),
    },
  ],
}
