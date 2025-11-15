import type {
  Column,
  ColumnDataType,
  DataTableFilterActions,
  FilterModel,
  FilterStrategy,
  Locale,
} from '@bazza-ui/filters'
import type { ComponentPropsWithoutRef } from 'react'
import type { FilterVariant } from '../../../context'

export interface FilterValueProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
  entityName?: string
  className?: string
  variant?: FilterVariant
}

export interface FilterValueDisplayProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  locale?: Locale
  entityName?: string
}

export interface FilterValueControllerProps<
  TData,
  TType extends ColumnDataType,
> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
}
