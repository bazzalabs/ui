'use client'

import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export default function DropdownMenuCheckbox() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        View Options
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                <DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItemIndicator />
                  This is a checkbox item
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem>
                  <DropdownMenu.CheckboxItemIndicator />
                  By default, they stay open when selected
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem closeOnClick>
                  <DropdownMenu.CheckboxItemIndicator />
                  This closes when clicked
                </DropdownMenu.CheckboxItem>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
