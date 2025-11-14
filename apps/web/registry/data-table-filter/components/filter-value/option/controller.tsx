'use client'

import { t } from '@bazza-ui/filters'
import { useCallback, useMemo } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { OptionItem } from '../shared/option-item'
import type { FilterValueControllerProps } from '../shared/types'

export function FilterValueOptionController<TData>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueControllerProps<TData, 'option'>) {
  // Derive the initial selected values on mount
  const initialSelectedValues = useMemo(() => new Set(filter?.values || []), [])

  // Separate the selected and unselected options
  const { selectedOptions, unselectedOptions } = useMemo(() => {
    const counts = column.getFacetedUniqueValues()
    const allOptions = column.getOptions().map((o) => {
      const currentlySelected = filter?.values.includes(o.value) ?? false
      return {
        ...o,
        selected: currentlySelected,
        count: counts?.get(o.value) ?? 0,
      }
    })

    const selected = allOptions.filter((o) =>
      initialSelectedValues.has(o.value),
    )
    const unselected = allOptions.filter(
      (o) => !initialSelectedValues.has(o.value),
    )
    return { selectedOptions: selected, unselectedOptions: unselected }
  }, [column, filter?.values, initialSelectedValues])

  const handleToggle = useCallback(
    (value: string, checked: boolean) => {
      if (checked) actions.addFilterValue(column, [value])
      else actions.removeFilterValue(column, [value])
    },
    [actions, column],
  )

  return (
    <Command className="max-w-[300px]" loop>
      <CommandInput autoFocus placeholder={t('search', locale)} />
      <CommandEmpty>{t('noresults', locale)}</CommandEmpty>
      <CommandList>
        <CommandGroup className={cn(selectedOptions.length === 0 && 'hidden')}>
          {selectedOptions.map((option) => (
            <OptionItem
              key={option.value}
              option={option}
              onToggle={handleToggle}
            />
          ))}
        </CommandGroup>
        {/* Only show separator if there are both selected AND unselected options */}
        <CommandSeparator
          className={cn(
            (unselectedOptions.length === 0 || selectedOptions.length === 0) &&
              'hidden',
          )}
        />
        <CommandGroup
          className={cn(unselectedOptions.length === 0 && 'hidden')}
        >
          {unselectedOptions.map((option) => (
            <OptionItem
              key={option.value}
              option={option}
              onToggle={handleToggle}
            />
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
