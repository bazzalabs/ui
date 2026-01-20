'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export default function DropdownMenuRadio() {
  const [sortBy, setSortBy] = React.useState('name')

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Sort By
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                <DropdownMenu.RadioGroup
                  value={sortBy}
                  onValueChange={setSortBy}
                >
                  <DropdownMenu.GroupLabel>Hi there!</DropdownMenu.GroupLabel>
                  <DropdownMenu.RadioItem value="name">
                    Name
                    <DropdownMenu.RadioItemIndicator />
                  </DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem value="date">
                    Date
                    <DropdownMenu.RadioItemIndicator />
                  </DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem value="size">
                    Size
                    <DropdownMenu.RadioItemIndicator />
                  </DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
