'use client'

import { useState } from 'react'
import { Select } from '@/registry/select'
import { Button } from '@/components/ui/button'

export function RadioGroups() {
  const [value, setValue] = useState('medium')

  return (
    <div className="flex flex-col items-center gap-4">
      <Select
        value={value}
        onValueChange={setValue}
        placeholder="Select size..."
        menu={{
          id: 'size-menu',
          nodes: [
            {
              kind: 'group',
              id: 'size-group',
              heading: 'Size',
              variant: 'radio',
              value: value,
              nodes: [
                { kind: 'item', id: 'small', label: 'Small' },
                { kind: 'item', id: 'medium', label: 'Medium' },
                { kind: 'item', id: 'large', label: 'Large' },
                { kind: 'item', id: 'xlarge', label: 'Extra Large' },
              ],
            },
          ],
        }}
      >
        <Button variant="outline" className="w-48">
          {value || 'Select...'}
        </Button>
      </Select>
      <p className="text-sm text-muted-foreground">
        Selected: <span className="font-medium text-foreground">{value}</span>
      </p>
    </div>
  )
}
