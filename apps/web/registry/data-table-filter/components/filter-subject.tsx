import type { Column, ColumnDataType } from '@bazza-ui/filters'
import { cva, type VariantProps } from 'class-variance-authority'
import { type ComponentPropsWithoutRef, isValidElement } from 'react'
import { cn } from '@/lib/utils'
import { useFilterVariant } from '../context'

const filterSubjectVariants = cva(
  'flex select-none items-center gap-1 whitespace-nowrap px-2',
  {
    variants: {
      variant: {
        default: 'font-medium',
        clean: 'text-primary/75',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface FilterSubjectProps<TData, TType extends ColumnDataType>
  extends ComponentPropsWithoutRef<'span'>,
    VariantProps<typeof filterSubjectVariants> {
  column: Column<TData, TType>
  entityName?: string
}

export function FilterSubject<TData, TType extends ColumnDataType>({
  column,
  entityName,
  className,
  variant: variantProp,
  ...props
}: FilterSubjectProps<TData, TType>) {
  const contextVariant = useFilterVariant()
  const variant = variantProp ?? contextVariant ?? 'default'

  const subject = column.type === 'boolean' ? entityName : column.displayName

  const { icon: Icon } = column
  const hasIcon = !!Icon

  return (
    <span
      data-slot="filter-subject"
      data-column-type={column.type}
      className={cn(filterSubjectVariants({ variant }), className)}
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
