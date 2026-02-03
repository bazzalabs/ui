'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { Select } from '@/registry/ui/select'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Select.Root value={theme} onValueChange={setTheme}>
      <Select.Trigger render={<Button variant="ghost" size="icon" />}>
        <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner align="end">
          <Select.Popup className="min-w-0 w-[150px]">
            <Select.Surface autoHighlightFirst="selected">
              <Select.List>
                <Select.Item value="light">
                  Light
                  <Select.ItemIndicator />
                </Select.Item>
                <Select.Item value="dark">
                  Dark
                  <Select.ItemIndicator />
                </Select.Item>
                <Select.Item value="system">
                  System
                  <Select.ItemIndicator />
                </Select.Item>
              </Select.List>
            </Select.Surface>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}
