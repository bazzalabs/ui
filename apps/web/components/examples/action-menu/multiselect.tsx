import {
  type BaseItemDef,
  type CheckboxItemDef,
  type CheckboxItemNode,
  type ItemDef,
  renderIcon,
} from '@bazza-ui/action-menu'
import { CheckIcon, SearchIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ActionMenu, LabelWithBreadcrumbs } from '@/registry/action-menu'

type MultiSelectItem = ItemDef & {
  label: string
}

export interface MultiSelectProps {
  items: MultiSelectItem[]
}

export function MultiSelect({ items: itemsProp }: MultiSelectProps) {
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    console.log('selected', selected)
  }, [selected])

  const items: CheckboxItemDef[] = useMemo(
    () =>
      itemsProp.map((item) => {
        const id = item.id || item.label.toLowerCase()
        return {
          ...item,
          id,
          kind: 'item',
          variant: 'checkbox',
          checked: selected.includes(id),
          onCheckedChange: (checked: boolean) => {
            if (checked) {
              setSelected((prev) => [...prev, id])
            } else {
              setSelected((prev) => prev.filter((s) => s !== id))
            }
          },
        }
      }),
    [itemsProp, selected],
  )

  const selectedItems = useMemo(
    () => items.filter((item) => selected.includes(item.id)),
    [items, selected],
  )

  const trigger = (
    <Button variant="secondary">
      {selectedItems.length > 0 ? (
        <div className="flex items-center gap-2">
          {selectedItems.map((item) => (
            <Badge key={item.id}>{item.label}</Badge>
          ))}
        </div>
      ) : (
        <span className="text-muted-foreground">Select items...</span>
      )}
    </Button>
  )

  return (
    <ActionMenu
      slots={{
        Input: ({ bind, value, onChange }) => {
          const props = bind.getInputProps({
            className: cn(
              'outline-hidden disabled:cursor-not-allowed disabled:opacity-50 placeholder-muted-foreground/70 focus-visible:placeholder-muted-foreground placeholder:transition-[color] placeholder:duration-50 placeholder:ease-in-out caret-blue-500',
              'data-[mode=drawer]:text-[16px]',
              'data-[mode=drawer]:px-6',
              'w-full px-0 min-h-fit max-h-fit border-none',
            ),
          })
          return (
            <div className="flex items-center gap-2 min-h-9 max-h-9 px-4 border-b">
              <SearchIcon className="size-4.5 text-muted-foreground" />
              <input
                {...props}
                value={value}
                onChange={(e) => onChange(e.target.value)}
              />
            </div>
          )
        },
        Item: ({ node: _node, bind, search }) => {
          const node = _node as CheckboxItemNode

          const props = bind.getRowProps({
            className: cn('group/row', node.description && 'gap-3'),
          })

          return (
            <li {...props}>
              {node.icon && (
                <div className="min-h-4 min-w-4 size-4 flex items-center justify-center">
                  {renderIcon(
                    node.icon,
                    'size-4 shrink-0 text-muted-foreground group-data-[focused=true]/row:text-primary',
                  )}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <LabelWithBreadcrumbs
                  label={node.label ?? ''}
                  breadcrumbs={search?.breadcrumbs}
                />
                {node.description && (
                  <span className="text-muted-foreground text-xs truncate">
                    {node.description}
                  </span>
                )}
              </div>
              {node.checked && <CheckIcon className="size-4 ml-auto" />}
            </li>
          )
        },
      }}
      menu={{
        id: 'root',
        nodes: items,
      }}
    >
      <ActionMenu.Trigger asChild>{trigger}</ActionMenu.Trigger>
    </ActionMenu>
  )
}
