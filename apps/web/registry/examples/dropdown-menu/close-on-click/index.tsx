'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export default function DropdownMenuCloseOnClick() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Actions
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                <DropdownMenu.Item
                  closeOnClick={false}
                  onSelect={() => toast('Copied to clipboard')}
                >
                  Copy (stays open)
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  closeOnClick={false}
                  onSelect={() => toast('Cut to clipboard')}
                >
                  Cut (stays open)
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={() => toast('Pasted from clipboard')}
                >
                  Paste (closes)
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
