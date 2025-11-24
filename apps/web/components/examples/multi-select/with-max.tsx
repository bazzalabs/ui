'use client'

import { useState } from 'react'
import { MultiSelect } from '@/registry/multi-select'
import { Button } from '@/components/ui/button'

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
        >
          <Button variant="outline" className="w-56">
            {values.length > 0 ? `${values.length}/3 selected` : 'Select up to 3...'}
          </Button>
        </MultiSelect>
        <p className="text-xs text-muted-foreground">
          Maximum 3 selections allowed
        </p>
      </div>
      {values.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{values.join(', ')}</span>
        </p>
      )}
    </div>
  )
}
