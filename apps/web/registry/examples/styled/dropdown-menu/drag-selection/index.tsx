'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export default function DropdownMenuDragSelection() {
  const [visible, setVisible] = React.useState<string[]>(['name', 'status'])

  return (
    <DropdownMenu.Root dragSelection="keep">
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Columns
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input hideUntilActive />
              <DropdownMenu.List>
                <DropdownMenu.CheckboxGroup
                  value={visible}
                  onValueChange={setVisible}
                >
                  <DropdownMenu.GroupLabel>
                    Visible columns
                  </DropdownMenu.GroupLabel>
                  <DropdownMenu.CheckboxItem value="name">
                    <DropdownMenu.CheckboxItemIndicator />
                    Name
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItem value="status">
                    <DropdownMenu.CheckboxItemIndicator />
                    Status
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItem value="owner">
                    <DropdownMenu.CheckboxItemIndicator />
                    Owner
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItem value="priority">
                    <DropdownMenu.CheckboxItemIndicator />
                    Priority
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItem value="created">
                    <DropdownMenu.CheckboxItemIndicator />
                    Created
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItem value="updated">
                    <DropdownMenu.CheckboxItemIndicator />
                    Updated
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItem value="labels">
                    <DropdownMenu.CheckboxItemIndicator />
                    Labels
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItem value="estimate">
                    <DropdownMenu.CheckboxItemIndicator />
                    Estimate
                  </DropdownMenu.CheckboxItem>
                </DropdownMenu.CheckboxGroup>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
