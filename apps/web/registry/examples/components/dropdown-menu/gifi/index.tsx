'use client'

import type { NodeDef } from '@bazza-ui/react/dropdown-menu'
import { CheckIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import { GIFI_CATALOG, GIFI_STATEMENT_LABELS, type GifiItem } from './data'

const noGifiValue = '__no-gifi__'

export default function GifiDropdownExample() {
  const [value, setValue] = React.useState<string | null>(null)
  const selectedItem = GIFI_CATALOG.find((item) => item.code === value)
  const nodes = useGifiNodes(value, setValue)

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        render={
          <Button
            className="h-9 w-64 justify-between px-3 font-normal"
            variant="outline"
          />
        }
      >
        <span className="truncate">
          {selectedItem
            ? `${selectedItem.code} ${selectedItem.name}`
            : 'Select GIFI code...'}
        </span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface content={nodes}>
              <DropdownMenu.Input placeholder="Search GIFI codes..." />
              <DropdownMenu.List virtualized />
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function useGifiNodes(
  value: string | null,
  onChange: (gifiCode: string | null) => void,
) {
  return React.useMemo<NodeDef[]>(() => {
    const grouped = GIFI_CATALOG.reduce<Record<string, GifiItem[]>>(
      (groups, item) => {
        groups[item.statement] = [...(groups[item.statement] ?? []), item]
        return groups
      },
      {},
    )

    const itemNode = (
      id: string,
      code: string | null,
      label: string,
      keywords: string[],
    ): NodeDef => ({
      kind: 'item',
      id,
      value: label,
      keywords,
      render: ({ props }) => (
        <DropdownMenu.Item {...props} onSelect={() => onChange(code)}>
          {code ? (
            <span className="mr-2 w-10 shrink-0 tabular-nums text-muted-foreground">
              {code}
            </span>
          ) : null}
          <div className="min-w-0 flex-1 truncate">
            {code ? label.slice(code.length + 1) : label}
          </div>
          {value === code ? (
            <CheckIcon className="ml-2 size-3.5 shrink-0" />
          ) : null}
        </DropdownMenu.Item>
      ),
    })

    return [
      itemNode(noGifiValue, null, 'No GIFI code', [
        'none',
        'clear',
        'unmapped',
      ]),
      ...Object.entries(GIFI_STATEMENT_LABELS).flatMap(
        ([statement, label]): NodeDef[] => {
          const items = grouped[statement] ?? []
          if (items.length === 0) return []

          return [
            {
              kind: 'group',
              id: statement,
              label,
              nodes: items.map((item) =>
                itemNode(item.code, item.code, `${item.code} ${item.name}`, [
                  item.code,
                  item.name,
                  label,
                ]),
              ),
            },
          ]
        },
      ),
    ]
  }, [value, onChange])
}
