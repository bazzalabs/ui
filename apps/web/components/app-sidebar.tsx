'use client'

import { ChevronRight, TriangleDashedIcon } from 'lucide-react'
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
  SidebarTrigger,
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
    title: 'Feedback',
    url: '/docs/feedback',
  },
]

type MenuItem =
  | {
      type: 'link'
      title: React.ReactNode
      url: string
    }
  | {
      type: 'collapsible'
      title: React.ReactNode
      items: MenuItem[]
    }

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
        items: MenuItem[]
      }>
    }

const componentItems: ComponentItem[] = [
  {
    type: 'single',
    title: 'Dropdown Menu',
    url: '/docs/dropdown-menu',
  },
  {
    type: 'single',
    title: 'Context Menu',
    url: '/docs/context-menu',
  },
  {
    type: 'single',
    title: 'Select',
    url: '/docs/select',
  },
  {
    type: 'single',
    title: 'Combobox',
    url: '/docs/combobox',
  },
  {
    type: 'collapsible',
    title: 'Filters',
    urlPrefix: '/docs/filters',
    groups: [
      {
        groupName: 'Getting Started',
        items: [
          {
            type: 'link',
            title: 'Introduction',
            url: '/docs/filters/introduction',
          },
          {
            type: 'link',
            title: 'Installation',
            url: '/docs/filters/installation',
          },
          // {
          //   type: 'link',
          //   title: 'Quick Start',
          //   url: '/docs/filters/quick-start',
          // },
          {
            type: 'link',
            title: 'Examples',
            url: '/docs/filters/examples',
          },
          {
            type: 'link',
            title: 'Blocks',
            url: '/docs/filters/blocks',
          },
        ],
      },
      {
        groupName: 'Components',
        items: [
          {
            type: 'link',
            title: 'Filter',
            url: '/docs/filters/components/filter',
          },
        ],
      },
      {
        groupName: 'Core',
        items: [
          // {
          //   type: 'link',
          //   title: 'Overview',
          //   url: '/docs/filters/core/overview',
          // },
          {
            type: 'link',
            title: 'Anatomy',
            url: '/docs/filters/core/anatomy',
          },
          {
            type: 'link',
            title: 'Concepts',
            url: '/docs/filters/core/concepts',
          },
          // {
          //   type: 'collapsible',
          //   title: 'Model',
          //   items: [
          //     {
          //       type: 'link',
          //       title: 'Columns',
          //       url: '/docs/filters/core/model/columns',
          //     },
          //     {
          //       type: 'link',
          //       title: 'Filters',
          //       url: '/docs/filters/core/model/filters',
          //     },
          //     {
          //       type: 'link',
          //       title: 'Operators',
          //       url: '/docs/filters/core/model/operators',
          //     },
          //     {
          //       type: 'link',
          //       title: 'Options',
          //       url: '/docs/filters/core/model/options',
          //     },
          //   ],
          // },
        ],
      },
      {
        groupName: 'Features',
        items: [
          {
            type: 'link',
            title: 'Column Builder',
            url: '/docs/filters/column-builder',
          },
          {
            type: 'link',
            title: 'Instance',
            url: '/docs/filters/instance',
          },
          {
            type: 'link',
            title: 'State Management',
            url: '/docs/filters/state-management',
          },
          {
            type: 'link',
            title: 'Faceted Values',
            url: '/docs/filters/faceted-values',
          },
          {
            type: 'link',
            title: 'Option Columns',
            url: '/docs/filters/option-columns',
          },
          {
            type: 'link',
            title: 'Columns',
            url: '/docs/filters/columns',
          },
          {
            type: 'link',
            title: 'Operators',
            url: '/docs/filters/operators',
          },
          {
            type: 'link',
            title: 'Actions',
            url: '/docs/filters/actions',
          },
          {
            type: 'link',
            title: 'Filtering Data',
            url: '/docs/filters/filtering-data',
          },
          {
            type: 'link',
            title: 'Internationalization',
            url: '/docs/filters/i18n',
          },
        ],
      },
      {
        groupName: 'Integrations',
        items: [
          {
            type: 'link',
            title: 'TanStack Table',
            url: '/docs/filters/integrations/tanstack-table',
          },
          {
            type: 'link',
            title: 'nuqs',
            url: '/docs/filters/integrations/nuqs',
          },
        ],
      },
    ],
  },
]

