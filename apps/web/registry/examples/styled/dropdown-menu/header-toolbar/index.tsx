'use client'

import { PlusIcon, SettingsIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

const LABELS = ['Bug', 'Feature', 'Improvement', 'Docs', 'Design']

export default function DropdownMenuHeaderToolbar() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="outline" />}>
        Add label
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input />
              <DropdownMenu.Header>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toast('New label')}
                >
                  <PlusIcon />
                  New label
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  aria-label="Label settings"
                  onClick={() => toast('Label settings')}
                >
                  <SettingsIcon />
                </Button>
              </DropdownMenu.Header>
              <DropdownMenu.List>
                {LABELS.map((label) => (
                  <DropdownMenu.Item
                    key={label}
                    onSelect={() => toast(`Added ${label}`)}
                  >
                    {label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
