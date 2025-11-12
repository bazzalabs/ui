import { cn } from '@/lib/utils'
import type { ComponentFrameProps } from './component-frame'

export function ComponentFrameSimple({
  className,
  containerClassName,
  previewClassName,
  caption,
  children,
  ...props
}: Omit<ComponentFrameProps, 'src'>) {
  return (
    <div className={cn('h-fit flex flex-col gap-4 w-full', className)}>
      <div
        className={cn(
          'rounded-2xl border 2xl:-mx-16 h-fit relative overflow-scroll flex',
          containerClassName,
        )}
        {...props}
      >
        <div
          className={cn('p-8 h-fit w-fit z-[10] relative', previewClassName)}
        >
          {children}
        </div>
        <div className="absolute h-full w-full bg-grid text-muted top-0 left-0 mask-radial-at-center mask-radial-from-50% z-[2]" />
        <div className="absolute h-full w-full  bg-white dark:bg-black top-0 left-0 z-[1]" />
      </div>
      {caption && (
        <div className="text-sm text-muted-foreground w-full text-center">
          {caption}
        </div>
      )}
    </div>
  )
}
