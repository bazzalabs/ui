'use client'

import type { Column, ColumnDataType } from '@bazza-ui/data-view/react'
import { isBooleanColumn } from '@bazza-ui/data-view/react'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  type ComponentPropsWithoutRef,
  forwardRef,
  isValidElement,
} from 'react'
import { cn } from '@/lib/utils'
import {
  useDataViewEntityName,
  useDataViewVariant,
} from '../root/data-view-context'
import { useFilterItemContext } from './filter-item'

const filterSubjectVariants = cva(
  'flex select-none items-center gap-1.5 whitespace-nowrap px-2 h-full',
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
  /** The column configuration. If omitted, will be read from FilterItem context. */
  column?: Column<TData, TType>
  entityName?: string
}

/**
 * Displays the column name/subject for a filter.
 * Renders a `<span>` element.
 *
 * Documentation: [Bazza UI DataView](https://bazza-ui.com/docs/components/data-view)
 */
const FilterSubject = forwardRef<HTMLSpanElement, FilterSubjectProps>(
  (
    {
      column: columnProp,
      entityName: entityNameProp,
      className,
      variant: variantProp,
      ...props
    },
    ref,
  ) => {
    const itemContext = useFilterItemContext()
    const dataViewEntityName = useDataViewEntityName()
    const contextVariant = useDataViewVariant()

    const column = columnProp ?? itemContext?.column
    const entityName =
      entityNameProp ?? itemContext?.entityName ?? dataViewEntityName
    const variant = variantProp ?? contextVariant ?? 'default'

    if (!column) {
      throw new Error(
        'FilterSubject requires a column prop or must be used within FilterItem',
      )
    }

    const subject = isBooleanColumn(column) ? entityName : column.displayName

    // column.icon is typed as `unknown` in data-view
    const Icon = column.icon as
      | React.ComponentType<{ className?: string }>
      | undefined
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
