'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import logoSrc from '@/public/bazzaui-v3-color.png'

export function AppSidebarHeader() {
  return (
    <SidebarHeader className="shrink-0 pl-4 pt-6 text-sm">
      <SidebarMenu>
        <SidebarMenuItem className="inline-flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-0.5 font-mono font-medium tracking-tight"
          >
            <Image
              className="mr-1.5 size-5 translate-y-[-0.5px]"
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
  )
}
