'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/registry/components/dropdown-menu'

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu
      menu={{
        id: 'theme-menu',
        defaults: {
          item: {
            closeOnSelect: true,
          },
        },
        hideSearchUntilActive: true,
        nodes: [
          {
            kind: 'item',
            label: 'Light',
            onSelect: () => setTheme('light'),
          },
          {
            kind: 'item',
            label: 'Dark',
            onSelect: () => setTheme('dark'),
          },
          {
            kind: 'item',
            label: 'System',
            onSelect: () => setTheme('system'),
          },
        ],
      }}
    >
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenu.Trigger>
    </DropdownMenu>
  )
}
