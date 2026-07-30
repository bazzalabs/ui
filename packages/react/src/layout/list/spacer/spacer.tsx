'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../utils/types.js'
import { useListContext } from '../contexts/list-context.js'
import { ListSpacerDataAttributes } from './spacer.data-attrs.js'

export interface ListSpacerState extends Record<string, unknown> {}

export interface ListSpacerProps
  extends ComponentProps<'div', ListSpacerState> {
  height: number
}

export const ListSpacer = React.forwardRef<HTMLDivElement, ListSpacerProps>(
  function ListSpacer(props, forwardedRef) {
    const { height, render, className, style, children, ...rest } = props
    const { layout } = useListContext()
    const state: ListSpacer.State = {}
    const consumerStyle = typeof style === 'function' ? style(state) : style
    const consumerClassName =
      typeof className === 'function' ? className(state) : className

    const element = useRender({
      render,
      ref: forwardedRef,
      state,
      props: {
        ...rest,
        [ListSpacerDataAttributes.spacer]: '',
        'aria-hidden': true,
        className: consumerClassName,
        style: {
          ...(layout ? { gridColumn: '1 / -1' } : {}),
          height,
          ...consumerStyle,
        },
        children,
      },
      defaultTagName: 'div',
    })

    return height === 0 ? null : element
  },
)

export namespace ListSpacer {
  export type State = ListSpacerState
  export interface Props extends ListSpacerProps {}
}
