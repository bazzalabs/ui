'use client'

import { Button } from '@/components/ui/button'
import * as Menu from '@/registry/ui/dropdown-menu/v2'
import { toast } from 'sonner'

export function DropdownMenuV2_Basic() {
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="secondary">Fruits</Button>} />
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Surface>
            <Menu.Input placeholder="Search fruits..." />
            <Menu.List>
              <Menu.Item onSelect={() => toast('🍎 Apple')}>
                <span>🍎</span>
                <span>Apple</span>
              </Menu.Item>
              <Menu.Item onSelect={() => toast('🍌 Banana')}>
                <span>🍌</span>
                <span>Banana</span>
              </Menu.Item>
              <Menu.Item onSelect={() => toast('🍊 Orange')}>
                <span>🍊</span>
                <span>Orange</span>
              </Menu.Item>
              <Menu.Item onSelect={() => toast('🍍 Pineapple')}>
                <span>🍍</span>
                <span>Pineapple</span>
              </Menu.Item>
              <Menu.Item onSelect={() => toast('🍓 Strawberry')}>
                <span>🍓</span>
                <span>Strawberry</span>
              </Menu.Item>
            </Menu.List>
          </Menu.Surface>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
