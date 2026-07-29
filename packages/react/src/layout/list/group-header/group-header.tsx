'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../utils/types.js'
import { useListGroupContext } from '../contexts/group-context.js'
import { useListContext } from '../contexts/list-context.js'
import { ListGroupHeaderDataAttributes } from './group-header.data-attrs.js'

export interface ListGroupHeaderState extends Record<string, unknown> {
  collapsed: boolean
}

export interface ListGroupHeaderProps
  extends ComponentProps<'div', ListGroupHeaderState> {}

const stateAttributesMapping = {
  collapsed: (value: unknown) =>
    value ? { [ListGroupHeaderDataAttributes.collapsed]: '' } : null,
}

export const ListGroupHeader = React.forwardRef<
  HTMLDivElement,
  ListGroupHeaderProps
>(function ListGroupHeader(props, forwardedRef) {
  const { render, className, style, children, onClick, ...rest } = props
  const { store, layout } = useListContext()
  const { value } = useListGroupContext()
  const collapsed = store.collapseStore.useState('collapsedGroups').has(value)
  const state: ListGroupHeader.State = { collapsed }
  const consumerStyle = typeof style === 'function' ? style(state) : style
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) store.toggleGroup(value)
    },
    [onClick, store, value],
  )

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      [ListGroupHeaderDataAttributes.groupHeader]: '',
      role: 'button',
      'aria-expanded': !collapsed,
      className,
      style: {
        ...(layout ? { gridColumn: '1 / -1', position: 'sticky', top: 0 } : {}),
        ...consumerStyle,
      },
      onClick: handleClick,
      children,
    },
    defaultTagName: 'div',
  })
})

export namespace ListGroupHeader {
  export type State = ListGroupHeaderState
  export interface Props extends ListGroupHeaderProps {}
}
