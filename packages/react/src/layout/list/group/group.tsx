'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../utils/types.js'
import { ListGroupContext } from '../contexts/group-context.js'
import { useListContext } from '../contexts/list-context.js'
import { encodeCollectionGroupId } from '../utils/collection-group-id.js'
import { ListGroupDataAttributes } from './group.data-attrs.js'

export interface ListGroupState extends Record<string, unknown> {
  collapsed: boolean
}

export interface ListGroupProps extends ComponentProps<'div', ListGroupState> {
  value: string
}

const stateAttributesMapping = {
  collapsed: (value: unknown) =>
    value ? { [ListGroupDataAttributes.collapsed]: '' } : null,
}

export const ListGroup = React.forwardRef<HTMLDivElement, ListGroupProps>(
  function ListGroup(props, forwardedRef) {
    const { value, render, className, style, children, ...rest } = props
    const { store, layout } = useListContext()
    const collectionValue = encodeCollectionGroupId(value)
    const collapsed = store.collapseStore.useState('collapsedGroups').has(value)
    const state: ListGroup.State = { collapsed }
    const consumerStyle = typeof style === 'function' ? style(state) : style

    React.useInsertionEffect(
      () => store.collection.registerGroup(collectionValue),
      [collectionValue, store],
    )

    const element = useRender({
      render,
      ref: forwardedRef,
      state,
      stateAttributesMapping,
      props: {
        ...rest,
        [ListGroupDataAttributes.group]: '',
        role: 'presentation',
        className,
        style: { ...(layout ? { display: 'contents' } : {}), ...consumerStyle },
        children,
      },
      defaultTagName: 'div',
    })

    return (
      <ListGroupContext.Provider value={{ value, collectionValue, collapsed }}>
        {element}
      </ListGroupContext.Provider>
    )
  },
)

export namespace ListGroup {
  export type State = ListGroupState
  export interface Props extends ListGroupProps {}
}
