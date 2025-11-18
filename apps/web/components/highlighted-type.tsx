'use client'

import { useEffect, useState } from 'react'
import { highlightInline } from '@/lib/highlighter'
import { cn } from '@/lib/cn'

interface HighlightedTypeProps {
  code: string
  className?: string
  /**
   * Pre-formatted version of the code (from build-time formatting)
   * If provided, this will be used for highlighting instead of the raw code
   */
  formattedCode?: string
}

/**
 * Component that syntax highlights TypeScript code using Shiki
 * Uses pre-formatted code from build-time when available
 */
export function HighlightedType({
  code,
  className,
  formattedCode,
}: HighlightedTypeProps) {
  const [highlighted, setHighlighted] = useState<JSX.Element | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)

    const processType = async () => {
      try {
        // Use pre-formatted code if available, otherwise use raw code
        const codeToHighlight = formattedCode || code

        // Highlight the code
        const result = await highlightInline(codeToHighlight, 'typescript')
        setHighlighted(result as JSX.Element)
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to highlight type:', err)
        setHighlighted(null)
        setIsLoading(false)
      }
    }

    processType()
  }, [code, formattedCode])

  if (isLoading || !highlighted) {
    // Fallback while loading or on error
    return (
      <code className={cn(className, 'text-muted-foreground font-mono')}>
        {code}
      </code>
    )
  }

  return (
    <span
      className={cn(
        className,
        '[&_.shiki-inline]:bg-transparent [&_code]:text-inherit [&_code]:font-mono [&_code]:whitespace-pre-wrap',
      )}
    >
      {highlighted}
    </span>
  )
}
