'use client'

import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { useDataViewContext } from '../provider/data-view-context'

// ---------------------------------------------------------------------------
// FilterActions
// ---------------------------------------------------------------------------

export function FilterActions({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { instance, layer } = useDataViewContext()
  const targetLayer = layer === 'base' ? instance.baseView : instance.overrides
  const hasFilters = targetLayer.filters.length > 0

  if (!hasFilters) return null

  return (
    <button
      type="button"
      onClick={() => targetLayer.removeAllFilters()}
      className={cn(
        'inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5',
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <XIcon className="size-3" />
          Clear all
        </>
      )}
    </button>
  )
}
