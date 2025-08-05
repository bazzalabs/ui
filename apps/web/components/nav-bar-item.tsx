'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NavBarItemProps = {
  href: string
  label: string
} & React.HTMLAttributes<HTMLAnchorElement>

export function NavBarItem({ href, label, ...props }: NavBarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href)

  return (
    <Button variant="ghost" size="sm" asChild>
      <Link
        data-active={isActive ? 'true' : undefined}
        className={cn(props.className)}
        href={href}
        {...props}
      >
        {label}
      </Link>
    </Button>
  )
}
