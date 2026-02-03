'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/registry/ui/select'

export default function SelectBasic() {
  const [value, setValue] = React.useState('')

  return (
    <Select.Root value={value} onValueChange={setValue}>
      <Select.Trigger render={<Button variant="outline" />}>
        <Select.Value placeholder="Select a fruit..." />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.Surface>
              <Select.Input hideUntilActive />
              <Select.List>
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
                <Select.Item value="grape">
                  <Select.ItemLabel>Grape</Select.ItemLabel>
                  <Select.ItemIndicator />
                </Select.Item>
                <Select.Item value="mango">
                  <Select.ItemLabel>Mango</Select.ItemLabel>
                  <Select.ItemIndicator />
                </Select.Item>
              </Select.List>
            </Select.Surface>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}
