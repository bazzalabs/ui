'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/registry/components/multi-select'

export function Basic() {
  const [values, setValues] = useState(['apple', 'banana'])

  return (
    <div className="flex flex-col items-center gap-4">
      <MultiSelect
        value={values}
        onValueChange={setValues}
        placeholder="Select fruits..."
        items={[
          { value: 'apple', label: 'Apple', icon: '🍎' },
          { value: 'banana', label: 'Banana', icon: '🍌' },
          { value: 'cherry', label: 'Cherry', icon: '🍒' },
          { value: 'orange', label: 'Orange', icon: '🍊' },
          { value: 'grape', label: 'Grape', icon: '🍇' },
          { value: 'strawberry', label: 'Strawberry', icon: '🍓' },
        ]}
      />
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
