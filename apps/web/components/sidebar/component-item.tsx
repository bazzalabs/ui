'use client'

import { ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { SidebarLinkItem } from './link-item'
import { SidebarMenuItemRenderer } from './menu-item'
import type { ComponentItem } from './types'
import {
  getComponentAudienceBadge,
  getComponentAudienceClassName,
} from './utils'

type SidebarComponentItemProps = {
  component: ComponentItem
  pathname: string
  privateDocUrls: Set<string> | null
}

export function SidebarComponentItem({
  component,
  pathname,
  privateDocUrls,
}: SidebarComponentItemProps) {
  if (component.type === 'single') {
    return (
      <SidebarLinkItem
        title={component.title}
        url={component.url}
        pathname={pathname}
        privateDocUrls={privateDocUrls}
        audience={component.audience}
        badge={component.badge}
      />
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
            className={cn(
              'font-medium hover-expand-[2px] group-data-[state=open]/menu-item:bg-sidebar-accent group-data-[state=open]/menu-item:text-primary',
              getComponentAudienceClassName(component.audience),
            )}
            isActive={pathname.startsWith(component.urlPrefix)}
          >
            <div className="flex items-center gap-2">
              <span>{component.title}</span>
              {getComponentAudienceBadge(component.audience)}
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
                    'py-1 mb-1 text-xs font-medium text-muted-foreground',
                    index === 0 ? 'mt-1' : 'mt-2',
                  )}
                >
                  {group.groupName}
                </span>
                <div className="flex -translate-x-1.5 flex-col gap-y-px">
                  {group.items.map((item, itemIndex) => (
                    <SidebarMenuItemRenderer
                      key={
                        item.type === 'link'
                          ? item.url
                          : `collapsible-${item.title}-${itemIndex}`
                      }
                      item={item}
                      pathname={pathname}
                      privateDocUrls={privateDocUrls}
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
