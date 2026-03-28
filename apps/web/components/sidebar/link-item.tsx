'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import type { SidebarAudience } from './types'
import {
  getComponentAudienceBadge,
  getComponentAudienceClassName,
  isPrivateDocUrl,
} from './utils'

type SidebarLinkItemProps = {
  title: ReactNode
  url: string
  pathname: string
  privateDocUrls: Set<string> | null
  audience?: SidebarAudience
  badge?: ReactNode
}

export function SidebarLinkItem({
  title,
  url,
  pathname,
  privateDocUrls,
  audience,
  badge,
}: SidebarLinkItemProps) {
  const privateDoc = isPrivateDocUrl(url, privateDocUrls)
  const audienceBadge = getComponentAudienceBadge(audience)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={url === pathname}
        className={cn(
          'font-medium hover-expand-[2px]',
          getComponentAudienceClassName(audience),
        )}
      >
        <Link href={url} className="inline-flex items-center gap-1.5">
          <span>{title}</span>
          {privateDoc
            ? (audienceBadge ?? getComponentAudienceBadge('private'))
            : audienceBadge}
          {badge}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
