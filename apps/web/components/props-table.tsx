import { cn } from '@/lib/utils'

export const PropsTable = ({
  children,
  className,
  ...props
}: React.ComponentProps<'div'>) => {
  return (
    <div
      className={cn('border rounded-md overflow-clip', className)}
      {...props}
    >
      <div className="w-full items-center px-3 py-2 bg-muted grid-cols-subgrid grid col-span-2 text-sm font-medium">
        <span>Name</span>
        <span>Type</span>
      </div>
      {children}
    </div>
  )
}
