import type {
  ActionMenuRootProps,
  MenuDef,
  SubmenuDef,
} from '@bazza-ui/action-menu'
import {
  type Column,
  type ColumnDataType,
  type DataTableFilterActions,
  type FilterModel,
  type FilterStrategy,
  type FiltersState,
  isAnyOf,
  type Locale,
  t,
} from '@bazza-ui/filters'
import { Slot } from '@radix-ui/react-slot'
import { ListFilterIcon } from 'lucide-react'
import {
  type ComponentPropsWithoutRef,
  createContext,
  isValidElement,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ActionMenu } from '@/registry/action-menu'
import { type FilterVariant, useFilterVariant } from '../context'
import {
  createMultiOptionMenu,
  createOptionMenu,
  createTextMenu,
  FilterValueDateController,
  FilterValueNumberController,
  OptionItem,
} from './filter-value/index'

interface FilterMenuContextValue {
  hasVisibleFilters: boolean
  locale: Locale
  variant?: FilterVariant
}

const FilterMenuContext = createContext<FilterMenuContextValue | null>(null)

function useFilterMenuContext() {
  const context = useContext(FilterMenuContext)
  if (!context) {
    throw new Error(
      'FilterMenu compound components must be used within FilterMenu',
    )
  }
  return context
}

interface FilterMenuProps<TData> {
  filters: FiltersState
  columns: Column<TData>[]
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
  children?: React.ReactNode
  actionMenuProps?: Partial<Omit<ActionMenuRootProps, 'menu' | 'children'>>
  variant?: FilterVariant
}

function createDateMenu<TData>({
  filter,
  column,
  actions,
  locale = 'en',
  strategy,
}: {
  filter: FilterModel<'date'>
  column: Column<TData, 'date'>
  actions: DataTableFilterActions
  locale?: Locale
  strategy: FilterStrategy
}): SubmenuDef {
  return {
    kind: 'submenu',
    id: column.id,
    icon: column.icon,
    label: column.displayName,
    render: () => (
      <FilterValueDateController
        filter={filter}
        column={column}
        actions={actions}
        strategy={strategy}
        locale={locale}
      />
    ),
    nodes: [],
  }
}

function createNumberMenu<TData>({
  filter,
  column,
  actions,
  locale = 'en',
  strategy,
}: {
  filter: FilterModel<'number'>
  column: Column<TData, 'number'>
  actions: DataTableFilterActions
  locale?: Locale
  strategy: FilterStrategy
}): SubmenuDef {
  return {
    kind: 'submenu' as const,
    id: column.id,
    icon: column.icon,
    label: column.displayName,
    render: () => (
      <FilterValueNumberController
        filter={filter}
        column={column}
        actions={actions}
        strategy={strategy}
        locale={locale}
      />
    ),
    nodes: [],
  }
}

// Trigger component using Slot pattern
export interface FilterMenuTriggerProps
  extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean
}

function FilterMenuTrigger({
  asChild,
  className,
  children,
  ...props
}: FilterMenuTriggerProps) {
  const { hasVisibleFilters, locale } = useFilterMenuContext()
  const Comp = asChild ? Slot : Button

  return (
    <ActionMenu.Trigger asChild>
      <Comp
        data-slot="filter-menu-trigger"
        data-state={hasVisibleFilters ? 'has-filters' : 'empty'}
        variant="outline"
        className={cn('h-7', hasVisibleFilters && 'w-fit !px-2', className)}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            <ListFilterIcon className="size-4" />
            {!hasVisibleFilters && <span>{t('filter', locale)}</span>}
          </>
        )}
      </Comp>
    </ActionMenu.Trigger>
  )
}

