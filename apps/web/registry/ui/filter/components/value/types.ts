import type {
  Column,
  ColumnDataType,
  DataTableFilterActions,
  FilterModel,
  FilterStrategy,
  Locale,
} from '@bazza-ui/filters'
import type { FilterVariant } from '../root/filter-context'

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

export namespace FilterValue {
  export type Props<TData, TType extends ColumnDataType> = FilterValueProps<
    TData,
    TType
  >
  export type DisplayProps<
    TData,
    TType extends ColumnDataType,
  > = FilterValueDisplayProps<TData, TType>
  export type ControllerProps<
    TData,
    TType extends ColumnDataType,
  > = FilterValueControllerProps<TData, TType>
}
