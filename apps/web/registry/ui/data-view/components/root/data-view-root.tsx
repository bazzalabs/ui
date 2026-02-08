'use client'

import { type ComponentPropsWithoutRef, forwardRef, type Ref } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

export interface DataViewRootProps extends ComponentPropsWithoutRef<'div'> {
  ref?: Ref<HTMLDivElement>
}

/**
 * Layout container for data view components.
 * Must be wrapped with `DataView.Provider` to access context.
 * Renders a `<div>` element.
 */
function DataViewRootImpl(
  { children, className, ...props }: DataViewRootProps,
  ref: Ref<HTMLDivElement>,
) {
  const isMobile = useIsMobile()

  return (
    <div
      ref={ref}
      data-slot="data-view-root"
      data-mobile={isMobile}
      className={cn('flex w-full items-start justify-between gap-2', className)}
      {...props}
    >
      {children}
    </div>
  )
}

DataViewRootImpl.displayName = 'DataViewRoot'

const DataViewRoot = forwardRef(DataViewRootImpl)

export { DataViewRoot }

export namespace DataViewRoot {
  export type Props = DataViewRootProps
}
