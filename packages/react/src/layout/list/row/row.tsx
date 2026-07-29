'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../utils/types.js'
import { useMaybeListGroupContext } from '../contexts/group-context.js'
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
  firstInGroup: boolean
  lastInGroup: boolean
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
  firstInGroup: (value: unknown) =>
    value ? { [ListRowDataAttributes.firstInGroup]: '' } : null,
  lastInGroup: (value: unknown) =>
    value ? { [ListRowDataAttributes.lastInGroup]: '' } : null,
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
    const { store, layout, rootId, selectionMode, firstNavigableKey } =
      useListContext()
    const group = useMaybeListGroupContext()
    const collectionGroupId = group ? group.collectionValue : undefined
    const effectiveDisabled = disabled || store.props.disabledKeys.has(value)
    const itemRef = React.useRef<HTMLDivElement>(null)
    const highlightedId = store.collection.useState('highlightedId')
    const highlightSource = store.collection.useState('highlightSource')
    const selected = store.selection.useState('isSelected', value)
    const firstSelected = store.selection.useState('isFirstOfRun', value)
    const lastSelected = store.selection.useState('isLastOfRun', value)
    const firstInGroup = store.collection.useState('isFirstInGroup', value)
    const lastInGroup = store.collection.useState('isLastInGroup', value)
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
      disabled: effectiveDisabled,
      firstInGroup,
      lastInGroup,
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
        disabled: effectiveDisabled,
        groupId: collectionGroupId,
      })
      const unregisterRef = store.collection.registerItemRef(value, itemRef)
      const unregisterRowDisabled = store.registerRowDisabled(value, disabled)
      const element = itemRef.current
      const unregisterRow = element
        ? store.collection.registerRow(value, element, {
            kind: 'item',
            groupId: collectionGroupId,
          })
        : undefined
      return () => {
        unregisterItem()
        unregisterRef()
        unregisterRowDisabled()
        unregisterRow?.()
      }
    }, [collectionGroupId, disabled, effectiveDisabled, store, value])

    React.useLayoutEffect(() => {
      // store.props is committed by the store hook before this effect runs.
      if (keyboardActive && store.props.focusMode !== 'virtual')
        itemRef.current?.focus()
    }, [keyboardActive, store])

    React.useLayoutEffect(() => {
      if (effectiveDisabled && highlightedId === value)
        store.collection.clearHighlight()
    }, [effectiveDisabled, highlightedId, store, value])

    const handlePointerMove = React.useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        onPointerMove?.(event)
        if (!event.defaultPrevented && !effectiveDisabled)
          store.collection.setHighlightedId(value, 'pointer')
      },
      [effectiveDisabled, onPointerMove, store, value],
    )
    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(event)
        if (event.defaultPrevented || effectiveDisabled) return
        store.collection.setHighlightedId(value, 'pointer')
        const modified =
          event.shiftKey || event.metaKey || event.ctrlKey || event.altKey
        if (event.shiftKey) {
          event.preventDefault()
          store.selection.selectRange(value)
          if (store.selection.context.mode !== 'none')
            store.setMultiSelectActive(true)
        } else if (event.metaKey || event.ctrlKey) {
          store.selection.toggle(value)
          if (store.selection.context.mode !== 'none')
            store.setMultiSelectActive(true)
        } else {
          if (store.selection.context.mode !== 'none') store.select([value])
          if (!modified) {
            ;(store as ListStoreWithAction).onAction?.(value, {
              method: 'pointer',
              event: event.nativeEvent,
            })
          }
        }
      },
      [effectiveDisabled, onClick, store, value],
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
        'aria-disabled': effectiveDisabled || undefined,
        tabIndex:
          store.props.focusMode === 'virtual'
            ? -1
            : keyboardActive ||
                (store.keyboardActiveKey === null &&
                  firstNavigableKey === value)
              ? 0
              : -1,
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
