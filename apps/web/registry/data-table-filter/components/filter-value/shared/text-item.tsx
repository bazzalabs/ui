'use client'

import type { ItemNode, ItemSlotProps } from '@bazza-ui/action-menu'
import type { FilterModel } from '@bazza-ui/filters'

export function TextItem_v2({
  node: nodeProp,
  bind,
  search,
}: ItemSlotProps<FilterModel<'text'>>) {
  const props = bind.getRowProps({
    className: 'group/row gap-1 min-w-0',
  })

  const node = nodeProp as ItemNode<FilterModel<'text'>>

  return (
    <li {...props}>
      <span className="text-muted-foreground">{node.data?.operator}</span>
      <span>{node.data?.values[0]}</span>
    </li>
  )
}
