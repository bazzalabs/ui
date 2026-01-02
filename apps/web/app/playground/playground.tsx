'use client'

import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu-v2'

export function Playground() {
  return (
    <div className="flex flex-col gap-8 mx-32">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          render={
            <Button variant="outline" className="w-fit">
              Open
            </Button>
          }
        />
        <DropdownMenu.Portal>
          <DropdownMenu.Positioner
            sideOffset={8}
            align="start"
            alignOffset={-4}
          >
            <DropdownMenu.Surface>
              <DropdownMenu.Input placeholder="Search..." />
              <DropdownMenu.List>
                <DropdownMenu.Item>Apple</DropdownMenu.Item>
                <DropdownMenu.Item>Banana</DropdownMenu.Item>
                <DropdownMenu.Item>Orange</DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Positioner>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