const archivedComponentItems: ComponentItem[] = [
  {
    type: 'collapsible',
    title: 'Action Menu',
    urlPrefix: '/docs/action-menu',
    badge: (
      <TriangleDashedIcon className="size-3.5 !text-yellow-400 stroke-3" />
    ),
    groups: [
      {
        groupName: 'Getting Started',
        items: [
          {
            type: 'link',
            title: 'Introduction',
            url: '/docs/action-menu/introduction',
          },
          {
            type: 'link',
            title: 'Installation',
            url: '/docs/action-menu/installation',
          },
          {
            type: 'link',
            title: 'Quick Start',
            url: '/docs/action-menu/quick-start',
          },
          {
            type: 'link',
            title: 'Examples',
            url: '/docs/action-menu/examples',
          },
        ],
      },
      {
        groupName: 'Concepts',
        items: [
          {
            type: 'link',
            title: 'Data-First API',
            url: '/docs/action-menu/data-first-api',
          },
          {
            type: 'link',
            title: 'Menu Structure',
            url: '/docs/action-menu/menu-structure',
          },
          {
            type: 'link',
            title: 'Node Types',
            url: '/docs/action-menu/node-types',
          },
          {
            type: 'link',
            title: 'State Management',
            url: '/docs/action-menu/state-management',
          },
          {
            type: 'link',
            title: 'Responsive Behavior',
            url: '/docs/action-menu/responsive-behavior',
          },
        ],
      },
      {
        groupName: 'Features',
        items: [
          {
            type: 'link',
            title: 'Node Configuration',
            url: '/docs/action-menu/nodes',
          },
          {
            type: 'link',
            title: 'Async Loading',
            url: '/docs/action-menu/async',
          },
          {
            type: 'link',
            title: 'Search & Filtering',
            url: '/docs/action-menu/search',
          },
          {
            type: 'link',
            title: 'Keyboard Navigation',
            url: '/docs/action-menu/keyboard',
          },
          {
            type: 'link',
            title: 'Focus Management',
            url: '/docs/action-menu/focus',
          },
          {
            type: 'link',
            title: 'Positioning',
            url: '/docs/action-menu/positioning',
          },
          {
            type: 'link',
            title: 'Theming',
            url: '/docs/action-menu/theming',
          },
          {
            type: 'link',
            title: 'Virtualization',
            url: '/docs/action-menu/virtualization',
          },
          {
            type: 'link',
            title: 'Middleware',
            url: '/docs/action-menu/middleware',
          },
          {
            type: 'link',
            title: 'Extended Properties',
            url: '/docs/action-menu/extended-properties',
          },
          {
            type: 'link',
            title: 'Defaults',
            url: '/docs/action-menu/defaults',
          },
        ],
      },
      {
        groupName: 'Advanced',
        items: [
          {
            type: 'link',
            title: 'Loader Adapters',
            url: '/docs/action-menu/loader-adapters',
          },
          {
            type: 'link',
            title: 'Deep Search',
            url: '/docs/action-menu/deep-search',
          },
          {
            type: 'link',
            title: 'Intent Zone',
            url: '/docs/action-menu/intent-zone',
          },
          {
            type: 'link',
            title: 'Custom Rendering',
            url: '/docs/action-menu/custom-rendering',
          },
          {
            type: 'link',
            title: 'Performance Optimization',
            url: '/docs/action-menu/performance',
          },
          {
            type: 'link',
            title: 'Accessibility',
            url: '/docs/action-menu/accessibility',
          },
          {
            type: 'link',
            title: 'RTL Support',
            url: '/docs/action-menu/rtl',
          },
        ],
      },
      {
        groupName: 'Components',
        items: [
          {
            type: 'link',
            title: 'Select',
            url: '/docs/action-menu/select',
          },
          {
            type: 'link',
            title: 'MultiSelect',
            url: '/docs/action-menu/multiselect',
          },
          {
            type: 'link',
            title: 'Dropdown Menu',
            url: '/docs/action-menu/dropdown-menu',
          },
          {
            type: 'link',
            title: 'Context Menu',
            url: '/docs/action-menu/context-menu',
          },
          {
            type: 'link',
            title: 'Command Palette',
            url: '/docs/action-menu/command-palette',
          },
        ],
      },
      {
        groupName: 'Reference',
        items: [
          {
            type: 'link',
            title: 'API Reference',
            url: '/docs/action-menu/api-reference',
          },
          {
            type: 'link',
            title: 'TypeScript Types',
            url: '/docs/action-menu/typescript',
          },
        ],
      },
    ],
  },
]

