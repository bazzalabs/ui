'use client'

import type { Column, ColumnDataType } from '@bazza-ui/filters'
import { isBooleanColumn } from '@bazza-ui/filters'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  type ComponentPropsWithoutRef,
  forwardRef,
  isValidElement,
} from 'react'
import { cn } from '@/lib/utils'
import { useFilterVariant } from '../root/filter-context'

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

export interface FilterSubjectProps<
  TData = unknown,
  TType extends ColumnDataType = ColumnDataType,
> extends ComponentPropsWithoutRef<'span'>,
    VariantProps<typeof filterSubjectVariants> {
  column: Column<TData, TType>
  entityName?: string
}

/**
 * Displays the column name/subject for a filter.
 * Renders a `<span>` element.
 *
 * Documentation: [Bazza UI Filter](https://bazza-ui.com/docs/components/filter)
 */
const FilterSubject = forwardRef<HTMLSpanElement, FilterSubjectProps>(
  ({ column, entityName, className, variant: variantProp, ...props }, ref) => {
    const contextVariant = useFilterVariant()
    const variant = variantProp ?? contextVariant ?? 'default'

    const subject = isBooleanColumn(column) ? entityName : column.displayName

    const { icon: Icon } = column
    const hasIcon = !!Icon

    return (
      <span
        ref={ref}
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
  },
)

FilterSubject.displayName = 'FilterSubject'

export { FilterSubject, filterSubjectVariants }

export namespace FilterSubject {
  export type Props<
    TData = unknown,
    TType extends ColumnDataType = ColumnDataType,
  > = FilterSubjectProps<TData, TType>
}
