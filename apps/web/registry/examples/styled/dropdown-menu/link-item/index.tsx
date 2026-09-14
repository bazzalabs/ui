'use client'

import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export default function DropdownMenuLinkItem() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Go to
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.List>
                <DropdownMenu.LinkItem href="/docs/getting-started">
                  Getting started
                </DropdownMenu.LinkItem>
                <DropdownMenu.LinkItem href="/docs/components">
                  Components
                </DropdownMenu.LinkItem>
                <DropdownMenu.Separator />
                <DropdownMenu.LinkItem
                  href="https://github.com/bazzalabs/ui"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </DropdownMenu.LinkItem>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
