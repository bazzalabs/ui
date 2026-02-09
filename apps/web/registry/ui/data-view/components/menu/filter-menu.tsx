'use client'

import type {
  Column,
  DataViewInstance,
  FilterModel,
  FilterStrategy,
  FiltersState,
  Locale,
  ViewLayer,
} from '@bazza-ui/data-view/react'
import {
  isBooleanColumn,
  isDateColumn,
  isMultiOptionColumn,
  isNumberColumn,
  isOptionColumn,
  isTextColumn,
} from '@bazza-ui/data-view/react'
import type {
  ItemDef,
  ItemRenderParams,
  NodeDef,
  SubmenuDef,
  SubmenuRenderParams,
} from '@bazza-ui/react'
import * as React from 'react'
import { isValidElement, memo, useMemo } from 'react'
import { DropdownMenu, LabelWithBreadcrumbs } from '@/registry/ui/dropdown-menu'
import {
  type DataViewVariant,
  useDataViewContext,
  useDataViewVariant,
} from '../root/data-view-context'
import { FilterTrigger } from '../trigger/filter-trigger'
import {
  createMultiOptionMenu,
  createOptionMenu,
  FilterValueDateController,
  FilterValueNumberController,
  TextEditorContent,
} from '../value'

// ============================================================================
// Submenu Renderer Helper
// ============================================================================

/**
 * Renders an icon for a column, handling both element and component types.
 * In data-view, column.icon is typed as `unknown`, so we need to handle casting.
 */
function renderColumnIcon(icon: unknown): React.ReactNode {
  if (!icon) return null

  return (
    <div className="size-4 flex items-center justify-center">
      {isValidElement(icon) ? (
        icon
      ) : (
        <DropdownMenu.Icon>
          {React.createElement(
            icon as React.ComponentType<{ className?: string }>,
            {
              className:
                'size-4 shrink-0 text-muted-foreground group-data-[highlighted]/row:text-primary',
            },
          )}
        </DropdownMenu.Icon>
      )}
    </div>
  )
}

/**
 * Creates a render function for a submenu with nodes (DataSurface).
 */
function createSubmenuRenderer(
  id: string,
  title: string,
  icon: unknown,
  nodes: NodeDef[],
  inputPlaceholder = 'Search...',
): (params: SubmenuRenderParams) => React.ReactNode {
  return ({ context }: SubmenuRenderParams) => {
    return (
      <DropdownMenu.Submenu key={id}>
        <DropdownMenu.SubmenuTrigger value={id} className="group/row">
          <div className="flex items-center gap-2 min-w-0">
            {renderColumnIcon(icon)}
            <LabelWithBreadcrumbs
              label={title}
              breadcrumbs={
                context.isDeepSearchResult ? context.breadcrumbs : undefined
              }
            />
          </div>
        </DropdownMenu.SubmenuTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={-2}>
            <DropdownMenu.Popup>
              <DropdownMenu.DataSurface content={nodes}>
                <DropdownMenu.DataInput placeholder={inputPlaceholder} />
                <DropdownMenu.DataList virtualized />
              </DropdownMenu.DataSurface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    )
  }
}

/**
 * Creates a render function for a submenu with custom content (for date/number controllers).
 */
function createCustomSubmenuRenderer(
  id: string,
  title: string,
  icon: unknown,
  content: React.ReactNode,
): (params: SubmenuRenderParams) => React.ReactNode {
  return ({ context }: SubmenuRenderParams) => {
    return (
      <DropdownMenu.Submenu key={id}>
        <DropdownMenu.SubmenuTrigger value={id} className="group/row">
          <div className="flex items-center gap-2 min-w-0">
            {renderColumnIcon(icon)}
            <LabelWithBreadcrumbs
              label={title}
              breadcrumbs={
                context.isDeepSearchResult ? context.breadcrumbs : undefined
              }
            />
          </div>
        </DropdownMenu.SubmenuTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner sideOffset={-2}>
            <DropdownMenu.Popup className="w-full">
              <DropdownMenu.Surface>{content}</DropdownMenu.Surface>
            </DropdownMenu.Popup>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Submenu>
    )
  }
}

// ============================================================================
// Menu Node Creators
// ============================================================================

function createDateSubmenuDef<TData>({
  filter,
  column,
  layer,
  locale = 'en',
  strategy,
}: {
  filter: FilterModel<'date'>
  column: Column<TData, 'date'>
  layer: ViewLayer<TData>
  locale?: Locale
  strategy: FilterStrategy
}): SubmenuDef {
  return {
    kind: 'submenu',
    id: column.id,
    value: column.displayName,
    render: createCustomSubmenuRenderer(
      column.id,
      column.displayName,
      column.icon,
      <FilterValueDateController
        filter={filter}
        column={column}
        layer={layer}
        strategy={strategy}
        locale={locale}
      />,
    ),
  }
}

