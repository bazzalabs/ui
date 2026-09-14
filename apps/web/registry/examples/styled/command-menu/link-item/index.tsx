'use client'

import { Button } from '@/components/ui/button'
import { CommandMenu } from '@/registry/ui/command-menu'

export default function CommandMenuLinkItem() {
  return (
    <CommandMenu.Root>
      <CommandMenu.Trigger render={<Button variant="outline" />}>
        Open
      </CommandMenu.Trigger>
      <CommandMenu.Portal>
        <CommandMenu.Backdrop />
        <CommandMenu.Popup>
          <CommandMenu.Surface>
            <CommandMenu.Input />
            <CommandMenu.List>
              <CommandMenu.Empty />
              <CommandMenu.Group>
                <CommandMenu.GroupLabel>Go to</CommandMenu.GroupLabel>
                <CommandMenu.LinkItem href="/docs/getting-started">
                  Getting started
                </CommandMenu.LinkItem>
                <CommandMenu.LinkItem href="/docs/components">
                  Components
                </CommandMenu.LinkItem>
                <CommandMenu.Separator />
                <CommandMenu.LinkItem
                  href="https://github.com/bazzalabs/ui"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </CommandMenu.LinkItem>
              </CommandMenu.Group>
            </CommandMenu.List>
          </CommandMenu.Surface>
        </CommandMenu.Popup>
      </CommandMenu.Portal>
    </CommandMenu.Root>
  )
}
