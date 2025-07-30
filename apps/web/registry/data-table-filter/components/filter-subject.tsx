import type { Column, ColumnDataType } from '@bazzaui/filters'
import { isValidElement } from 'react'

interface FilterSubjectProps<TData, TType extends ColumnDataType> {
  column: Column<TData, TType>
}

export function FilterSubject<TData, TType extends ColumnDataType>({
  column,
}: FilterSubjectProps<TData, TType>) {
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

      <span>{column.displayName}</span>
    </span>
  )
}
