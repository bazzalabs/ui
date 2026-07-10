'use client'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar'
import { SidebarComponentItem } from './component-item'
import type { ComponentItem } from './types'

type SidebarComponentsGroupProps = {
  items: ComponentItem[]
  pathname: string
  privateDocUrls: Set<string> | null
}

export function SidebarComponentsGroup({
  items,
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
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
