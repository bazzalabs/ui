'use client'

import { useState } from 'react'
import { Select } from '@/registry/select'

interface MassiveProps {
  numItems?: number
}

export function Massive({ numItems = 10000 }: MassiveProps) {
  const [value, setValue] = useState('')

  const items = Array.from({ length: numItems }, (_, i) => ({
    value: `item-${i}`,
    label: `Item ${i + 1}`,
  }))

  return (
    <div className="flex flex-col items-center gap-4">
      <Select
        value={value}
        onValueChange={setValue}
        placeholder={`Search ${numItems.toLocaleString()} items...`}
        items={items}
        defaults={{
          virtualization: {
            enabled: true,
            overscan: 5,
          },
        }}
      />
      {value && (
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{value}</span>
        </p>
      )}
    </div>
  )
}
