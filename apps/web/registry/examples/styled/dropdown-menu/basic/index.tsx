'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export default function DropdownMenuBasic() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Actions
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input />
              <DropdownMenu.List>
                <DropdownMenu.Empty />
                <DropdownMenu.Item
                  onSelect={() => toast('Copied to clipboard')}
                >
                  Copy
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => toast('Cut to clipboard')}>
                  Cut
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={() => toast('Pasted from clipboard')}
                >
                  Paste
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
