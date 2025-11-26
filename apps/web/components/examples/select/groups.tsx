'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/registry/components/select'

export function Groups() {
  const [value, setValue] = useState('')

  return (
    <div className="flex flex-col items-center gap-4">
      <Select
        value={value}
        onValueChange={setValue}
        placeholder="Select food..."
        menu={{
          id: 'food-menu',
          nodes: [
            {
              kind: 'group',
              id: 'fruits',
              heading: 'Fruits',
              nodes: [
                { kind: 'item', id: 'apple', label: 'Apple', icon: '🍎' },
                { kind: 'item', id: 'banana', label: 'Banana', icon: '🍌' },
                { kind: 'item', id: 'cherry', label: 'Cherry', icon: '🍒' },
                { kind: 'item', id: 'orange', label: 'Orange', icon: '🍊' },
              ],
            },
            { kind: 'separator', id: 'separator-1' },
            {
              kind: 'group',
              id: 'vegetables',
              heading: 'Vegetables',
              nodes: [
                { kind: 'item', id: 'carrot', label: 'Carrot', icon: '🥕' },
                { kind: 'item', id: 'broccoli', label: 'Broccoli', icon: '🥦' },
                { kind: 'item', id: 'tomato', label: 'Tomato', icon: '🍅' },
                { kind: 'item', id: 'potato', label: 'Potato', icon: '🥔' },
              ],
            },
            { kind: 'separator', id: 'separator-2' },
            {
              kind: 'group',
              id: 'proteins',
              heading: 'Proteins',
              nodes: [
                { kind: 'item', id: 'chicken', label: 'Chicken', icon: '🍗' },
                { kind: 'item', id: 'beef', label: 'Beef', icon: '🥩' },
                { kind: 'item', id: 'fish', label: 'Fish', icon: '🐟' },
                { kind: 'item', id: 'tofu', label: 'Tofu' },
              ],
            },
          ],
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
