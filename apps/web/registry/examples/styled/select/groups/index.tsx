'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/registry/ui/select'

export default function SelectGroups() {
  const [value, setValue] = React.useState('')

  return (
    <Select.Root value={value} onValueChange={setValue}>
      <Select.Trigger render={<Button variant="outline" />}>
        <Select.Value placeholder="Select a food..." />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.Surface>
              <Select.List>
                <Select.Group>
                  <Select.GroupLabel>Fruits</Select.GroupLabel>
                  <Select.Item value="apple">
                    <Select.ItemLabel>Apple</Select.ItemLabel>
                    <Select.ItemIndicator />
                  </Select.Item>
                  <Select.Item value="banana">
                    <Select.ItemLabel>Banana</Select.ItemLabel>
                    <Select.ItemIndicator />
                  </Select.Item>
                  <Select.Item value="orange">
                    <Select.ItemLabel>Orange</Select.ItemLabel>
                    <Select.ItemIndicator />
                  </Select.Item>
                </Select.Group>
                <Select.Separator />
                <Select.Group>
                  <Select.GroupLabel>Vegetables</Select.GroupLabel>
                  <Select.Item value="carrot">
                    <Select.ItemLabel>Carrot</Select.ItemLabel>
                    <Select.ItemIndicator />
                  </Select.Item>
                  <Select.Item value="broccoli">
                    <Select.ItemLabel>Broccoli</Select.ItemLabel>
                    <Select.ItemIndicator />
                  </Select.Item>
                  <Select.Item value="spinach">
                    <Select.ItemLabel>Spinach</Select.ItemLabel>
                    <Select.ItemIndicator />
                  </Select.Item>
                </Select.Group>
              </Select.List>
            </Select.Surface>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}
