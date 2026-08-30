'use client'

import React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export default function DropdownMenuFooterActions() {
  const [assignee, setAssignee] = React.useState(false)
  const [status, setStatus] = React.useState(true)
  const [priority, setPriority] = React.useState(false)

  const selected = [
    assignee && 'assignee',
    status && 'status',
    priority && 'priority',
  ].filter(Boolean)

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Filters
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input />
              <DropdownMenu.List>
                <DropdownMenu.CheckboxItem
                  checked={assignee}
                  onCheckedChange={setAssignee}
                >
                  <DropdownMenu.CheckboxItemIndicator />
                  Assignee
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem
                  checked={status}
                  onCheckedChange={setStatus}
                >
                  <DropdownMenu.CheckboxItemIndicator />
                  Status
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem
                  checked={priority}
                  onCheckedChange={setPriority}
                >
                  <DropdownMenu.CheckboxItemIndicator />
                  Priority
                </DropdownMenu.CheckboxItem>
              </DropdownMenu.List>
              <DropdownMenu.Footer>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAssignee(false)
                    setStatus(false)
                    setPriority(false)
                    toast('Filters cleared')
                  }}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    toast(
                      selected.length > 0
                        ? `Applied: ${selected.join(', ')}`
                        : 'No filters selected',
                    )
                  }
                >
                  Apply
                </Button>
              </DropdownMenu.Footer>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
