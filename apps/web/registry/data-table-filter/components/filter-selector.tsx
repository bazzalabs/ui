import { type MenuData, renderIcon } from '@bazza-ui/action-menu'
import {
  type Column,
  type ColumnDataType,
  type ColumnOptionExtended,
  type DataTableFilterActions,
  type FilterStrategy,
  type FiltersState,
  isAnyOf,
  type Locale,
  t,
} from '@bazzaui/filters'
import { ListFilterIcon } from 'lucide-react'
import { memo, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { ActionMenu, LabelWithBreadcrumbs } from '@/registry/action-menu'
import {
  filterValueMultiOptionMenu,
  filterValueOptionMenu,
} from './filter-value'

interface FilterSelectorProps<TData> {
  filters: FiltersState
  columns: Column<TData, ColumnDataType>[]
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
}

export const FilterSelector_v2 = memo(
  __FilterSelector_v2,
) as typeof __FilterSelector_v2

function __FilterSelector_v2<TData>({
  filters,
  columns,
  actions,
  strategy,
  locale = 'en',
}: FilterSelectorProps<TData>) {
  const [open, setOpen] = useState(false)
  // const [value, setValue] = useState('')

  const visibleColumns = useMemo(
    () => columns.filter((c) => !c.hidden),
    [columns],
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: good
  useEffect(() => {
    if (open) {
      for (const column of visibleColumns) {
        column.prefetchValues()
        column.prefetchOptions()
        column.prefetchFacetedUniqueValues()
      }
    }
  }, [open])

  const visibleFilters = useMemo(
    () =>
      filters.filter((f) => visibleColumns.find((c) => c.id === f.columnId)),
    [filters, visibleColumns],
  )

  const hasVisibleFilters = visibleFilters.length > 0

  const menu: MenuData<any> = {
    id: 'properties',
    nodes: columns
      .filter((c) => isAnyOf(c.type, ['option', 'multiOption']))
      .map((c) => {
        switch (c.type) {
          case 'option':
            return filterValueOptionMenu({
              filter: filters.find((f) => f.columnId === c.id)!,
              column: c as Column<TData, 'option'>,
              actions,
              locale,
              strategy,
            })
          case 'multiOption':
            return filterValueMultiOptionMenu({
              filter: filters.find((f) => f.columnId === c.id)!,
              column: c as Column<TData, 'multiOption'>,
              actions,
              locale,
              strategy,
            })
          default:
            throw new Error('Unexpected column type')
        }
      }),
  }

  return (
    <ActionMenu.Root open={open} onOpenChange={setOpen}>
      <ActionMenu.Trigger asChild>
        <Button
          variant="outline"
          className={cn('h-7', hasVisibleFilters && 'w-fit !px-2')}
        >
          <ListFilterIcon className="size-4" />
          {!hasVisibleFilters && <span>{t('filter', locale)}</span>}
        </Button>
      </ActionMenu.Trigger>
      <ActionMenu.Positioner side="bottom">
        <ActionMenu.Surface
          menu={menu}
          slots={{
            Item: ({ node, bind, search }) => {
              const props = bind.getRowProps()

              const data = node.data! as ColumnOptionExtended
              const Icon = renderIcon(
                node.icon,
                'size-4 shrink-0 data-[focused=true]:text-primary',
              )

              return (
                <div {...props}>
                  <Checkbox
                    checked={Boolean(data.selected)}
                    className="opacity-0 data-[state=checked]:opacity-100 group-data-[focused=true]:opacity-100 dark:border-ring mr-1 shrink-0"
                  />

                  <div className="size-4 flex items-center justify-center">
                    {Icon}
                  </div>
                  <LabelWithBreadcrumbs
                    label={data.label}
                    breadcrumbs={search?.breadcrumbs}
                  />
                </div>
              )
            },
          }}
        />
      </ActionMenu.Positioner>
    </ActionMenu.Root>
  )
}
