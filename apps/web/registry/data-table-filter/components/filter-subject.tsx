import type { Column, ColumnDataType } from '@bazza-ui/filters'
import { type ComponentPropsWithoutRef, isValidElement } from 'react'
import { cn } from '@/lib/utils'

interface FilterSubjectProps<TData, TType extends ColumnDataType>
  extends ComponentPropsWithoutRef<'span'> {
  column: Column<TData, TType>
  entityName?: string
}

export function FilterSubject<TData, TType extends ColumnDataType>({
  column,
  entityName,
  className,
  ...props
}: FilterSubjectProps<TData, TType>) {
  const subject = column.type === 'boolean' ? entityName : column.displayName

  const { icon: Icon } = column
  const hasIcon = !!Icon

  return (
    <span
      data-slot="filter-subject"
      data-column-type={column.type}
      className={cn(
        'flex select-none items-center gap-1 whitespace-nowrap px-2 font-medium',
        className,
      )}
      {...props}
    >
      {hasIcon &&
        (isValidElement(Icon) ? (
          Icon
        ) : (
          <Icon className="size-4 text-primary stroke-[2.25px]" />
        ))}

      <span>{subject}</span>
    </span>
  )
}
