'use client'

import { Suspense, useMemo } from 'react'
import { getRegistryComponent } from '@/lib/registry'
import { cn } from '@/lib/utils'

export interface ComponentPreviewProps {
  /**
   * The name of the registry item to preview
   */
  name: string
  /**
   * Optional description to show above the preview
   */
  description?: string
  /**
   * Additional class names for the preview container
   */
  className?: string
  /**
   * Alignment of the component within the preview area
   * @default 'center'
   */
  align?: 'start' | 'center' | 'end'
  /**
   * Whether to show a border around the preview
   * @default true
   */
  bordered?: boolean
}

/**
 * ComponentPreview renders a registry component with lazy loading and Suspense.
 * Used in documentation pages to show live component examples.
 */
export function ComponentPreview({
  name,
  description,
  className,
  align = 'center',
  bordered = true,
}: ComponentPreviewProps) {
  const Component = useMemo(() => getRegistryComponent(name), [name])

  if (!Component) {
    return (
      <div
        className={cn(
          'flex min-h-[350px] w-full items-center justify-center rounded-lg border border-dashed p-8',
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">
          Component "{name}" not found in registry.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('group relative', className)}>
      {description && (
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      )}
      <div
        className={cn(
          'flex min-h-[350px] w-full items-center justify-center p-8',
          bordered && 'rounded-lg border',
          {
            'justify-start': align === 'start',
            'justify-center': align === 'center',
            'justify-end': align === 'end',
          },
        )}
      >
        <Suspense fallback={<ComponentPreviewSkeleton />}>
          <Component />
        </Suspense>
      </div>
    </div>
  )
}

function ComponentPreviewSkeleton() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}
