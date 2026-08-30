'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export default function DropdownMenuHiddenInput() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Actions
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input hideUntilActive placeholder="Search..." />
              <DropdownMenu.List>
                <DropdownMenu.Empty />
                <DropdownMenu.Item onSelect={() => toast('Edit')}>
                  Edit
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => toast('Duplicate')}>
                  Duplicate
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => toast('Archive')}>
                  Archive
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => toast('Delete')}>
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
