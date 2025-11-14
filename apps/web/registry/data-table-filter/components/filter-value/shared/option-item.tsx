'use client'

import type { ItemNode, ItemSlotProps } from '@bazza-ui/action-menu'
import { renderIcon } from '@bazza-ui/action-menu'
import type { ColumnOptionExtended, FilterModel } from '@bazza-ui/filters'
import { isValidElement, memo, useCallback } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { CommandItem } from '@/components/ui/command'
import { LabelWithBreadcrumbs } from '@/registry/action-menu'

export function OptionItem_v2({ node: nodeProp, bind, search }: ItemSlotProps) {
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

interface OptionItemProps {
  option: ColumnOptionExtended
  onToggle: (value: string, checked: boolean) => void
}

// Memoized option item to prevent re-renders unless its own props change
export const OptionItem = memo(function OptionItem({
  option,
  onToggle,
}: OptionItemProps) {
  const { value, label, icon: Icon, selected, count } = option
  const handleSelect = useCallback(() => {
    onToggle(value, !selected)
  }, [onToggle, value, selected])

  return (
    <CommandItem
      key={value}
      onSelect={handleSelect}
      className="group flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <Checkbox
          checked={selected}
          className="opacity-0 data-[state=checked]:opacity-100 group-data-[selected=true]:opacity-100 dark:border-ring mr-1 shrink-0"
        />
        <div className="shrink-0">
          {Icon &&
            (isValidElement(Icon) ? (
              Icon
            ) : (
              <Icon className="size-4 text-primary" />
            ))}
        </div>
        <span className="overflow-ellipsis whitespace-nowrap overflow-x-hidden">
          {label}
        </span>
      </div>
      {count && (
        <span className="tabular-nums text-muted-foreground tracking-tight text-xs">
          {new Intl.NumberFormat().format(count)}
        </span>
      )}
    </CommandItem>
  )
})
