'use client'

import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DiscordIcon, GithubIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import logoSrc from '@/public/bazzaui-v3-color.png'
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
    title: 'Components',
    url: '/docs/components',
  },
  {
    title: 'Feedback',
    url: '/docs/feedback',
  },
]

const actionMenuItems = [
  {
    groupName: 'Getting Started',
    items: [
      { title: 'Introduction', url: '/docs/action-menu/introduction' },
      { title: 'Installation', url: '/docs/action-menu/installation' },
      { title: 'Examples', url: '/docs/action-menu/examples' },
    ],
  },
  {
    groupName: 'Concepts',
    items: [
      { title: 'Data-First API', url: '/docs/action-menu/data-first-api' },
      { title: 'Your First Menu', url: '/docs/action-menu/your-first-menu' },
      { title: 'Menu Structure', url: '/docs/action-menu/menu-structure' },
      { title: 'Node Types', url: '/docs/action-menu/node-types' },
      // { title: 'State Management', url: '/docs/action-menu/state-management' },
      // {
      //   title: 'Responsive Behavior',
      //   url: '/docs/action-menu/responsive-behavior',
      // },
    ],
  },
  {
    groupName: 'Features',
    items: [
      { title: 'Nodes', url: '/docs/action-menu/nodes' },
      { title: 'Node loaders', url: '/docs/action-menu/async' },
      { title: 'Search & Filtering', url: '/docs/action-menu/search' },
      { title: 'Theming', url: '/docs/action-menu/theming' },
      { title: 'Positioning', url: '/docs/action-menu/positioning' },
      { title: 'Keyboard & Focus', url: '/docs/action-menu/keyboard' },
      { title: 'Virtualization', url: '/docs/action-menu/virtualization' },
      { title: 'Middleware', url: '/docs/action-menu/middleware' },
      {
        title: 'Extended Properties',
        url: '/docs/action-menu/extended-properties',
      },
      { title: 'Defaults', url: '/docs/action-menu/defaults' },
    ],
  },
  {
    groupName: 'Guides',
    items: [
      { title: 'Create New Items', url: '/docs/action-menu/create-new' },
      { title: 'Custom Rendering', url: '/docs/action-menu/custom-rendering' },
      { title: 'Dynamic Content', url: '/docs/action-menu/dynamic-content' },
      { title: 'Multiselect', url: '/docs/action-menu/multiselect' },
      { title: 'Performance', url: '/docs/action-menu/performance' },
    ],
  },
  {
    groupName: 'Reference',
    items: [
      { title: 'Examples', url: '/docs/action-menu/examples' },
      { title: 'API Reference', url: '/docs/action-menu/api-reference' },
    ],
  },
] satisfies Array<{
  groupName: string
  items: Array<{ title: string; url: string }>
}>

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
                    className="font-medium text-muted-foreground hover-expand-[2px]"
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
              {/* Action Menu with nested pages */}
              <Collapsible
                key="action-menu"
                asChild
                defaultOpen={pathname.startsWith('/docs/action-menu')}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="font-medium hover-expand-[2px]"
                      // isActive={pathname === '/docs/action-menu'}
                    >
                      <a href="/docs/action-menu">Action Menu</a>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="last:mb-4">
                      {actionMenuItems.map((group, index) => {
                        return (
                          <div key={group.groupName} className="flex flex-col">
                            <span
                              className={cn(
                                'text-xs font-medium text-muted-foreground py-1 mb-1',
                                index === 0 ? 'mt-1' : 'mt-2',
                              )}
                            >
                              {group.groupName}
                            </span>
                            <div className="flex flex-col gap-y-px -translate-x-1.5">
                              {group.items.map((item) => (
                                <SidebarMenuSubButton
                                  key={item.url}
                                  isActive={
                                    pathname === item.url ||
                                    pathname.startsWith(`${item.url}/`)
                                  }
                                  href={item.url}
                                >
                                  {item.title}
                                </SidebarMenuSubButton>
                              ))}
                            </div>
                          </div>
                        )
                        // return (
                        //   <SidebarMenuSubItem key={item.url}>
                        //     <SidebarMenuSubButton
                        //       isActive={
                        //         pathname === item.url ||
                        //         pathname.startsWith(`${item.url}/`)
                        //       }
                        //       href={item.url}
                        //     >
                        //       {item.title}
                        //     </SidebarMenuSubButton>
                        //   </SidebarMenuSubItem>
                        // )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Data Table Filter */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={'/docs/data-table-filter' === pathname}
                  className="font-medium text-muted-foreground hover-expand-[2px]"
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
