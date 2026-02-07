'use client'

// @bazza-ui/data-view — useDataView Hook
// Main React hook for managing data view state with two-layer architecture:
//   baseView  — the view's identity (implicit filters/sort, not shown in filter bar)
//   overrides — user's ephemeral refinements (shown in filter bar)

import { useCallback, useMemo, useRef, useState } from 'react'
import { filterDataByColumns, sortDataByColumns } from '../core/client.js'
import { createColumns } from '../core/columns/index.js'
import { filterOperations } from '../core/filters.js'
import { sortOperations } from '../core/sort.js'
import type {
  BaseViewLayer,
  BatchActions,
  BigIntColumnIds,
  Column,
  ColumnConfig,
  ColumnDataType,
  ColumnSort,
  DataViewInstance,
  DataViewOptions,
  DataViewState,
  DataViewStateUpdaterFn,
  FilterModel,
  FilterStrategy,
  FiltersState,
  NumberColumnIds,
  OptionBasedColumnDataType,
  OptionColumnIds,
  OverridesLayer,
  SortDirection,
  SortState,
  Updater,
} from '../core/types.js'
import { mergeFilters, mergeSort, viewOperations } from '../core/view.js'
import {
  isColumnOptionArray,
  isColumnOptionMap,
  isMinMaxTuple,
} from '../lib/helpers.js'

// ── Helpers ─────────────────────────────────────────────────

const EMPTY_VIEW: DataViewState = { filters: [], sort: [] }

/** Resolve an Updater<T> — handles both direct values and updater functions. */
function resolveUpdater<T>(updater: Updater<T>, prev: T): T {
  return typeof updater === 'function'
    ? (updater as (old: T) => T)(prev)
    : updater
}

// ── Hook ────────────────────────────────────────────────────

export function useDataView<
  TData,
  TColumns extends ReadonlyArray<ColumnConfig<TData, any, any, any>>,
  TStrategy extends FilterStrategy,
  TContext,
>({
  strategy,
  data,
  columnsConfig,
  defaultBaseView,
  baseView: externalBaseView,
  onBaseViewChange,
  defaultOverrides,
  overrides: externalOverrides,
  onOverridesChange,
  options,
  faceted,
  entityName,
}: DataViewOptions<TData, TColumns, TStrategy, TContext>): DataViewInstance<
  TData,
  TStrategy,
  TContext
