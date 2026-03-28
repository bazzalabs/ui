'use client'

import { usePathname } from 'next/navigation'
import { type ComponentProps, useRef } from 'react'
import { cn } from '@/lib/utils'
import { FadeContainer } from './fade-container'
import { SidebarBasicsGroup } from './sidebar/basics-group'
import { SidebarComponentsGroup } from './sidebar/components-group'
import {
  archivedComponentItems,
  basicItems,
  componentItems,
} from './sidebar/data'
import { AppSidebarFooter } from './sidebar/footer'
import { AppSidebarHeader } from './sidebar/header'
import type { ComponentItem } from './sidebar/types'
import { filterComponentItem, isVisibleDocUrl } from './sidebar/utils'
import { Sidebar, SidebarContent } from './ui/sidebar'

export function AppSidebar({
  visibleDocUrls,
  privateDocUrls,
  className,
  variant = 'inset',
  ...props
}: ComponentProps<typeof Sidebar> & {
  visibleDocUrls?: string[]
  privateDocUrls?: string[]
}) {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement | null>(null)
  const visibleDocUrlSet = visibleDocUrls ? new Set(visibleDocUrls) : null
  const privateDocUrlSet = privateDocUrls ? new Set(privateDocUrls) : null
  const visibleItems = basicItems.filter((item) =>
    isVisibleDocUrl(item.url, visibleDocUrlSet),
  )
  const visibleComponentItems = componentItems
    .map((component) => filterComponentItem(component, visibleDocUrlSet))
    .filter((component): component is ComponentItem => component !== null)
  const visibleArchivedComponentItems = archivedComponentItems
    .map((component) => filterComponentItem(component, visibleDocUrlSet))
    .filter((component): component is ComponentItem => component !== null)

  return (
    <Sidebar
      variant={variant}
      className={cn('flex flex-col', className)}
      {...props}
    >
      <AppSidebarHeader />
      <FadeContainer
        scrollContainerRef={ref}
        resizeMeasurementDelay={100}
        background="var(--sidebar)"
      >
        <SidebarContent className="min-h-0 flex-1 no-scrollbar" ref={ref}>
          <SidebarBasicsGroup
            items={visibleItems}
            pathname={pathname}
            privateDocUrls={privateDocUrlSet}
          />
          <SidebarComponentsGroup
            items={visibleComponentItems}
            archivedItems={visibleArchivedComponentItems}
            pathname={pathname}
            privateDocUrls={privateDocUrlSet}
          />
        </SidebarContent>
      </FadeContainer>
      <AppSidebarFooter />
    </Sidebar>
  )
}
