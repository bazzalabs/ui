'use client'

import type * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select } from '@/registry/ui/select'

export default function SelectForm() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const priority = formData.get('priority')
    toast(`Selected priority: ${priority}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Select.Root name="priority" required>
        <Select.Trigger render={<Button variant="outline" />}>
          <Select.Value placeholder="Select priority..." />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Surface>
                <Select.List>
                  <Select.Item value="low">
                    <Select.ItemLabel>Low</Select.ItemLabel>
                    <Select.ItemIndicator />
                  </Select.Item>
                  <Select.Item value="medium">
                    <Select.ItemLabel>Medium</Select.ItemLabel>
                    <Select.ItemIndicator />
                  </Select.Item>
                  <Select.Item value="high">
                    <Select.ItemLabel>High</Select.ItemLabel>
                    <Select.ItemIndicator />
                  </Select.Item>
                  <Select.Item value="urgent">
                    <Select.ItemLabel>Urgent</Select.ItemLabel>
                    <Select.ItemIndicator />
                  </Select.Item>
                </Select.List>
              </Select.Surface>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <Button type="submit">Submit</Button>
    </form>
  )
}
