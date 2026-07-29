'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../utils/types.js'
import { useListContext } from '../contexts/list-context.js'
import type { Key } from '../store/use-list-store.js'
import { ListRowDataAttributes } from './row.data-attrs.js'

export interface ListRowState extends Record<string, unknown> {
  active: boolean
  keyboardActive: boolean
  selected: boolean
  firstSelected: boolean
  lastSelected: boolean
  applyBackground: boolean
  disabled: boolean
}

export interface ListRowProps extends ComponentProps<'div', ListRowState> {
  value: Key
  disabled?: boolean
}

const stateAttributesMapping = {
  active: (value: unknown) =>
    value ? { [ListRowDataAttributes.active]: '' } : null,
  keyboardActive: (value: unknown) =>
    value ? { [ListRowDataAttributes.keyboardActive]: '' } : null,
  selected: (value: unknown) =>
    value ? { [ListRowDataAttributes.selected]: '' } : null,
  firstSelected: (value: unknown) =>
    value ? { [ListRowDataAttributes.firstSelected]: '' } : null,
  lastSelected: (value: unknown) =>
    value ? { [ListRowDataAttributes.lastSelected]: '' } : null,
  applyBackground: (value: unknown) =>
    value ? { [ListRowDataAttributes.applyBackground]: '' } : null,
  disabled: (value: unknown) =>
    value ? { [ListRowDataAttributes.disabled]: '' } : null,
}

export const ListRow = React.forwardRef<HTMLDivElement, ListRowProps>(
  function ListRow(props, forwardedRef) {
    const {
      value,
      disabled = false,
      render,
      className,
      style,
      children,
      onClick,
      onPointerMove,
      ...rest
    } = props
    const { store, layout, rootId, selectionMode } = useListContext()
    const itemRef = React.useRef<HTMLDivElement>(null)
    const highlightedId = store.collection.useState('highlightedId')
    const highlightSource = store.collection.useState('highlightSource')
    const selected = store.selection.useState('isSelected', value)
    const firstSelected = store.selection.useState('isFirstOfRun', value)
    const lastSelected = store.selection.useState('isLastOfRun', value)
    const active = highlightedId === value && highlightSource === 'pointer'
    const keyboardActive =
      highlightedId === value && highlightSource === 'keyboard'
    const state: ListRow.State = {
      active,
      keyboardActive,
      selected,
      firstSelected,
      lastSelected,
      applyBackground: active || keyboardActive || selected,
      disabled,
    }
    const defaultStyle: React.CSSProperties = layout
      ? {
          display: 'grid',
          gridTemplateColumns: 'subgrid',
          gridColumn: '1 / -1',
        }
      : {}
    const consumerStyle = typeof style === 'function' ? style(state) : style

    React.useLayoutEffect(() => {
      const unregisterItem = store.collection.registerItem(value, {
        value,
        disabled,
      })
      const unregisterRef = store.collection.registerItemRef(value, itemRef)
      const element = itemRef.current
      const unregisterRow = element
        ? store.collection.registerRow(value, element, { kind: 'item' })
        : undefined
      return () => {
        unregisterItem()
        unregisterRef()
        unregisterRow?.()
      }
    }, [disabled, store, value])

    const handlePointerMove = React.useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        onPointerMove?.(event)
        if (!event.defaultPrevented && !disabled)
          store.collection.setHighlightedId(value, 'pointer')
      },
      [disabled, onPointerMove, store, value],
    )
    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(event)
        if (event.defaultPrevented || disabled) return
        store.collection.setHighlightedId(value, 'pointer')
        const modified =
          event.shiftKey || event.metaKey || event.ctrlKey || event.altKey
        if (event.shiftKey) {
          event.preventDefault()
          store.selection.selectRange(value)
        } else if (event.metaKey || event.ctrlKey) {
          store.selection.toggle(value)
        } else {
          if (store.selection.context.mode !== 'none')
            store.selection.set([value])
          if (!modified) {
            ;(store as ListStoreWithAction).onAction?.(value, {
              method: 'pointer',
              event: event.nativeEvent,
            })
          }
        }
      },
      [disabled, onClick, store, value],
    )

    return useRender({
      render,
      ref: [itemRef, forwardedRef],
      state,
      stateAttributesMapping,
      props: {
        ...rest,
        [ListRowDataAttributes.row]: '',
        id: `${rootId}-${value}`,
        role: 'option',
        'aria-selected': selectionMode !== 'none' ? selected : undefined,
        'aria-disabled': disabled || undefined,
        tabIndex: -1,
        className,
        style: { ...defaultStyle, ...consumerStyle },
        onClick: handleClick,
        onPointerMove: handlePointerMove,
        children,
      },
      defaultTagName: 'div',
    })
  },
)

type ListStoreWithAction = {
  onAction?: (
    key: Key,
    details: { method: 'pointer'; event: MouseEvent },
  ) => void
}

export namespace ListRow {
  export type State = ListRowState
  export interface Props extends ListRowProps {}
}
