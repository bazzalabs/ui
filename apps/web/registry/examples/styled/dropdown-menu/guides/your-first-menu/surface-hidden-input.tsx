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
                <DropdownMenu.Empty>No matching results.</DropdownMenu.Empty>
                <DropdownMenu.Item>Apple</DropdownMenu.Item>
                <DropdownMenu.Item>Banana</DropdownMenu.Item>
                <DropdownMenu.Item>Orange</DropdownMenu.Item>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
