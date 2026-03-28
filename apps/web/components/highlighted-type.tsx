import { cn } from '@/lib/cn'

interface HighlightedTypeProps {
  code: string
  className?: string
  /**
   * Pre-formatted version of the code (from build-time formatting)
   * If provided, this will be displayed instead of the raw code
   */
  formattedCode?: string
}

/**
 * Component that displays TypeScript code
 */
export function HighlightedType({
  code,
  className,
  formattedCode,
}: HighlightedTypeProps) {
  const displayCode = formattedCode || code

  return (
    <code className={cn(className, 'font-mono whitespace-pre-wrap')}>
      {displayCode}
    </code>
  )
}
