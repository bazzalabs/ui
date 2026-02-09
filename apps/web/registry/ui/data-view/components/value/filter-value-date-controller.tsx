'use client'

import type { Column, FilterModel, ViewLayer } from '@bazza-ui/data-view/react'
import { isEqual } from 'date-fns'
import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { Command, CommandGroup, CommandList } from '@/components/ui/command'
import type { FilterValueControllerProps } from './types'

export function FilterValueDateController<TData>({
  filter,
  column,
  layer,
}: FilterValueControllerProps<TData, 'date'>) {
  const values = filter?.values as Date[] | undefined
  const [date, setDate] = useState<DateRange | undefined>({
    from: values?.[0] ?? new Date(),
    to: values?.[1] ?? undefined,
  })

  function changeDateRange(value: DateRange | undefined) {
    const start = value?.from
    const end =
      start && value && value.to && !isEqual(start, value.to)
        ? value.to
        : undefined

    setDate({ from: start, to: end })

    const isRange = start && end
    const newValues = isRange ? [start, end] : start ? [start] : []

    layer.setFilterValue(column, newValues)
  }

  return (
    <Command>
      <CommandList className="max-h-fit">
        <CommandGroup>
          <div>
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={changeDateRange}
              numberOfMonths={1}
            />
          </div>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
