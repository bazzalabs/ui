import { cn } from '@/lib/utils'

interface PropsTableProps extends React.ComponentProps<'div'> {
  name?: string
}

export const PropsTable = ({
  name,
  children,
  className,
  ...props
}: PropsTableProps) => {
  return (
    <div className="flex flex-col">
      {name && (
        <div className="pt-1 px-4 bg-background w-fit border pb-8 translate-y-7 z-[-1] rounded-lg">
          <span className="font-mono font-bold">{name}</span>
        </div>
      )}
      <div
        className={cn(
          'grid grid-cols-[auto_1fr] gap-x-12 border rounded-lg overflow-clip',
          className,
        )}
        {...props}
      >
        <div className="w-full items-center px-3 py-2 bg-muted grid-cols-subgrid grid col-span-2 text-sm font-medium">
          <span>Name</span>
          <span>Type</span>
        </div>
        {children}
      </div>
    </div>
  )
}
