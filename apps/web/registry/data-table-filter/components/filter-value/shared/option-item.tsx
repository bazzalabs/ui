'use client'

import type { ItemNode, ItemSlotProps } from '@bazza-ui/action-menu'
import { renderIcon } from '@bazza-ui/action-menu'
import type { ColumnOptionExtended } from '@bazza-ui/filters'
import { Checkbox } from '@/components/ui/checkbox'
import { LabelWithBreadcrumbs } from '@/registry/action-menu'

export function OptionItem({ node: nodeProp, bind, search }: ItemSlotProps) {
  const props = bind.getRowProps({
    className: 'group/row justify-between gap-4 min-w-0',
  })

  const node = nodeProp as ItemNode<ColumnOptionExtended>

  // For checkbox items, the checked state comes from node.checked (if variant is checkbox)
  const isChecked =
    (node as any).variant === 'checkbox' ? (node as any).checked : false

  return (
    <li {...props}>
      <div className="flex items-center gap-2 truncate">
        <Checkbox
          checked={isChecked}
          className="opacity-0 data-[state=checked]:opacity-100 group-data-[focused=true]/row:opacity-100 dark:border-ring shrink-0"
        />
        {node.icon && (
          <div className="size-4 min-h-4 min-w-4 flex items-center justify-center">
            {renderIcon(
              node.icon,
              'size-4 shrink-0 text-muted-foreground group-data-[focused=true]/row:text-primary',
            )}
          </div>
        )}
        <LabelWithBreadcrumbs
          label={node.label ?? ''}
          breadcrumbs={search?.breadcrumbs}
        />
      </div>
      {node.data?.count && (
        <span className="tabular-nums text-muted-foreground tracking-tight text-xs">
          {new Intl.NumberFormat().format(node.data?.count)}
        </span>
      )}
    </li>
  )
}
