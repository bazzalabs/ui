'use client'

import { useState } from 'react'
import { Select } from '@/registry/select'
import { Button } from '@/components/ui/button'

export function Basic() {
  const [value, setValue] = useState('apple')

  return (
    <div className="flex flex-col items-center gap-4">
      <Select
        value={value}
        onValueChange={setValue}
        placeholder="Select a fruit..."
        items={[
          { value: 'apple', label: 'Apple', icon: '🍎' },
          { value: 'banana', label: 'Banana', icon: '🍌' },
          { value: 'cherry', label: 'Cherry', icon: '🍒' },
          { value: 'orange', label: 'Orange', icon: '🍊' },
          { value: 'grape', label: 'Grape', icon: '🍇' },
        ]}
      >
        <Button variant="outline" className="w-48">
          {value || 'Select...'}
        </Button>
      </Select>
      {value && (
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{value}</span>
        </p>
      )}
    </div>
  )
}
