'use client'

import type { MenuDef } from '@bazza-ui/context-menu'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Copy,
  Italic,
  Underline,
} from 'lucide-react'
import { ContextMenu } from '@/registry/context-menu'
import { toast } from 'sonner'

export function ContextMenu_TextEditor() {
  return (
    <ContextMenu menu={menuDef}>
      <div className="relative h-48 w-full rounded-lg border p-4">
        <div className="prose prose-sm dark:prose-invert">
          <p>
            Right-click anywhere in this text editor to access formatting options. This
            demonstrates a typical text editing context menu with nested formatting
            options.
          </p>
          <p className="text-muted-foreground">
            Try the submenu for text alignment and styling options.
          </p>
        </div>
      </div>
    </ContextMenu>
  )
}

const menuDef: MenuDef = {
  nodes: [
    {
      kind: 'item',
      label: 'Cut',
      onSelect: () => toast('Cut'),
    },
    {
      kind: 'item',
      label: 'Copy',
      icon: <Copy className="size-4" />,
      onSelect: () => toast('Copied'),
    },
    {
      kind: 'item',
      label: 'Paste',
      onSelect: () => toast('Pasted'),
    },
    { kind: 'separator', id: 'sep-1' },
    {
      kind: 'submenu',
      label: 'Format',
      children: [
        {
          kind: 'item',
          label: 'Bold',
          icon: <Bold className="size-4" />,
          onSelect: () => toast('Applied bold'),
        },
        {
          kind: 'item',
          label: 'Italic',
          icon: <Italic className="size-4" />,
          onSelect: () => toast('Applied italic'),
        },
        {
          kind: 'item',
          label: 'Underline',
          icon: <Underline className="size-4" />,
          onSelect: () => toast('Applied underline'),
        },
        { kind: 'separator', id: 'sep-format' },
        {
          kind: 'submenu',
          label: 'Text Alignment',
          children: [
            {
              kind: 'item',
              label: 'Align Left',
              icon: <AlignLeft className="size-4" />,
              onSelect: () => toast('Aligned left'),
            },
            {
              kind: 'item',
              label: 'Align Center',
              icon: <AlignCenter className="size-4" />,
              onSelect: () => toast('Aligned center'),
            },
            {
              kind: 'item',
              label: 'Align Right',
              icon: <AlignRight className="size-4" />,
              onSelect: () => toast('Aligned right'),
            },
          ],
        },
        {
          kind: 'submenu',
          label: 'Font Size',
          children: [
            {
              kind: 'item',
              label: 'Small',
              onSelect: () => toast('Font size: Small'),
            },
            {
              kind: 'item',
              label: 'Medium',
              onSelect: () => toast('Font size: Medium'),
            },
            {
              kind: 'item',
              label: 'Large',
              onSelect: () => toast('Font size: Large'),
            },
            {
              kind: 'item',
              label: 'Extra Large',
              onSelect: () => toast('Font size: Extra Large'),
            },
          ],
        },
      ],
    },
    { kind: 'separator', id: 'sep-2' },
    {
      kind: 'item',
      label: 'Select All',
      onSelect: () => toast('Selected all'),
    },
  ],
}
