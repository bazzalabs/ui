'use client'

import type { ItemNode, ItemSlotProps } from '@bazza-ui/dropdown-menu'
import type { TextFilterItemData } from './text-menu'

export function TextItem({ node: nodeProp, bind }: ItemSlotProps) {
  const props = bind.getRowProps({
    className: 'group/row gap-1',
  })

  const node = nodeProp as ItemNode<TextFilterItemData>

  return (
    <li {...props}>
      <span className="text-muted-foreground shrink-0">
        {node.data?.operator}
      </span>
      <span className="truncate">{node.data?.values[0]}</span>
    </li>
  )
}
