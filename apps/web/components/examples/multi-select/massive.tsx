'use client'

import { useState } from 'react'
import { MultiSelect } from '@/registry/multi-select'

interface MassiveProps {
  numItems?: number
}

export function Massive({ numItems = 10000 }: MassiveProps) {
  const [values, setValues] = useState<string[]>([])

  const items = Array.from({ length: numItems }, (_, i) => ({
    value: `item-${i}`,
    label: `Item ${i + 1}`,
  }))

  return (
    <div className="flex flex-col items-center gap-4">
      <MultiSelect
        value={values}
        onValueChange={setValues}
        placeholder={`Search ${numItems.toLocaleString()} items...`}
        items={items}
        defaults={{
          virtualization: {
            enabled: true,
            overscan: 5,
          },
        }}
      />
      {values.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Selected {values.length} items
        </p>
      )}
    </div>
  )
}
