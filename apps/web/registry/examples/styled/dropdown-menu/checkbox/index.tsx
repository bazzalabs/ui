'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export default function DropdownMenuCheckbox() {
  const [minimap, setMinimap] = React.useState(true)
  const [search, setSearch] = React.useState(true)
  const [sidebar, setSidebar] = React.useState(false)

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Layout
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                <DropdownMenu.CheckboxItem
                  checked={minimap}
                  onCheckedChange={setMinimap}
                >
                  <DropdownMenu.CheckboxItemIndicator />
                  Minimap
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem
                  checked={search}
                  onCheckedChange={setSearch}
                >
                  <DropdownMenu.CheckboxItemIndicator />
                  Search
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem
                  checked={sidebar}
                  onCheckedChange={setSidebar}
                >
                  <DropdownMenu.CheckboxItemIndicator />
                  Sidebar
                </DropdownMenu.CheckboxItem>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
