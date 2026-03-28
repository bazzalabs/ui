'use client'

import { ChevronRight, LockKeyholeIcon } from 'lucide-react'
import Link from 'next/link'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { SidebarMenuSub, SidebarMenuSubButton } from '@/components/ui/sidebar'
import type { MenuItem } from './types'
import { containsActiveUrl, isPrivateDocUrl } from './utils'

function PrivateDocIcon() {
  return <LockKeyholeIcon className="size-3.5 text-muted-foreground" />
}

type SidebarMenuItemRendererProps = {
  item: MenuItem
  pathname: string
  privateDocUrls: Set<string> | null
}

export function SidebarMenuItemRenderer({
  item,
  pathname,
  privateDocUrls,
}: SidebarMenuItemRendererProps) {
  if (item.type === 'link') {
    const privateDoc = isPrivateDocUrl(item.url, privateDocUrls)

    return (
      <SidebarMenuSubButton asChild isActive={pathname === item.url}>
        <Link href={item.url} className="inline-flex items-center gap-1.5">
          <span>{item.title}</span>
          {privateDoc ? <PrivateDocIcon /> : null}
        </Link>
      </SidebarMenuSubButton>
    )
  }

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
            <SidebarMenuItemRenderer
              key={
                child.type === 'link'
                  ? child.url
                  : `collapsible-${child.title}-${index}`
              }
              item={child}
              pathname={pathname}
              privateDocUrls={privateDocUrls}
            />
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}
