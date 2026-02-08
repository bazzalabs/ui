import type {
  Column,
  ColumnDataType,
  FilterModel,
  FilterStrategy,
  Locale,
  ViewLayer,
} from '@bazza-ui/data-view/react'
import type { DataViewVariant } from '../root/data-view-context'

export interface FilterValueProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  layer: ViewLayer<TData>
  strategy: FilterStrategy
  locale?: Locale
  entityName?: string
  className?: string
  variant?: DataViewVariant
}

export interface FilterValueDisplayProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  layer: ViewLayer<TData>
  locale?: Locale
  entityName?: string
}

export interface FilterValueControllerProps<
  TData,
  TType extends ColumnDataType,
> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  layer: ViewLayer<TData>
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
