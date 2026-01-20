import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

export default function Component() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        render={<Button variant="outline">Open Menu</Button>}
      ></DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.Input hideUntilActive />
              <DropdownMenu.List>
                <DropdownMenu.Empty />
                <DropdownMenu.Item onSelect={() => toast('Apple')}>
                  Apple
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => toast('Banana')}>
                  Banana
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => toast('Orange')}>
                  Orange
                </DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
