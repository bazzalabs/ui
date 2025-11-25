'use client'

import { default as ReactMarkdown } from 'react-markdown'
import { cn } from '@/lib/utils'

export function Markdown({
  children,
}: React.ComponentProps<typeof ReactMarkdown>) {
  return (
    <ReactMarkdown
      components={{
        code: ({ children }) => (
          // 'relative rounded-sm bg-muted px-1 py-0.5 font-mono text-sm border inset-shadow-xs font-[450]',

          <code className="rounded-sm bg-muted px-1 py-0.5 border inset-shadow-xs font-[450] font-mono text-sm break-words min-w-0">
            {children}
          </code>
        ),
        p: ({ children }) => (
          <p className="mb-2 last-of-type:mb-0">{children}</p>
        ),
        ul: ({
          className,
          ...props
        }: React.HTMLAttributes<HTMLUListElement>) => (
          <ul
            className={cn(
              'my-6 ml-6 list-disc [&>li>ul]:my-2 [&>li>ul]:ml-4',
              className,
            )}
            {...props}
          />
        ),
        li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
          <li className={cn('mt-1', className)} {...props} />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
