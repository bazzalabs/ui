'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/ui/dropdown-menu-v2'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger render={<Button variant="ghost" size="icon" />}>
        <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner align="end">
          <DropdownMenu.Popup className="w-[150px]">
            <DropdownMenu.Surface autoHighlightFirst={false}>
              <DropdownMenu.List>
                <DropdownMenu.RadioGroup
                  value={theme}
                  onValueChange={(value) => setTheme(value as string)}
                >
                  <DropdownMenu.RadioItem value="light">
                    Light
                    <DropdownMenu.RadioItemIndicator />
                  </DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem value="dark">
                    Dark
                    <DropdownMenu.RadioItemIndicator />
                  </DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem value="system">
                    System
                    <DropdownMenu.RadioItemIndicator />
                  </DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
              </DropdownMenu.List>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
