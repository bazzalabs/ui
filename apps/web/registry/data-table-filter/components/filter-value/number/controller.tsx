'use client'

import {
  createNumberRange,
  type MinMaxReturn,
  numberFilterOperators,
  t,
} from '@bazza-ui/filters'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Command, CommandGroup, CommandList } from '@/components/ui/command'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebounceCallback } from '../../../hooks/use-debounce-callback'
import { DebouncedInput } from '../../../ui/debounced-input'
import type { FilterValueControllerProps } from '../shared/types'

export function FilterValueNumberController<TData>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueControllerProps<TData, 'number'>) {
  const minMax = useMemo(
    () => column.getFacetedMinMaxValues() as MinMaxReturn<'number'>,
    [column],
  )
  const [sliderMin, sliderMax] = [
    minMax ? minMax[0] : 0,
    minMax ? minMax[1] : 0,
  ]

  // Local state for values
  const [values, setValues] = useState(filter?.values ?? [0, 0])

  // Sync with parent filter changes
  useEffect(() => {
    if (
      filter?.values &&
      filter.values.length === values.length &&
      filter.values.every((v, i) => v === values[i])
    ) {
      setValues(filter.values)
    }
  }, [filter?.values, values])

  const isNumberRange =
    // filter && values.length === 2
    filter && numberFilterOperators[filter.operator].target === 'multiple'

  const setFilterOperatorDebounced = useDebounceCallback(
    actions.setFilterOperator,
    500,
  )
  const setFilterValueDebounced = useDebounceCallback(
    actions.setFilterValue,
    500,
  )

  const changeNumber = (value: number[]) => {
    setValues(value)
    setFilterValueDebounced(column as any, value)
  }

  const changeMinNumber = (value: number) => {
    const newValues = createNumberRange([value, values[1]!])
    setValues(newValues)
    setFilterValueDebounced(column as any, newValues)
  }

  const changeMaxNumber = (value: number) => {
    const newValues = createNumberRange([values[0]!, value])
    setValues(newValues)
    setFilterValueDebounced(column as any, newValues)
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
      actions.setFilterOperator(column.id, newOperator)
      actions.setFilterValue(column, newValues)
    },
    [values, column, actions, minMax],
  )

  return (
    <Command>
      <CommandList className="w-[300px] px-2 py-2">
        <CommandGroup>
          <div className="flex flex-col w-full">
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
                  <span className="text-xs font-medium">
                    {t('value', locale)}
                  </span>
                  <DebouncedInput
                    id="single"
                    type="number"
                    value={values[0]!.toString()} // Use values[0] directly
                    onChange={(v) => changeNumber([Number(v)])}
                  />
                </div>
              </TabsContent>
              <TabsContent value="range" className="flex flex-col gap-4 mt-4">
                {minMax && (
                  <Slider
                    value={values} // Use values directly
                    onValueChange={changeNumber}
                    min={sliderMin}
                    max={sliderMax}
                    step={1}
                    aria-orientation="horizontal"
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {t('min', locale)}
                    </span>
                    <DebouncedInput
                      type="number"
                      value={values[0]!}
                      onChange={(v) => changeMinNumber(Number(v))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {t('max', locale)}
                    </span>
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
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
