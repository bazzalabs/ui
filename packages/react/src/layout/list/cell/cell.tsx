'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../utils/types.js'
import { useListContext } from '../contexts/list-context.js'
import { ListCellDataAttributes } from './cell.data-attrs.js'

export interface ListCellState extends Record<string, unknown> {}

export interface ListCellProps extends ComponentProps<'div', ListCellState> {
  column: string
}

export const ListCell = React.forwardRef<HTMLDivElement, ListCellProps>(
  function ListCell(props, forwardedRef) {
    const { column, render, className, style, children, ...rest } = props
    const { layout, columns } = useListContext()
    const state: ListCell.State = {}
    const consumerStyle = typeof style === 'function' ? style(state) : style
    if (
      process.env.NODE_ENV !== 'production' &&
      columns &&
      !columns.some((item) => item.name === column)
    ) {
      console.warn(
        `List.Cell column "${column}" is not configured in List.Root columns.`,
      )
    }
    return useRender({
      render,
      ref: forwardedRef,
      state,
      props: {
        ...rest,
        [ListCellDataAttributes.cell]: '',
        'data-list-column': column,
        className,
        style: { ...(layout ? { gridColumn: column } : {}), ...consumerStyle },
        children,
      },
      defaultTagName: 'div',
    })
  },
)

export namespace ListCell {
  export type State = ListCellState
  export interface Props extends ListCellProps {}
}
