'use client'

import { DiscordIcon, GithubIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import logoSrc from '@/public/bazzaui-v3-color.png'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './theme-toggle'

const items = [
  {
    title: 'Introduction',
    url: '/docs/intro',
  },
  {
    title: 'Getting Started',
    url: '/docs/getting-started',
  },
  {
    title: 'Feedback',
    url: '/docs/feedback',
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader className="px-4 text-sm pt-4">
          <SidebarMenu>
            <SidebarMenuItem className="inline-flex justify-between items-center">
              <Link
                href="/"
                className="inline-flex items-center gap-0.5 font-medium font-mono tracking-tight"
              >
                <Image
                  className="size-5 mr-1.5 translate-y-[-0.5px]"
                  src={logoSrc}
                  alt="bazza/ui"
                />
                <span>bazza</span>
                <span className="text-xl text-border">/</span>
                <span>ui</span>
              </Link>
              <SidebarTrigger />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>Basics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.url === pathname}
                    className="font-medium text-muted-foreground"
                  >
                    <a href={item.url}>
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Components</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={'/docs/data-table-filter' === pathname}
                  className="font-medium text-muted-foreground"
                >
                  <a href={'/docs/data-table-filter'}>
                    <span>Data Table Filter</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="flex-row gap-0 justify-between">
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
    </Sidebar>
  )
}
