'use client'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar'
import { SidebarLinkItem } from './link-item'
import type { SidebarBasicItem } from './types'

type SidebarBasicsGroupProps = {
  items: SidebarBasicItem[]
  pathname: string
  privateDocUrls: Set<string> | null
}

export function SidebarBasicsGroup({
  items,
  pathname,
  privateDocUrls,
}: SidebarBasicsGroupProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Basics</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarLinkItem
              key={item.url}
              title={item.title}
              url={item.url}
              pathname={pathname}
              privateDocUrls={privateDocUrls}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
