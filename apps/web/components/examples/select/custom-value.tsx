'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Select } from '@/registry/ui/select'

const statusItems = [
  { value: 'online', label: 'Online', color: 'bg-green-500' },
  { value: 'away', label: 'Away', color: 'bg-yellow-500' },
  { value: 'busy', label: 'Busy', color: 'bg-red-500' },
  { value: 'offline', label: 'Offline', color: 'bg-gray-400' },
]

/**
 * Custom Value Rendering Example
 *
 * Demonstrates using a render function in Select.Value to customize
 * how the selected value is displayed in the trigger.
 */
export function CustomValue() {
  const [value, setValue] = useState('online')

  return (
    <div className="flex flex-col items-center gap-4">
      <Select
        value={value}
        onValueChange={setValue}
        items={statusItems.map((item) => ({
          value: item.value,
          label: item.label,
          icon: <div className={cn('size-2.5 rounded-full', item.color)} />,
        }))}
      >
        <Select.Trigger>
          <Select.Value placeholder="Select status...">
            {(selectedValue, { node, placeholder }) => {
              if (!selectedValue || !node) {
                return (
                  <span className="text-muted-foreground">{placeholder}</span>
                )
              }

              const status = statusItems.find((s) => s.value === selectedValue)

              return (
                <div className="flex items-center gap-2">
                  <div className={cn('size-2.5 rounded-full', status?.color)} />
                  <span>{node.label}</span>
                </div>
              )
            }}
          </Select.Value>
        </Select.Trigger>
      </Select>
      <p className="text-sm text-muted-foreground">
        Status: <span className="font-medium text-foreground">{value}</span>
      </p>
    </div>
  )
}
