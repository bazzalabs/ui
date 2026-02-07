'use client'

import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { useDataViewFilterItemContext } from '../provider/data-view-context'

// ---------------------------------------------------------------------------
// FilterRemove
// ---------------------------------------------------------------------------

export function FilterRemove({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = useDataViewFilterItemContext()
  if (!ctx) return null

  const { column } = ctx

  return (
    <button
      type="button"
      onClick={() => column.removeFilter()}
      className={cn(
        'flex items-center justify-center size-5 rounded-sm hover:bg-muted transition-colors text-muted-foreground hover:text-foreground',
        className,
      )}
      {...props}
    >
      <XIcon className="size-3" />
    </button>
  )
}
