'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export default function DropdownMenuCheckboxGroup() {
  const [layout, setLayout] = React.useState<string[]>(['minimap', 'search'])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Layout
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input hideUntilActive />
              <DropdownMenu.List>
                <DropdownMenu.CheckboxGroup
                  value={layout}
                  onValueChange={setLayout}
                >
                  <DropdownMenu.GroupLabel>Layout</DropdownMenu.GroupLabel>
                  <DropdownMenu.CheckboxItem value="minimap">
                    <DropdownMenu.CheckboxItemIndicator />
                    Minimap
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItem value="search">
                    <DropdownMenu.CheckboxItemIndicator />
                    Search
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItem value="sidebar">
                    <DropdownMenu.CheckboxItemIndicator />
                    Sidebar
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