> {
  // ── Internal state ────────────────────────────────────────

  const [internalBaseView, setInternalBaseView] = useState<DataViewState>(
    defaultBaseView ?? EMPTY_VIEW,
  )
  const [internalOverrides, setInternalOverrides] = useState<DataViewState>(
    defaultOverrides ?? EMPTY_VIEW,
  )

  // ── Controlled validation ─────────────────────────────────

  if (
    (externalBaseView !== undefined && onBaseViewChange === undefined) ||
    (externalBaseView === undefined && onBaseViewChange !== undefined)
  ) {
    throw new Error(
      '[data-view] If using controlled base view, you must specify both `baseView` and `onBaseViewChange`.',
    )
  }
  if (
    (externalOverrides !== undefined && onOverridesChange === undefined) ||
    (externalOverrides === undefined && onOverridesChange !== undefined)
  ) {
    throw new Error(
      '[data-view] If using controlled overrides, you must specify both `overrides` and `onOverridesChange`.',
    )
  }

  const isBaseControlled =
    externalBaseView !== undefined && onBaseViewChange !== undefined
  const isOverridesControlled =
    externalOverrides !== undefined && onOverridesChange !== undefined

  const currentBaseView = isBaseControlled ? externalBaseView : internalBaseView
  const currentOverrides = isOverridesControlled
    ? externalOverrides
    : internalOverrides

  // ── State setters ─────────────────────────────────────────

  const setBaseView = useCallback(
    (
      nextOrUpdater: DataViewState | ((prev: DataViewState) => DataViewState),
      context?: TContext,
    ) => {
      if (isBaseControlled) {
        const prev = currentBaseView
        const next =
          typeof nextOrUpdater === 'function'
            ? nextOrUpdater(prev)
            : nextOrUpdater

        if (onBaseViewChange!.length <= 1) {
          ;(onBaseViewChange as (view: DataViewState) => void)(next)
        } else {
          ;(onBaseViewChange as DataViewStateUpdaterFn<TContext>)(
            prev,
            next,
            context,
          )
        }
      } else {
        setInternalBaseView(nextOrUpdater)
      }
    },
    [currentBaseView, isBaseControlled, onBaseViewChange],
  )

  const setOverrides = useCallback(
    (
      nextOrUpdater: DataViewState | ((prev: DataViewState) => DataViewState),
      context?: TContext,
    ) => {
      if (isOverridesControlled) {
        const prev = currentOverrides
        const next =
          typeof nextOrUpdater === 'function'
            ? nextOrUpdater(prev)
            : nextOrUpdater

        if (onOverridesChange!.length <= 1) {
          ;(onOverridesChange as (view: DataViewState) => void)(next)
        } else {
          ;(onOverridesChange as DataViewStateUpdaterFn<TContext>)(
            prev,
            next,
            context,
          )
        }
      } else {
        setInternalOverrides(nextOrUpdater)
      }
    },
    [currentOverrides, isOverridesControlled, onOverridesChange],
  )

  // ── Merged (effective) state ──────────────────────────────

  const effectiveFilters = useMemo(
    () => mergeFilters(currentBaseView.filters, currentOverrides.filters),
    [currentBaseView.filters, currentOverrides.filters],
  )

  const effectiveSort = useMemo(
    () => mergeSort(currentBaseView.sort, currentOverrides.sort),
    [currentBaseView.sort, currentOverrides.sort],
  )

  const effectiveView = useMemo<DataViewState>(
    () => ({
      ...(currentBaseView.id !== undefined ? { id: currentBaseView.id } : {}),
      ...(currentBaseView.name !== undefined
        ? { name: currentBaseView.name }
        : {}),
      filters: effectiveFilters,
      sort: effectiveSort,
    }),
    [currentBaseView.id, currentBaseView.name, effectiveFilters, effectiveSort],
  )

  // ── Columns ───────────────────────────────────────────────

  const columns = useMemo(() => {
    const enhancedConfigs = columnsConfig.map((config) => {
      let final = config

      // Inject static options for option-based columns
      if (
        options &&
        (config.type === 'option' || config.type === 'multiOption')
      ) {
        const optionsInput = options[config.id as OptionColumnIds<TColumns>]
        if (!optionsInput || !isColumnOptionArray(optionsInput)) return config
        final = { ...final, options: optionsInput }
      }

      // Inject faceted options
      if (
        (config.type === 'option' || config.type === 'multiOption') &&
        faceted
      ) {
        const facetedOptionsInput =
          faceted[config.id as OptionColumnIds<TColumns>]
        if (!facetedOptionsInput || !isColumnOptionMap(facetedOptionsInput))
          return config
        final = { ...final, facetedOptions: facetedOptionsInput }
      }

      // Inject faceted min/max for number columns
      if (config.type === 'number' && faceted) {
        const minMaxTuple = faceted[config.id as NumberColumnIds<TColumns>]
        if (!minMaxTuple || !isMinMaxTuple<number>(minMaxTuple, 'number'))
          return config
        final = { ...final, min: minMaxTuple[0], max: minMaxTuple[1] }
      }

      // Inject faceted min/max for bigint columns
      if (config.type === 'bigint' && faceted) {
        const minMaxTuple = faceted[config.id as BigIntColumnIds<TColumns>]
        if (!minMaxTuple || !isMinMaxTuple<bigint>(minMaxTuple, 'bigint'))
          return config
        final = { ...final, min: minMaxTuple[0], max: minMaxTuple[1] }
      }

      return final
    })

    return createColumns(data, enhancedConfigs, strategy)
  }, [data, columnsConfig, options, faceted, strategy])

  // ── Attach column state helpers ───────────────────────────
  // We use refs so that column closures always read the latest state
  // without needing to re-create columns on every state change.

  const baseViewRef = useRef(currentBaseView)
  baseViewRef.current = currentBaseView
  const overridesRef = useRef(currentOverrides)
  overridesRef.current = currentOverrides
  const effectiveFiltersRef = useRef(effectiveFilters)
  effectiveFiltersRef.current = effectiveFilters
  const effectiveSortRef = useRef(effectiveSort)
  effectiveSortRef.current = effectiveSort
  const setOverridesRef = useRef(setOverrides)
  setOverridesRef.current = setOverrides

  // Attach closures to each column — these read from refs so they're always fresh.
  // biome-ignore lint/correctness/useExhaustiveDependencies: we intentionally want columns as dep, refs are stable
  useMemo(() => {
    for (const column of columns) {
      const colId = column.id

      // ── Readers (effective state) ──
      column.getIsFiltered = () =>
        effectiveFiltersRef.current.some((f) => f.columnId === colId)

      column.getFilterValue = () =>
        effectiveFiltersRef.current.find((f) => f.columnId === colId)

      column.getBaseFilterValue = () =>
        baseViewRef.current.filters.find((f) => f.columnId === colId)

      column.getOverrideFilterValue = () =>
        overridesRef.current.filters.find((f) => f.columnId === colId)

      column.getIsSorted = () => {
        const rule = effectiveSortRef.current.find(
          (r): r is ColumnSort => r.type === 'column' && r.columnId === colId,
        )
        return rule ? rule.direction : false
      }

      column.getSortIndex = () =>
        effectiveSortRef.current.findIndex(
          (r) => r.type === 'column' && (r as ColumnSort).columnId === colId,
        )

      // ── Mutators (overrides layer) ──
      column.setFilterValue = (values: unknown[]) => {
        setOverridesRef.current((prev) => ({
          ...prev,
          filters: filterOperations.setFilterValue(
            prev.filters,
            column as Column<TData, any>,
            values,
          ),
        }))
      }

      column.addFilterValue = (values: unknown[]) => {
        setOverridesRef.current((prev) => ({
          ...prev,
          filters: filterOperations.addFilterValue(
            prev.filters,
            column as Column<TData, 'option' | 'multiOption'>,
            values,
          ),
        }))
      }

      column.removeFilterValue = (values: unknown[]) => {
        setOverridesRef.current((prev) => ({
          ...prev,
          filters: filterOperations.removeFilterValue(
            prev.filters,
            column as Column<TData, 'option' | 'multiOption'>,
            values,
          ),
        }))
      }

      column.removeFilter = () => {
        setOverridesRef.current((prev) => ({
          ...prev,
          filters: filterOperations.removeFilter(prev.filters, colId),
        }))
      }

      column.toggleSorting = () => {
        setOverridesRef.current((prev) => ({
          ...prev,
          sort: sortOperations.toggleColumnSort(prev.sort, colId),
        }))
      }

      column.clearSorting = () => {
        setOverridesRef.current((prev) => ({
          ...prev,
          sort: prev.sort.filter(
            (r) => !(r.type === 'column' && r.columnId === colId),
          ),
        }))
      }
    }
  }, [columns])

  // ── Build layer helper factory ────────────────────────────

  function buildLayerHelpers<TCtx>(
    getState: () => DataViewState,
    setState: (
      updater: DataViewState | ((prev: DataViewState) => DataViewState),
      context?: TCtx,
    ) => void,
  ) {
    return {
      setFilters(updater: Updater<FiltersState>, context?: TCtx) {
        setState(
          (prev) => ({
            ...prev,
            filters: resolveUpdater(updater, prev.filters),
          }),
          context,
        )
      },

      setSort(updater: Updater<SortState>, context?: TCtx) {
        setState(
          (prev) => ({
            ...prev,
            sort: resolveUpdater(updater, prev.sort),
          }),
          context,
        )
      },

      addFilterValue<TType extends OptionBasedColumnDataType>(
        column: Column<TData, TType>,
        values: FilterModel<TType>['values'],
        context?: TCtx,
      ) {
        setState(
          (prev) => ({
            ...prev,
            filters: filterOperations.addFilterValue(
              prev.filters,
              column,
              values,
            ),
          }),
          context,
        )
      },

      removeFilterValue<TType extends OptionBasedColumnDataType>(
        column: Column<TData, TType>,
        value: FilterModel<TType>['values'],
        context?: TCtx,
      ) {
        setState(
          (prev) => ({
            ...prev,
            filters: filterOperations.removeFilterValue(
              prev.filters,
              column,
              value,
            ),
          }),
          context,
        )
      },

      setFilterValue<TType extends ColumnDataType>(
        column: Column<TData, TType>,
        values: FilterModel<TType>['values'],
        context?: TCtx,
      ) {
        setState(
          (prev) => ({
            ...prev,
            filters: filterOperations.setFilterValue(
              prev.filters,
              column,
              values,
            ),
          }),
          context,
        )
      },

      setFilterOperator(columnId: string, operator: string, context?: TCtx) {
        setState(
          (prev) => ({
            ...prev,
            filters: filterOperations.setFilterOperator(
              prev.filters,
              columnId,
              operator,
            ),
          }),
          context,
        )
      },

      removeFilter(columnId: string, context?: TCtx) {
        setState(
          (prev) => ({
            ...prev,
            filters: filterOperations.removeFilter(prev.filters, columnId),
          }),
          context,
        )
      },

      removeAllFilters(context?: TCtx) {
        setState(
          (prev) => ({
            ...prev,
            filters: filterOperations.removeAllFilters(),
          }),
          context,
        )
      },

      toggleColumnSort(columnId: string, context?: TCtx) {
        setState(
          (prev) => ({
            ...prev,
            sort: sortOperations.toggleColumnSort(prev.sort, columnId),
          }),
          context,
        )
      },

      setCustomSort(id: string, enabled: boolean, context?: TCtx) {
        setState(
          (prev) => ({
            ...prev,
            sort: sortOperations.setCustomSort(prev.sort, id, enabled),
          }),
          context,
        )
      },

      clearSort(context?: TCtx) {
        setState(
          (prev) => ({
            ...prev,
            sort: sortOperations.clearSort(),
          }),
          context,
        )
      },
    }
  }

  // ── Base View Layer ───────────────────────────────────────

  const baseViewLayer = useMemo<BaseViewLayer<TData, TContext>>(() => {
    const helpers = buildLayerHelpers<TContext>(
      () => currentBaseView,
      setBaseView,
    )

    return {
      get filters() {
        return currentBaseView.filters
      },
      get sort() {
        return currentBaseView.sort
      },
      get id() {
        return currentBaseView.id
      },
      get name() {
        return currentBaseView.name
      },

      ...helpers,

      load(view: DataViewState, context?: TContext) {
        setBaseView(() => viewOperations.load(view), context)
        // Auto-clear overrides when switching base view
        setOverrides(() => ({ ...EMPTY_VIEW, filters: [], sort: [] }), context)
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBaseView, setBaseView, setOverrides])

  // ── Overrides Layer ───────────────────────────────────────

  const overridesLayer = useMemo<OverridesLayer<TData, TContext>>(() => {
    const helpers = buildLayerHelpers<TContext>(
      () => currentOverrides,
      setOverrides,
    )

    return {
      get filters() {
        return currentOverrides.filters
      },
      get sort() {
        return currentOverrides.sort
      },

      ...helpers,

      reset(context?: TContext) {
        setOverrides(() => ({ ...EMPTY_VIEW, filters: [], sort: [] }), context)
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOverrides, setOverrides])

  // ── Snapshot ──────────────────────────────────────────────

  const snapshot = useCallback(
    (
      meta?: { id?: string; name?: string },
      _context?: TContext,
    ): DataViewState => {
      return viewOperations.snapshot(effectiveView, meta)
    },
    [effectiveView],
  )

  // ── Batch (operates on overrides) ─────────────────────────

  const batch = useCallback(
    (callback: (batchActions: BatchActions) => void, context?: TContext) => {
      setOverrides((prevOverrides) => {
        let txFilters = prevOverrides.filters
        let txSort = prevOverrides.sort

        const batchActions: BatchActions = {
          addFilterValue<TType extends OptionBasedColumnDataType>(
            column: Column<TData, TType>,
            values: FilterModel<TType>['values'],
          ) {
            txFilters = filterOperations.addFilterValue(
              txFilters,
              column,
              values,
            )
          },

          removeFilterValue<TType extends OptionBasedColumnDataType>(
            column: Column<TData, TType>,
            value: FilterModel<TType>['values'],
          ) {
            txFilters = filterOperations.removeFilterValue(
              txFilters,
              column,
              value,
            )
          },

          setFilterValue<TType extends ColumnDataType>(
            column: Column<TData, TType>,
            values: FilterModel<TType>['values'],
          ) {
            txFilters = filterOperations.setFilterValue(
              txFilters,
              column,
              values,
            )
          },

          setFilterOperator(columnId: string, operator: string) {
            txFilters = filterOperations.setFilterOperator(
              txFilters,
              columnId,
              operator,
            )
          },

          removeFilter(columnId: string) {
            txFilters = filterOperations.removeFilter(txFilters, columnId)
          },

          removeAllFilters() {
            txFilters = filterOperations.removeAllFilters()
          },

          setSort(newSort: SortState) {
            txSort = sortOperations.setSort(newSort)
          },

          toggleColumnSort(columnId: string) {
            txSort = sortOperations.toggleColumnSort(txSort, columnId)
          },

          setCustomSort(id: string, enabled: boolean) {
            txSort = sortOperations.setCustomSort(txSort, id, enabled)
          },

          clearSort() {
            txSort = sortOperations.clearSort()
          },
        }

        callback(batchActions)

        return { ...prevOverrides, filters: txFilters, sort: txSort }
      }, context)
    },
    [setOverrides],
  )

  // ── Client-side processing ────────────────────────────────

  const filteredData = useMemo(() => {
    if (strategy !== 'client') return data
    return filterDataByColumns(data, columns, effectiveFilters)
  }, [strategy, data, columns, effectiveFilters])

  const processedData = useMemo(() => {
    if (strategy !== 'client') return data
    return sortDataByColumns(filteredData, columns, effectiveSort)
  }, [strategy, filteredData, columns, effectiveSort, data])

  // ── Return ────────────────────────────────────────────────

  return {
    columns,
    baseView: baseViewLayer,
    overrides: overridesLayer,
    filters: effectiveFilters,
    sort: effectiveSort,
    view: effectiveView,
    processedData,
    snapshot,
    batch,
    strategy,
    entityName,
  }
}

// ── Typed Factory ───────────────────────────────────────────

/**
 * Creates a pre-typed `useDataView` hook with a fixed `TContext` type.
 * Useful when you want to enforce a specific context type across your app.
 *
 * @example
 * ```typescript
 * const useMyDataView = createTypedDataView<{ source: string }>()
 * ```
 */
export function createTypedDataView<TContext>() {
  return function useTypedDataView<
    TData,
    TColumns extends ReadonlyArray<ColumnConfig<TData, any, any, any>>,
    TStrategy extends FilterStrategy,
  >(
    options: DataViewOptions<TData, TColumns, TStrategy, TContext>,
  ): DataViewInstance<TData, TStrategy, TContext> {
    return useDataView<TData, TColumns, TStrategy, TContext>(options)
  }
}
