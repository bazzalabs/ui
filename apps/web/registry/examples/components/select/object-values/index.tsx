'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/registry/ui/select'

interface User {
  id: number
  name: string
  role: string
}

const users: User[] = [
  { id: 1, name: 'John Doe', role: 'Admin' },
  { id: 2, name: 'Jane Smith', role: 'Editor' },
  { id: 3, name: 'Bob Wilson', role: 'Viewer' },
  { id: 4, name: 'Alice Brown', role: 'Editor' },
  { id: 5, name: 'Charlie Davis', role: 'Viewer' },
]

export default function SelectObjectValues() {
  const [selected, setSelected] = React.useState<User | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <Select.Root
        value={selected}
        onValueChange={setSelected}
        isItemEqualToValue={(a, b) => a.id === b.id}
        itemToStringLabel={(u) => u.name}
        itemToStringValue={(u) => String(u.id)}
      >
        <Select.Trigger render={<Button variant="outline" />}>
          <Select.Value placeholder="Select a user..." />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Surface>
                <Select.List>
                  {users.map((user) => (
                    <Select.Item key={user.id} value={user}>
                      <Select.ItemLabel />
                      <span className="text-muted-foreground text-sm">
                        {user.role}
                      </span>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Surface>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      {selected && (
        <p className="text-sm text-muted-foreground">
          Selected: {selected.name} (ID: {selected.id}, Role: {selected.role})
        </p>
      )}
    </div>
  )
}