// Helper function to check if a menu item or any of its descendants contain the active URL
function containsActiveUrl(item: MenuItem, pathname: string): boolean {
  if (item.type === 'link') {
    return item.url === pathname
  }
  return item.items.some((child) => containsActiveUrl(child, pathname))
}

// Recursive component for rendering menu items
function MenuItemRenderer({
  item,
  pathname,
}: {
  item: MenuItem
  pathname: string
}) {
  if (item.type === 'link') {
    return (
      <SidebarMenuSubButton asChild isActive={pathname === item.url}>
        <Link href={item.url}>{item.title}</Link>
      </SidebarMenuSubButton>
    )
  }

  // Collapsible menu item
  const hasActiveChild = containsActiveUrl(item, pathname)

  return (
    <Collapsible
      defaultOpen={hasActiveChild}
      className="group/nested-collapsible"
    >
      <CollapsibleTrigger asChild>
        <SidebarMenuSubButton className="hover-expand-[2px] group-data-[state=open]/nested-collapsible:bg-sidebar-accent group-data-[state=open]/nested-collapsible:text-primary cursor-pointer **:cursor-pointer">
          {item.title}
          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/nested-collapsible:rotate-90" />
        </SidebarMenuSubButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {item.items.map((child, index) => (
            <MenuItemRenderer
              key={
                child.type === 'link'
                  ? child.url
                  : `collapsible-${child.title}-${index}`
              }
              item={child}
              pathname={pathname}
            />
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ComponentItemRenderer({
  component,
  pathname,
}: {
  component: ComponentItem
  pathname: string
}) {
  if (component.type === 'single') {
    return (
      <SidebarMenuItem>
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
                  {group.items.map((item, itemIndex) => (
                    <MenuItemRenderer
                      key={
                        item.type === 'link'
                          ? item.url
                          : `collapsible-${item.title}-${itemIndex}`
                      }
                      item={item}
                      pathname={pathname}
                    />
                  ))}
                </div>
              </div>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function AppSidebar({
  className,
  variant = 'inset',
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement | null>(null)

  return (
    <Sidebar
      variant={variant}
      className={cn('flex flex-col', className)}
      {...props}
    >
      <SidebarHeader className="pl-4 text-sm pt-6 shrink-0">
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
            <SidebarTrigger className="group-data-[state=closed]/sidebar-wrapper:hidden" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <FadeContainer
        scrollContainerRef={ref}
        resizeMeasurementDelay={100}
        background="var(--sidebar)"
      >
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
                {componentItems.map((component) => (
                  <ComponentItemRenderer
                    key={
                      component.type === 'single'
                        ? component.url
                        : component.urlPrefix
                    }
                    component={component}
                    pathname={pathname}
                  />
                ))}
                {archivedComponentItems.length > 0 && (
                  <SidebarMenuItem className="px-2 pt-4 pb-1 text-xs font-medium text-muted-foreground">
                    Archived
                  </SidebarMenuItem>
                )}
                {archivedComponentItems.map((component) => (
                  <ComponentItemRenderer
                    key={
                      component.type === 'single'
                        ? component.url
                        : component.urlPrefix
                    }
                    component={component}
                    pathname={pathname}
                  />
                ))}
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