function createNumberSubmenuDef<TData>({
  filter,
  column,
  layer,
  locale = 'en',
  strategy,
}: {
  filter: FilterModel<'number'>
  column: Column<TData, 'number'>
  layer: ViewLayer<TData>
  locale?: Locale
  strategy: FilterStrategy
}): SubmenuDef {
  return {
    kind: 'submenu',
    id: column.id,
    value: column.displayName,
    render: createCustomSubmenuRenderer(
      column.id,
      column.displayName,
      column.icon,
      <FilterValueNumberController
        filter={filter}
        column={column}
        layer={layer}
        strategy={strategy}
        locale={locale}
      />,
    ),
  }
}

function createOptionSubmenuDef<TData>({
  column,
  layer,
  filter,
  locale,
  strategy,
}: {
  column: Column<TData, 'option'>
  layer: ViewLayer<TData>
  filter?: FilterModel<'option'>
  locale: Locale
  strategy: FilterStrategy
}): SubmenuDef {
  const { nodes } = createOptionMenu({
    column,
    layer,
    filter,
    locale,
    strategy,
  })
  return {
    kind: 'submenu',
    id: column.id,
    value: column.displayName,
    nodes,
    render: createSubmenuRenderer(
      column.id,
      column.displayName,
      column.icon,
      nodes,
      `Search ${column.displayName.toLowerCase()}...`,
    ),
  }
}

function createMultiOptionSubmenuDef<TData>({
  column,
  layer,
  filter,
  locale,
  strategy,
}: {
  column: Column<TData, 'multiOption'>
  layer: ViewLayer<TData>
  filter?: FilterModel<'multiOption'>
  locale: Locale
  strategy: FilterStrategy
}): SubmenuDef {
  const { nodes } = createMultiOptionMenu({
    column,
    layer,
    filter,
    locale,
    strategy,
  })
  return {
    kind: 'submenu',
    id: column.id,
    value: column.displayName,
    nodes,
    render: createSubmenuRenderer(
      column.id,
      column.displayName,
      column.icon,
      nodes,
      `Search ${column.displayName.toLowerCase()}...`,
    ),
  }
}

/**
 * Text submenu content component that renders a submenu with TextEditorContent.
 */
function TextSubmenuContent<TData>({
  id,
  title,
  icon,
  column,
  layer,
  instance,
  context,
}: {
  id: string
  title: string
  icon: unknown
  column: Column<TData, 'text'>
  layer: ViewLayer<TData>
  instance?: DataViewInstance<TData, any, any>
  context: SubmenuRenderParams['context']
}) {
  return (
    <DropdownMenu.Submenu key={id}>
      <DropdownMenu.SubmenuTrigger value={id} className="group/row">
        <div className="flex items-center gap-2 min-w-0">
          {renderColumnIcon(icon)}
          <LabelWithBreadcrumbs
            label={title}
            breadcrumbs={
              context.isDeepSearchResult ? context.breadcrumbs : undefined
            }
          />
        </div>
      </DropdownMenu.SubmenuTrigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner sideOffset={-2} align="start" alignOffset={-3}>
          <DropdownMenu.Popup>
            <TextEditorContent
              column={column as Column<unknown, 'text'>}
              layer={layer as ViewLayer<unknown>}
              instance={
                instance as DataViewInstance<unknown, any, any> | undefined
              }
            />
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Submenu>
  )
}

function createTextSubmenuDef<TData>({
  column,
  layer,
  instance,
}: {
  column: Column<TData, 'text'>
  layer: ViewLayer<TData>
  instance?: DataViewInstance<TData, any, any>
}): SubmenuDef {
  return {
    kind: 'submenu',
    id: column.id,
    value: column.displayName,
    // Text menus need controlled search - we'll handle this with a custom renderer
    render: (params: SubmenuRenderParams) => {
      return (
        <TextSubmenuContent
          id={column.id}
          title={column.displayName}
          icon={column.icon}
          column={column as Column<unknown, 'text'>}
          layer={layer as ViewLayer<unknown>}
          instance={instance as DataViewInstance<unknown, any, any> | undefined}
          context={params.context}
        />
      )
    },
  }
}

