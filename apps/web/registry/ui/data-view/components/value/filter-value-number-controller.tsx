'use client'

import { createNumberRange, getOperatorSet, t } from '@bazza-ui/data-view'
import type { Column, Locale, ViewLayer } from '@bazza-ui/data-view/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Command, CommandGroup, CommandList } from '@/components/ui/command'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebounceCallback } from '../../hooks/use-debounce-callback'
import { DebouncedInput } from '../../ui/debounced-input'
import type { FilterValueControllerProps } from './types'

export function FilterValueNumberController<TData>({
  filter,
  column,
  layer,
  locale = 'en',
}: FilterValueControllerProps<TData, 'number'>) {
  type MinMaxReturn = [number, number] | undefined
  const minMax = useMemo(
    () => column.getFacetedMinMaxValues() as MinMaxReturn,
    [column],
  )
  const [sliderMin, sliderMax] = [
    minMax ? minMax[0] : 0,
    minMax ? minMax[1] : 0,
  ]

  // Local state for values
  const filterValues = (filter?.values as number[] | undefined) ?? [0, 0]
  const [values, setValues] = useState(filterValues)

  // Sync with parent filter changes
  useEffect(() => {
    if (
      filter?.values &&
      filter.values.length === values.length &&
      (filter.values as number[]).every((v, i) => v === values[i])
    ) {
      setValues(filter.values as number[])
    }
  }, [filter?.values, values])

  // Check operator target to determine if it's a range
  const operatorSet = useMemo(() => getOperatorSet(column), [column])
  const isNumberRange =
    filter &&
    operatorSet.has(filter.operator) &&
    operatorSet.get(filter.operator).target === 'multiple'

  const setFilterOperatorDebounced = useDebounceCallback(
    (columnId: string, operator: string) =>
      layer.setFilterOperator(columnId, operator),
    500,
  )

  // Create a typed wrapper for setFilterValue to avoid 'as any' casts
  const setNumberFilterValue = useCallback(
    (col: Column<TData, 'number'>, vals: number[]) => {
      layer.setFilterValue(col, vals)
    },
    [layer],
  )
  const setFilterValueDebounced = useDebounceCallback(setNumberFilterValue, 500)

  const changeNumber = (value: number[]) => {
    setValues(value)
    setFilterValueDebounced(column, value)
  }

  const changeMinNumber = (value: number) => {
    const newValues = createNumberRange([value, values[1]!])
    setValues(newValues)
    setFilterValueDebounced(column, newValues)
  }

  const changeMaxNumber = (value: number) => {
    const newValues = createNumberRange([values[0]!, value])
    setValues(newValues)
    setFilterValueDebounced(column, newValues)
  }

  const changeType = useCallback(
    (type: 'single' | 'range') => {
      let newValues: number[] = []
      if (type === 'single')
        newValues = [values[0]!] // Keep the first value for single mode
      else if (!minMax)
        newValues = createNumberRange([values[0]!, values[1] ?? 0])
      else {
        const value = values[0]!
        newValues =
          value - minMax[0] < minMax[1] - value
            ? createNumberRange([value, minMax[1]])
            : createNumberRange([minMax[0], value])
      }

      const newOperator = type === 'single' ? 'is' : 'is between'

      // Update local state
      setValues(newValues)

      // Cancel in-flight debounced calls to prevent flicker/race conditions
      setFilterOperatorDebounced.cancel()
      setFilterValueDebounced.cancel()

      // Update global filter state atomically
      layer.setFilterOperator(column.id, newOperator)
      layer.setFilterValue(column, newValues)
    },
    [
      values,
      column,
      layer,
      minMax,
      setFilterOperatorDebounced,
      setFilterValueDebounced,
    ],
  )

  return (
    <div className="flex flex-col w-[315px] p-4">
      <Tabs
        value={isNumberRange ? 'range' : 'single'}
        onValueChange={(v) => changeType(v as 'single' | 'range')}
      >
        <TabsList className="w-full *:text-xs">
          <TabsTrigger value="single">{t('single', locale)}</TabsTrigger>
          <TabsTrigger value="range">{t('range', locale)}</TabsTrigger>
        </TabsList>
        <TabsContent value="single" className="flex flex-col gap-4 mt-4">
          {minMax && (
            <Slider
              value={[values[0]!]}
              onValueChange={(value) => changeNumber(value)}
              min={sliderMin}
              max={sliderMax}
              step={1}
              aria-orientation="horizontal"
            />
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{t('value', locale)}</span>
            <DebouncedInput
              id="single"
              type="number"
              value={values[0]!.toString()}
              onChange={(v) => changeNumber([Number(v)])}
            />
          </div>
        </TabsContent>
        <TabsContent value="range" className="flex flex-col gap-4 mt-4">
          {minMax && (
            <Slider
              value={values}
              onValueChange={changeNumber}
              min={sliderMin}
              max={sliderMax}
              step={1}
              aria-orientation="horizontal"
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">{t('min', locale)}</span>
              <DebouncedInput
                type="number"
                value={values[0]!}
                onChange={(v) => changeMinNumber(Number(v))}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">{t('max', locale)}</span>
              <DebouncedInput
                type="number"
                value={values[1]!}
                onChange={(v) => changeMaxNumber(Number(v))}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
