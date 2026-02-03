import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CodeBlockWrapperProps extends HTMLAttributes<HTMLDivElement> {
  loading?: boolean
}

export const CodeBlockWrapper = ({
  className,
  children,
  loading,
}: CodeBlockWrapperProps) => {
  return (
    <div
      className={cn(
        '**:font-mono text-sm not-dark:font-[450] rounded-2xl *:rounded-2xl border border-border bg-white dark:bg-neutral-900 shadow-xs',
        loading && 'p-4',
        className,
      )}
    >
      {loading ? (
        <code className="not-dark:font-[450] text-sm text-muted-foreground">
          Loading...
        </code>
      ) : (
        children
      )}
    </div>
  )
}

export function CodeBlock({
  code,
  lang,
  className,
}: {
  code: string
  lang?: string
  className?: string
}) {
  return (
    <CodeBlockWrapper className={className}>
      <pre className="p-4 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </CodeBlockWrapper>
  )
}
