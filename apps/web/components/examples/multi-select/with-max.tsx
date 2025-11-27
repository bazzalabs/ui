'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/registry/ui/multi-select'

export function WithMax() {
  const [values, setValues] = useState<string[]>([])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center space-y-2">
        <MultiSelect
          value={values}
          onValueChange={setValues}
          placeholder="Select up to 3 items..."
          max={3}
          items={[
            { value: '1', label: 'Option 1' },
            { value: '2', label: 'Option 2' },
            { value: '3', label: 'Option 3' },
            { value: '4', label: 'Option 4' },
            { value: '5', label: 'Option 5' },
            { value: '6', label: 'Option 6' },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          Maximum 3 selections allowed
        </p>
      </div>
      {values.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Selected:{' '}
          <span className="font-medium text-foreground">
            {values.join(', ')}
          </span>
        </p>
      )}
    </div>
  )
}
