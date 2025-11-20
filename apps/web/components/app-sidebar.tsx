'use client'

import {
  ChevronRight,
  FlaskConicalIcon,
  TriangleDashedIcon,
} from 'lucide-react'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

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
    title: 'Data Table Filter',
    url: '/docs/data-table-filter',
  },
  {
    type: 'collapsible',
    title: 'Menu',
    urlPrefix: '/docs/menu',
    badge: <FlaskConicalIcon className="size-3.5 text-purple-400" />,
    groups: [
      {
        groupName: 'Getting Started',
        items: [
          {
            type: 'link',
            title: 'Introduction',
            url: '/docs/menu/introduction',
          },
          {
            type: 'link',
            title: 'Installation',
            url: '/docs/menu/installation',
          },
          { type: 'link', title: 'Quick Start', url: '/docs/menu/quick-start' },
        ],
      },
      {
        groupName: 'Core',
        items: [
          { type: 'link', title: 'Overview', url: '/docs/menu/core/overview' },
          { type: 'link', title: 'Anatomy', url: '/docs/menu/core/anatomy' },
          {
            type: 'collapsible',
            title: 'Model',
            items: [
              {
                type: 'link',
                title: 'Nodes',
                url: '/docs/menu/core/model/nodes',
              },
              {
                type: 'link',
                title: 'Item',
                url: '/docs/menu/core/model/item',
              },
              {
                type: 'link',
                title: 'Group',
                url: '/docs/menu/core/model/group',
              },
              {
                type: 'link',
                title: 'Menu',
                url: '/docs/menu/core/model/menu',
              },
              {
                type: 'link',
                title: 'Submenu',
                url: '/docs/menu/core/model/submenu',
              },
              {
                type: 'link',
                title: 'Separator',
                url: '/docs/menu/core/model/separator',
              },
            ],
          },
          {
            type: 'link',
            title: 'Keyboard Shortcuts',
            url: '/docs/menu/shortcuts',
          },
          {
            type: 'link',
            title: 'Focus Management',
            url: '/docs/menu/focus',
          },
          {
            type: 'collapsible',
            title: 'Theming',
            items: [
              {
                type: 'link',
                title: 'Concepts',
                url: '/docs/menu/theming/concepts',
              },
              {
                type: 'link',
                title: 'Slots',
                url: '/docs/menu/theming/slots',
              },
              {
                type: 'link',
                title: 'Slot Props',
                url: '/docs/menu/theming/slot-props',
              },
              {
                type: 'link',
                title: 'Class names',
                url: '/docs/menu/theming/classnames',
              },
              {
                type: 'link',
                title: 'Custom Rendering',
                url: '/docs/menu/theming/custom-rendering',
              },
            ],
          },
          {
            type: 'link',
            title: (
              <div>
                Loaders{' '}
                <span className="text-muted-foreground">(Async Nodes)</span>
              </div>
            ),
            url: '/docs/menu/loaders',
          },
        ],
      },
      {
        groupName: 'Components',
        items: [
          {
            type: 'link',
            title: 'Popup Menus',
            url: '/docs/menu/components/popup-menus',
          },
          {
            type: 'link',
            title: 'Command Menu',
            url: '/docs/menu/components/command-menu',
          },
          {
            type: 'link',
            title: 'Dropdown Menu',
            url: '/docs/menu/components/dropdown-menu',
          },
          {
            type: 'link',
            title: 'Context Menu',
            url: '/docs/menu/components/context-menu',
          },
        ],
      },
    ],
  },
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
          { type: 'link', title: 'Theming', url: '/docs/action-menu/theming' },
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
          { type: 'link', title: 'RTL Support', url: '/docs/action-menu/rtl' },
        ],
      },
      {
        groupName: 'Components',
        items: [
          { type: 'link', title: 'Select', url: '/docs/action-menu/select' },
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
      asChild
      defaultOpen={hasActiveChild}
      className="group/nested-collapsible"
    >
      <li>
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton className="group-data-[state=open]/nested-collapsible:text-primary **:cursor-pointer">
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
      </li>
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
