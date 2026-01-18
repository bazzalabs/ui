'use client'

import type {
  Column,
  ColumnDataType,
  DataTableFilterActions,
  FilterModel,
  FilterStrategy,
  Locale,
} from '@bazza-ui/filters'
import { useFilterItemContext } from '../components/item/filter-item'
import type { FilterVariant } from '../components/root/filter-context'
import {
  useFilterActions,
  useFilterLocale,
  useFilterStrategy,
  useFilterVariant,
} from '../components/root/filter-context'

/**
 * Input props for the resolution hook.
 * All props are optional - they will be resolved from context if not provided.
 */
export interface UseResolvedFilterPropsInput<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> {
  column?: Column<TData, TType>
  filter?: FilterModel<TType>
  actions?: DataTableFilterActions
  strategy?: FilterStrategy
  locale?: Locale
  entityName?: string
  variant?: FilterVariant
}

/**
 * Base resolved props that are always available after resolution.
 */
export interface ResolvedFilterPropsBase {
  actions: DataTableFilterActions
  locale: Locale
  variant: FilterVariant
}

/**
 * Resolved props when column and filter are required.
 */
export interface ResolvedFilterPropsWithColumnAndFilter<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> extends ResolvedFilterPropsBase {
  column: Column<TData, TType>
  filter: FilterModel<TType>
  strategy: FilterStrategy
  entityName?: string
}

/**
 * Resolved props when only column is required.
 */
export interface ResolvedFilterPropsWithColumn<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> extends ResolvedFilterPropsBase {
  column: Column<TData, TType>
  entityName?: string
}

/**
 * Resolved props when only actions are required.
 */
export interface ResolvedFilterPropsWithActions
  extends ResolvedFilterPropsBase {
  filter: FilterModel
}

/**
 * Hook to resolve filter-related props from explicit props or context.
 * Reduces boilerplate in FilterOperator, FilterRemove, FilterSubject, FilterValue.
 *
 * @returns The resolved props, or null if required props are missing
 */
export function useResolvedFilterProps<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
>(
  props: UseResolvedFilterPropsInput<TData, TType>,
): ResolvedFilterPropsWithColumnAndFilter<TData, TType> | null {
  const itemContext = useFilterItemContext<TData, TType>()
  const filterActions = useFilterActions()
  const filterStrategy = useFilterStrategy()
  const filterLocale = useFilterLocale()
  const contextVariant = useFilterVariant()

  const column = props.column ?? itemContext?.column
  const filter = props.filter ?? itemContext?.filter
  const actions = props.actions ?? itemContext?.actions ?? filterActions
  const strategy = props.strategy ?? itemContext?.strategy ?? filterStrategy
  const locale = props.locale ?? itemContext?.locale ?? filterLocale ?? 'en'
  const entityName = props.entityName ?? itemContext?.entityName
  const variant = props.variant ?? contextVariant ?? 'default'

  if (!column || !filter || !actions || !strategy) {
    return null
  }

  return {
    column,
    filter,
    actions,
    strategy,
    locale,
    entityName,
    variant,
  }
}

/**
 * Hook to resolve filter props when only column is required.
 * Used by FilterSubject which doesn't need filter or actions.
 */
export function useResolvedColumnProps<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
>(
  props: Pick<
    UseResolvedFilterPropsInput<TData, TType>,
    'column' | 'entityName' | 'variant'
  >,
): ResolvedFilterPropsWithColumn<TData, TType> | null {
  const itemContext = useFilterItemContext<TData, TType>()
  const filterLocale = useFilterLocale()
  const filterActions = useFilterActions()
  const contextVariant = useFilterVariant()

  const column = props.column ?? itemContext?.column
  const entityName = props.entityName ?? itemContext?.entityName
  const variant = props.variant ?? contextVariant ?? 'default'
  const locale = itemContext?.locale ?? filterLocale ?? 'en'
  const actions = itemContext?.actions ?? filterActions

  if (!column || !actions) {
    return null
  }

  return {
    column,
    actions,
    locale,
    entityName,
    variant,
  }
}

/**
 * Hook to resolve filter props when only filter and actions are required.
 * Used by FilterRemove which doesn't need column.
 */
export function useResolvedFilterActionsProps(
  props: Pick<UseResolvedFilterPropsInput, 'filter' | 'actions' | 'variant'>,
): ResolvedFilterPropsWithActions | null {
  const itemContext = useFilterItemContext()
  const filterActions = useFilterActions()
  const filterLocale = useFilterLocale()
  const contextVariant = useFilterVariant()

  const filter = props.filter ?? itemContext?.filter
  const actions = props.actions ?? itemContext?.actions ?? filterActions
  const variant = props.variant ?? contextVariant ?? 'default'
  const locale = itemContext?.locale ?? filterLocale ?? 'en'

  if (!filter || !actions) {
    return null
  }

  return {
    filter,
    actions,
    locale,
    variant,
  }
}
