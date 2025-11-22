'use client'

import type { ItemDef } from '@bazza-ui/context-menu'
import * as React from 'react'
import { toast } from 'sonner'
import { ContextMenu } from '@/registry/context-menu'

type MassiveMenuProps = {
  /** How many item nodes to generate (default 100,000). */
  numItems?: number
}

export function ContextMenu_Massive({ numItems = 100_000 }: MassiveMenuProps) {
  // Generate items once per numItems change
  const nodes = React.useMemo(() => {
    const emojis = ['🍎', '🍌', '🍊', '🍍', '🍓', '🍇', '🍉', '🥝', '🍒', '🍑']
    const final = Array.from({ length: numItems }, (_, i) => {
      const n = i + 1
      const id = `item-${n}`
      return {
        kind: 'item',
        id,
        label: `Item ${n.toString().padStart(6, '0')}`,
        icon: emojis[i % emojis.length],
        // optionally add keywords for search:
        keywords: [`#${n}`, `idx:${i}`],
      } satisfies ItemDef
    })

    return final
  }, [numItems])

  return (
    <ContextMenu
      menu={{
        id: 'root',
        defaults: {
          item: {
            closeOnSelect: true,
            onSelect: ({ node }) => {
              toast(`${node.icon ?? ''} ${node.label ?? node.id}`)
            },
          },
        },
        nodes,
      }}
    >
      <div className="h-32 bg-background w-auto aspect-video border rounded-lg border-dashed flex items-center justify-center">
        <span className="text-muted-foreground">Right click here.</span>
      </div>
    </ContextMenu>
  )
}
