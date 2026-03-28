'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { DiscordIcon, GithubIcon } from '../icons'
import { ThemeToggle } from '../theme-toggle'

export function AppSidebarFooter() {
  return (
    <SidebarFooter className="shrink-0">
      <SidebarMenu className="flex-row justify-between gap-0">
        <SidebarMenuItem>
          <ThemeToggle />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Button variant="ghost" size="icon" asChild>
            <Link href="https://ui.bazza.dev/chat">
              <DiscordIcon className="size-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="https://github.com/kianbazza/ui">
              <GithubIcon className="size-5" />
            </Link>
          </Button>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
