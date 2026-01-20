'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export default function DropdownMenuSearch() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Commands
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface clearSearchOnClose="after-exit">
              <DropdownMenu.Input placeholder="Search commands..." />
              <DropdownMenu.List>
                <DropdownMenu.Item
                  value="new-file"
                  onSelect={() => toast('New File')}
                >
                  New File
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  value="open-file"
                  onSelect={() => toast('Open File')}
                >
                  Open File
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  value="save-file"
                  onSelect={() => toast('Save File')}
                >
                  Save File
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  value="save-as"
                  onSelect={() => toast('Save As...')}
                >
                  Save As...
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  value="close-file"
                  onSelect={() => toast('Close File')}
                >
                  Close File
                </DropdownMenu.Item>
              </DropdownMenu.List>
              <DropdownMenu.Empty>No results found</DropdownMenu.Empty>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
