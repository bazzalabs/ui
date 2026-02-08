'use client'

import type {
  Column,
  DataViewInstance,
  FilterStrategy,
  Locale,
  ViewLayer,
} from '@bazza-ui/data-view/react'
import {
  DataViewContext,
  type DataViewContextValue,
  type DataViewVariant,
} from '../root/data-view-context'

export interface DataViewProviderProps<TData = unknown> {
  instance: DataViewInstance<TData, any, any>
  /**
   * Which layer the filter UI operates on: 'overrides' (default) or 'base'.
   * Controls which layer filter/sort actions target.
   */
  layer?: 'overrides' | 'base'
  locale?: Locale
  variant?: DataViewVariant
  children: React.ReactNode
}

export function DataViewProvider<TData>({
  instance,
  layer: layerProp = 'overrides',
  locale = 'en',
  variant,
  children,
}: DataViewProviderProps<TData>) {
  const activeLayer: ViewLayer<TData> =
    layerProp === 'base' ? instance.baseView : instance.overrides

  const contextValue: DataViewContextValue<TData> = {
    instance,
    columns: instance.columns,
    filters: activeLayer.filters,
    sort: activeLayer.sort,
    layer: activeLayer,
    strategy: instance.strategy,
    locale,
    entityName: instance.entityName,
    variant,
  }

  return (
    <DataViewContext.Provider value={contextValue as DataViewContextValue}>
      {children}
    </DataViewContext.Provider>
  )
}

export namespace DataViewProvider {
  export type Props<TData = unknown> = DataViewProviderProps<TData>
}
