'use client'

import type { MenuDef } from '@bazza-ui/context-menu'
import { ContextMenu } from '@/registry/context-menu'
import { toast } from 'sonner'

export function ContextMenu_Basic() {
  return (
    <ContextMenu menu={menuDef}>
      <div className="flex h-48 w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground">
        Right-click anywhere in this area
      </div>
    </ContextMenu>
  )
}

const menuDef: MenuDef = {
  nodes: [
    {
      kind: 'item',
      label: 'Copy',
      onSelect: () => toast('Copied to clipboard'),
    },
    {
      kind: 'item',
      label: 'Cut',
      onSelect: () => toast('Cut to clipboard'),
    },
    {
      kind: 'item',
      label: 'Paste',
      onSelect: () => toast('Pasted from clipboard'),
    },
    { kind: 'separator', id: 'sep-1' },
    {
      kind: 'item',
      label: 'Delete',
      onSelect: () => toast('Deleted'),
    },
  ],
}