function createBooleanItemDef<TData>({
  column,
  layer,
}: {
  column: Column<TData, 'boolean'>
  layer: ViewLayer<TData>
}): ItemDef {
  return {
    kind: 'item',
    id: `filter-value-${column.id}`,
    value: column.displayName,
    onSelect: () => {
      layer.setFilterValue(column, [false])
    },
    render: ({ context }: ItemRenderParams) => {
      return (
        <DropdownMenu.Item
          key={column.id}
          value={column.id}
          className="group/row"
        >
          {renderColumnIcon(column.icon)}
          <LabelWithBreadcrumbs
            label={column.displayName}
            breadcrumbs={
              context.isDeepSearchResult ? context.breadcrumbs : undefined
            }
          />
        </DropdownMenu.Item>
      )
    },
  }
}

// ============================================================================
// FilterMenu Component
// ============================================================================

export interface FilterMenuProps<TData = unknown> {
  columns?: Column<TData>[]
  filters?: FiltersState
  layer?: ViewLayer<TData>
  instance?: DataViewInstance<TData, any, any>
  strategy?: FilterStrategy
  locale?: Locale
  children?: React.ReactElement
  rootProps?: Partial<
    Omit<React.ComponentProps<typeof DropdownMenu.Root>, 'children'>
  >
  variant?: DataViewVariant
}

function __FilterMenu<TData>({
  columns: columnsProp,
  filters: filtersProp,
  layer: layerProp,
  instance: instanceProp,
  strategy: strategyProp,
  locale: localeProp,
  children,
  rootProps,
  variant: variantProp,
}: FilterMenuProps<TData>) {
  // Get values from context if not provided as props
  const context = useDataViewContext<TData>()
  const contextVariant = useDataViewVariant()

  const columns = columnsProp ?? context.columns
  const filters = filtersProp ?? context.filters
  const layer = layerProp ?? context.layer
  const instance = instanceProp ?? context.instance
  const strategy = strategyProp ?? context.strategy
  const locale = localeProp ?? context.locale ?? 'en'
  const variant = variantProp ?? contextVariant

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

  const nodes: NodeDef[] = useMemo(
    () =>
      columns.map((column): NodeDef => {
        if (isTextColumn(column)) {
          return createTextSubmenuDef({
            column,
            layer,
            instance,
          })
        }

        if (isDateColumn(column)) {
          const dateFilter = filters.find(
            (f): f is FilterModel<'date'> =>
              f.columnId === column.id && f.type === 'date',
          )
          return createDateSubmenuDef({
            filter: dateFilter as FilterModel<'date'>,
            column,
            layer,
            locale,
            strategy,
          })
        }

        if (isNumberColumn(column)) {
          const numberFilter = filters.find(
            (f): f is FilterModel<'number'> =>
              f.columnId === column.id && f.type === 'number',
          )
          return createNumberSubmenuDef({
            filter: numberFilter as FilterModel<'number'>,
            column,
            layer,
            locale,
            strategy,
          })
        }

        if (isBooleanColumn(column)) {
          return createBooleanItemDef({
            column,
            layer,
          })
        }

        if (isOptionColumn(column)) {
          const optionFilter = filters.find(
            (f): f is FilterModel<'option'> =>
              f.columnId === column.id && f.type === 'option',
          )
          return createOptionSubmenuDef({
            column,
            layer,
            filter: optionFilter,
            locale,
            strategy,
          })
        }

        if (isMultiOptionColumn(column)) {
          const multiOptionFilter = filters.find(
            (f): f is FilterModel<'multiOption'> =>
              f.columnId === column.id && f.type === 'multiOption',
          )
          return createMultiOptionSubmenuDef({
            column,
            layer,
            filter: multiOptionFilter,
            locale,
            strategy,
          })
        }

        // Fallback for any unknown column types
        return {
          kind: 'submenu',
          id: column.id,
          value: column.displayName,
          render: createSubmenuRenderer(
            column.id,
            column.displayName,
            column.icon,
            [],
          ),
        } satisfies SubmenuDef
      }),
    [columns, filters, layer, instance, locale, strategy],
  )

  const triggerElement = children ?? (
    <FilterTrigger
      hasVisibleFilters={hasVisibleFilters}
      locale={locale}
      variant={variant}
    />
  )

  return (
    <DropdownMenu.Root {...rootProps}>
      <DropdownMenu.Trigger render={triggerElement} />
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner align="start">
          <DropdownMenu.Popup>
            <DropdownMenu.DataSurface content={nodes}>
              <DropdownMenu.DataInput placeholder="Search filters..." />
              <DropdownMenu.DataList>
                {({ nodes: displayNodes, renderNode }) =>
                  displayNodes.map(renderNode)
                }
              </DropdownMenu.DataList>
              <DropdownMenu.Empty>No matching filters.</DropdownMenu.Empty>
            </DropdownMenu.DataSurface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export const FilterMenu = memo(__FilterMenu) as typeof __FilterMenu

export namespace FilterMenu {
  export type Props<TData = unknown> = FilterMenuProps<TData>
}
