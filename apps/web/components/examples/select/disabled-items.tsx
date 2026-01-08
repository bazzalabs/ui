'use client'

import { useState } from 'react'
import { Select } from '@/registry/ui/select'

export function DisabledItems() {
  const [value, setValue] = useState('')

  return (
    <div className="flex flex-col items-center gap-4">
      <Select
        value={value}
        onValueChange={setValue}
        items={[
          { value: 'us', label: 'United States' },
          { value: 'uk', label: 'United Kingdom' },
          { value: 'ca', label: 'Canada' },
          { value: 'au', label: 'Australia', disabled: true },
          { value: 'de', label: 'Germany', disabled: true },
          { value: 'fr', label: 'France' },
        ]}
      >
        <Select.Trigger>
          <Select.Value placeholder="Select a country..." />
        </Select.Trigger>
      </Select>
      {value && (
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{value}</span>
        </p>
      )}
    </div>
  )
}
