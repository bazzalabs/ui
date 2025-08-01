import type { Column, ColumnDataType } from '@bazzaui/filters'
import { isValidElement } from 'react'

interface FilterSubjectProps<TData, TType extends ColumnDataType> {
  column: Column<TData, TType>
  entityName?: string
}

export function FilterSubject<TData, TType extends ColumnDataType>({
  column,
  entityName,
}: FilterSubjectProps<TData, TType>) {
  const subject = column.type === 'boolean' ? entityName : column.displayName

  const { icon: Icon } = column
  const hasIcon = !!Icon

  return (
    <span className="flex select-none items-center gap-1 whitespace-nowrap px-2 font-medium">
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
