'use client'

import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef } from 'react'
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
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import logoSrc from '@/public/bazzaui-v3-color.png'
import { FadeContainer } from './fade-container'
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

type ComponentItem =
  | {
      type: 'single'
      title: React.ReactNode
      url: string
      badge?: React.ReactNode
    }
  | {
      type: 'collapsible'
      title: React.ReactNode
      urlPrefix: string
      badge?: React.ReactNode
      groups: Array<{
        groupName: string
        items: Array<{ title: React.ReactNode; url: string }>
      }>
    }

const componentItems: ComponentItem[] = [
  {
    type: 'single',
    title: 'Data Table Filter',
    url: '/docs/data-table-filter',
  },
  {
    type: 'collapsible',
    title: 'Command Menu',
    urlPrefix: '/docs/command-menu',
    groups: [
      {
        groupName: 'Getting Started',
        items: [
          { title: 'Introduction', url: '/docs/command-menu/introduction' },
        ],
      },
      {
        groupName: 'Concepts',
        items: [
          {
            title: 'Paged Navigation',
            url: '/docs/command-menu/paged-navigation',
          },
          { title: 'Breadcrumbs', url: '/docs/command-menu/breadcrumbs' },
        ],
      },
      {
        groupName: 'Features',
        items: [
          {
            title: 'Dialog Animations',
            url: '/docs/command-menu/dialog-animations',
          },
          {
            title: 'Navigation Callback',
            url: '/docs/command-menu/navigation-callback',
          },
          { title: 'Theming', url: '/docs/command-menu/theming' },
          { title: 'Async Data Loading', url: '/docs/command-menu/loaders' },
        ],
      },
      {
        groupName: 'Reference',
        items: [
          { title: 'API Reference', url: '/docs/command-menu/api-reference' },
          {
            title: 'createCommandMenu',
            url: '/docs/command-menu/createCommandMenu',
          },
        ],
      },
      {
        groupName: 'Examples',
        items: [{ title: 'Examples', url: '/docs/command-menu/examples' }],
      },
    ],
  },
  {
    type: 'collapsible',
    title: 'Context Menu',
    urlPrefix: '/docs/context-menu',
    groups: [
      {
        groupName: 'Examples',
        items: [{ title: 'Examples', url: '/docs/context-menu/examples' }],
      },
    ],
  },
  {
    type: 'collapsible',
    title: 'Action Menu',
    urlPrefix: '/docs/action-menu',
    badge: <div className="size-2 bg-blue-500 rounded-full" />,
    groups: [
      {
        groupName: 'Getting Started',
        items: [
          { title: 'Introduction', url: '/docs/action-menu/introduction' },
          { title: 'Installation', url: '/docs/action-menu/installation' },
          { title: 'Quick Start', url: '/docs/action-menu/quick-start' },
          { title: 'Examples', url: '/docs/action-menu/examples' },
        ],
      },
      {
        groupName: 'Concepts',
        items: [
          { title: 'Data-First API', url: '/docs/action-menu/data-first-api' },
          { title: 'Menu Structure', url: '/docs/action-menu/menu-structure' },
          { title: 'Node Types', url: '/docs/action-menu/node-types' },
          {
            title: 'State Management',
            url: '/docs/action-menu/state-management',
          },
          {
            title: 'Responsive Behavior',
            url: '/docs/action-menu/responsive-behavior',
          },
        ],
      },
      {
        groupName: 'Features',
        items: [
          { title: 'Node Configuration', url: '/docs/action-menu/nodes' },
          { title: 'Async Loading', url: '/docs/action-menu/async' },
          { title: 'Search & Filtering', url: '/docs/action-menu/search' },
          { title: 'Keyboard Navigation', url: '/docs/action-menu/keyboard' },
          { title: 'Focus Management', url: '/docs/action-menu/focus' },
          { title: 'Positioning', url: '/docs/action-menu/positioning' },
          { title: 'Theming', url: '/docs/action-menu/theming' },
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
        groupName: 'Advanced',
        items: [
          {
            title: 'Loader Adapters',
            url: '/docs/action-menu/loader-adapters',
          },
          { title: 'Deep Search', url: '/docs/action-menu/deep-search' },
          { title: 'Intent Zone', url: '/docs/action-menu/intent-zone' },
          {
            title: 'Custom Rendering',
            url: '/docs/action-menu/custom-rendering',
          },
          {
            title: 'Performance Optimization',
            url: '/docs/action-menu/performance',
          },
          { title: 'Accessibility', url: '/docs/action-menu/accessibility' },
          { title: 'RTL Support', url: '/docs/action-menu/rtl' },
        ],
      },
      {
        groupName: 'Components',
        items: [
          { title: 'Select', url: '/docs/action-menu/select' },
          { title: 'MultiSelect', url: '/docs/action-menu/multiselect' },
          { title: 'Dropdown Menu', url: '/docs/action-menu/dropdown-menu' },
          { title: 'Context Menu', url: '/docs/action-menu/context-menu' },
          {
            title: 'Command Palette',
            url: '/docs/action-menu/command-palette',
          },
        ],
      },
      {
        groupName: 'Reference',
        items: [
          { title: 'API Reference', url: '/docs/action-menu/api-reference' },
          { title: 'TypeScript Types', url: '/docs/action-menu/typescript' },
        ],
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement | null>(null)

  return (
    <Sidebar variant="inset" className="flex flex-col">
      <SidebarHeader className="px-4 text-sm pt-4 shrink-0">
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
      <FadeContainer scrollContainerRef={ref} resizeMeasurementDelay={100}>
        <SidebarContent className="flex-1 min-h-0 no-scrollbar" ref={ref}>
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
                {componentItems.map((component) => {
                  if (component.type === 'single') {
                    return (
                      <SidebarMenuItem key={component.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={component.url === pathname}
                          className="font-medium text-muted-foreground hover-expand-[2px]"
                        >
                          <a href={component.url}>
                            <span>{component.title}</span>
                            {component.badge}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  }

                  return (
                    <Collapsible
                      key={component.urlPrefix}
                      asChild
                      defaultOpen={pathname.startsWith(component.urlPrefix)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className="font-medium text-muted-foreground hover-expand-[2px] group-data-[state=open]/menu-item:bg-sidebar-accent group-data-[state=open]/menu-item:text-primary"
                            isActive={pathname.startsWith(component.urlPrefix)}
                          >
                            <div className="flex items-center gap-2">
                              <span>{component.title}</span>
                              {component.badge}
                            </div>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub className="last:mb-4">
                            {component.groups.map((group, index) => (
                              <div
                                key={group.groupName}
                                className="flex flex-col"
                              >
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
                                      asChild
                                      key={item.url}
                                      isActive={pathname === item.url}
                                    >
                                      <Link href={item.url}>{item.title}</Link>
                                    </SidebarMenuSubButton>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </FadeContainer>

      <SidebarFooter className="shrink-0">
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
