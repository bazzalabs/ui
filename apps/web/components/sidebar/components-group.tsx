'use client'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { SidebarComponentItem } from './component-item'
import type { ComponentItem } from './types'

type SidebarComponentsGroupProps = {
  items: ComponentItem[]
  archivedItems: ComponentItem[]
  pathname: string
  privateDocUrls: Set<string> | null
}

export function SidebarComponentsGroup({
  items,
  archivedItems,
  pathname,
  privateDocUrls,
}: SidebarComponentsGroupProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Components</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((component) => (
            <SidebarComponentItem
              key={
                component.type === 'single'
                  ? component.url
                  : component.urlPrefix
              }
              component={component}
              pathname={pathname}
              privateDocUrls={privateDocUrls}
            />
          ))}
          {archivedItems.length > 0 ? (
            <SidebarMenuItem className="px-2 pb-1 pt-4 text-xs font-medium text-muted-foreground">
              Archived
            </SidebarMenuItem>
          ) : null}
          {archivedItems.map((component) => (
            <SidebarComponentItem
              key={
                component.type === 'single'
                  ? component.url
                  : component.urlPrefix
              }
              component={component}
              pathname={pathname}
              privateDocUrls={privateDocUrls}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
