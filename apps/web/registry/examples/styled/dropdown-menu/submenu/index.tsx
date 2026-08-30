'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export default function DropdownMenuSubmenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Edit
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input hideUntilActive />
              <DropdownMenu.List>
                <DropdownMenu.Empty />
                <DropdownMenu.Item onSelect={() => toast('Undo')}>
                  Undo
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => toast('Redo')}>
                  Redo
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Submenu>
                  <DropdownMenu.SubmenuTrigger>
                    Find and Replace
                  </DropdownMenu.SubmenuTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Positioner>
                      <DropdownMenu.Popup>
                        <DropdownMenu.Surface>
                          <DropdownMenu.Input />
                          <DropdownMenu.List>
                            <DropdownMenu.Empty />
                            <DropdownMenu.Item onSelect={() => toast('Find')}>
                              Find
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onSelect={() => toast('Find Next')}
                            >
                              Find Next
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onSelect={() => toast('Find Previous')}
                            >
                              Find Previous
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item
                              onSelect={() => toast('Replace')}
                            >
                              Replace
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onSelect={() => toast('Replace All')}
                            >
                              Replace All
                            </DropdownMenu.Item>
                          </DropdownMenu.List>
                        </DropdownMenu.Surface>
                      </DropdownMenu.Popup>
                    </DropdownMenu.Positioner>
                  </DropdownMenu.Portal>
                </DropdownMenu.Submenu>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
