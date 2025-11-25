'use client'

import type { TOCItemType } from 'fumadocs-core/toc'
import Link from 'next/link'
import type { ComponentProps } from 'react'

export interface InlineTocProps extends ComponentProps<'div'> {
  items: TOCItemType[]
}

export function InlineTOC({ items, ...props }: InlineTocProps) {
  return (
    <div
      className="flex flex-col p-4 pt-0 text-sm text-muted-foreground mt-22"
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.url}
          href={item.url}
          className="py-1.5 hover:text-primary"
          style={{
            paddingInlineStart: 12 * Math.max(item.depth - 1, 0),
          }}
        >
          {item.title}
        </Link>
      ))}
    </div>
  )
}
