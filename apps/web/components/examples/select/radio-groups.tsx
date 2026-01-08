'use client'

import { useState } from 'react'
import { Select } from '@/registry/ui/select'

export function RadioGroups() {
  const [value, setValue] = useState('medium')

  return (
    <div className="flex flex-col items-center gap-4">
      <Select
        value={value}
        onValueChange={setValue}
        menu={{
          id: 'size-menu',
          nodes: [
            {
              kind: 'group',
              id: 'size-group',
              heading: 'Size',
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
        <Select.Trigger>
          <Select.Value placeholder="Select size..." />
        </Select.Trigger>
      </Select>
      <p className="text-sm text-muted-foreground">
        Selected: <span className="font-medium text-foreground">{value}</span>
      </p>
    </div>
  )
}
