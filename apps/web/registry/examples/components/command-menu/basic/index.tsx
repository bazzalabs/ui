'use client'

import {
  ArchiveIcon,
  FilePlusIcon,
  FolderOpenIcon,
  SettingsIcon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CommandMenu } from '@/registry/ui/command-menu'

export default function CommandMenuBasic() {
  const [showArchived, setShowArchived] = useState(false)

  return (
    <CommandMenu.Root hotkey="mod+k">
      <CommandMenu.Trigger render={<Button variant="outline" />}>
        Open command menu
        <CommandMenu.Kbd keys="mod+k" />
      </CommandMenu.Trigger>
      <CommandMenu.Portal>
        <CommandMenu.Backdrop />
        <CommandMenu.Popup>
          <CommandMenu.Surface>
            <CommandMenu.Header>Quick actions</CommandMenu.Header>
            <CommandMenu.Input />
            <CommandMenu.List>
              <CommandMenu.Empty />
              <CommandMenu.Group>
                <CommandMenu.GroupLabel>Workspace</CommandMenu.GroupLabel>
                <CommandMenu.Item onSelect={() => toast('Created a new file')}>
                  <CommandMenu.Icon>
                    <FilePlusIcon className="size-4" />
                  </CommandMenu.Icon>
                  New file
                  <CommandMenu.Shortcut>
                    <CommandMenu.Kbd keys="mod+shift+n" />
                  </CommandMenu.Shortcut>
                </CommandMenu.Item>
                <CommandMenu.Item onSelect={() => toast('Opened recent files')}>
                  <CommandMenu.Icon>
                    <FolderOpenIcon className="size-4" />
                  </CommandMenu.Icon>
                  Open recent
                  <CommandMenu.Shortcut>
                    <CommandMenu.Kbd keys="mod+o" />
                  </CommandMenu.Shortcut>
                </CommandMenu.Item>
              </CommandMenu.Group>
              <CommandMenu.Separator />
              <CommandMenu.Group>
                <CommandMenu.GroupLabel>Preferences</CommandMenu.GroupLabel>
                <CommandMenu.Item onSelect={() => toast('Opened settings')}>
                  <CommandMenu.Icon>
                    <SettingsIcon className="size-4" />
                  </CommandMenu.Icon>
                  Settings
                  <CommandMenu.Shortcut>
                    <CommandMenu.Kbd keys="mod+shift+p" />
                  </CommandMenu.Shortcut>
                </CommandMenu.Item>
                <CommandMenu.CheckboxItem
                  checked={showArchived}
                  onCheckedChange={(checked) => {
                    setShowArchived(checked)
                    toast(
                      checked
                        ? 'Showing archived items'
                        : 'Hiding archived items',
                    )
                  }}
                >
                  <CommandMenu.CheckboxItemIndicator />
                  <CommandMenu.Icon>
                    <ArchiveIcon className="size-4" />
                  </CommandMenu.Icon>
                  Show archived
                </CommandMenu.CheckboxItem>
              </CommandMenu.Group>
            </CommandMenu.List>
          </CommandMenu.Surface>
        </CommandMenu.Popup>
      </CommandMenu.Portal>
    </CommandMenu.Root>
  )
}