function __FilterMenu<TData>({
  filters,
  columns,
  actions,
  strategy,
  locale = 'en',
  children,
  actionMenuProps,
  variant: variantProp,
}: FilterMenuProps<TData>) {
  const contextVariant = useFilterVariant()
  const variant = variantProp ?? contextVariant

  // Use ref to capture current filters value for loaders
  const filtersRef = useRef(filters)
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  // Use Map to store initial selected values for each column (for sticky grouping)
  const initialSelectedValuesMapRef = useRef<Map<string, Set<string> | null>>(
    new Map(),
  )

  const visibleColumns = useMemo(
    () => columns.filter((c) => !c.hidden),
    [columns],
  )

  const visibleFilters = useMemo(
    () =>
      filters.filter((f) => visibleColumns.find((c) => c.id === f.columnId)),
    [filters, visibleColumns],
  )

  const hasVisibleFilters = visibleFilters.length > 0

  const contextValue: FilterMenuContextValue = useMemo(
    () => ({ hasVisibleFilters, locale, variant }),
    [hasVisibleFilters, locale, variant],
  )

  const menu: MenuDef = useMemo(
    () => ({
      id: 'filter-menu',
      search: {
        minLength: 2,
      },
      nodes: columns.map((column) => {
        if (column.type === 'text') {
          const textFilter = filters.find((f) => f.columnId === column.id)
          return createTextMenu({
            filter: textFilter as FilterModel,
            column: column as Column<TData, 'text'>,
            actions,
            locale,
            strategy,
          })
        }

        if (column.type === 'date') {
          const dateFilter = filters.find((f) => f.columnId === column.id)
          return createDateMenu({
            filter: dateFilter as FilterModel<'date'>,
            column: column as Column<TData, 'date'>,
            actions,
            locale,
            strategy,
          })
        }

        if (column.type === 'number') {
          const numberFilter = filters.find((f) => f.columnId === column.id)
          return createNumberMenu({
            filter: numberFilter as FilterModel<'number'>,
            column: column as Column<TData, 'number'>,
            actions,
            locale,
            strategy,
          })
        }

        // Create submenu with middleware for sticky grouping
        // Create a ref-like object for this specific column's initial values
        const getColumnRef = (columnId: string) => ({
          get current() {
            return initialSelectedValuesMapRef.current.get(columnId) ?? null
          },
          set current(value: Set<string> | null) {
            initialSelectedValuesMapRef.current.set(columnId, value)
          },
        })

        return {
          kind: 'submenu',
          id: column.id,
          icon: column.icon,
          label: column.displayName,
          ...(column.type === 'option'
            ? createOptionMenu({
                filter: undefined as any, // Not used, middleware reads from ref
                column: column as Column<TData, 'option'>,
                actions,
                locale,
                strategy,
                getFilter: () =>
                  filtersRef.current.find((f) => f.columnId === column.id) as
                    | FilterModel<'option'>
                    | undefined,
                initialSelectedValuesRef: getColumnRef(column.id) as any,
              })
            : column.type === 'multiOption'
              ? createMultiOptionMenu({
                  filter: undefined as any, // Not used, middleware reads from ref
                  column: column as Column<TData, 'multiOption'>,
                  actions,
                  locale,
                  strategy,
                  getFilter: () =>
                    filtersRef.current.find((f) => f.columnId === column.id) as
                      | FilterModel<'multiOption'>
                      | undefined,
                  initialSelectedValuesRef: getColumnRef(column.id) as any,
                })
              : {}),
        } as SubmenuDef
      }),
    }),
    [columns, filters, actions, locale, strategy],
  )

  return (
    <FilterMenuContext.Provider value={contextValue}>
      <ActionMenu
        slots={{
          Item: OptionItem,
        }}
        menu={menu}
        {...actionMenuProps}
      >
        {children ?? <FilterMenuTrigger />}
      </ActionMenu>
    </FilterMenuContext.Provider>
  )
}

const FilterMenuRoot = memo(__FilterMenu) as typeof __FilterMenu

export const FilterMenu = FilterMenuRoot as typeof FilterMenuRoot & {
  Trigger: typeof FilterMenuTrigger
}

FilterMenu.Trigger = FilterMenuTrigger
