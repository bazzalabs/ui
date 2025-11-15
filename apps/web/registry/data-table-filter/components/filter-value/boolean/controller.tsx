'use client'

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Switch } from '@/components/ui/switch'
import type { FilterValueControllerProps } from '../shared/types'

export function FilterValueBooleanController<TData>({
  filter,
  column,
  actions,
}: FilterValueControllerProps<TData, 'boolean'>) {
  const handleChange = (value: boolean) => {
    actions.setFilterValue(column, [value])
  }

  return (
    <Command>
      <CommandList className="max-h-fit">
        <CommandGroup>
          <CommandItem>
            <Switch
              checked={filter?.values[0] ?? false}
              onCheckedChange={handleChange}
            />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
