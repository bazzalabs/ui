'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../utils/types.js'
import { ListContext } from '../contexts/list-context.js'
import { useListKeyboard } from '../hooks/use-list-keyboard.js'
import type { ListStore } from '../store/use-list-store.js'
import { ListRootDataAttributes } from './root.data-attrs.js'

export interface ListColumn {
  name: string
  size: string
}

export interface ListRootState extends Record<string, unknown> {
  empty: boolean
}

export interface ListRootProps extends ComponentProps<'div', ListRootState> {
  store: ListStore<unknown>
  columns?: readonly ListColumn[]
  layout?: boolean
}

const stateAttributesMapping = {
  empty: (value: unknown) =>
    value ? { [ListRootDataAttributes.empty]: '' } : null,
}

export const ListRoot = React.forwardRef<HTMLDivElement, ListRootProps>(
  function ListRoot(props, forwardedRef) {
    const {
      store,
      columns,
      layout = true,
      render,
      className,
      style,
      children,
      onKeyDown,
      onFocus,
      onBlur,
      onPointerLeave,
      ...rest
    } = props
    const rootRef = React.useRef<HTMLDivElement>(null)
    const rootId = React.useId()
    const { selectionMode, empty, firstNavigableKey } = store.props
    const { focusMode } = store.props
    const highlightedId = store.collection.useState('highlightedId')
    const highlightSource = store.collection.useState('highlightSource')
    const keyboardActiveKey =
      highlightSource === 'keyboard' ? highlightedId : null
    const [focusWithin, setFocusWithin] = React.useState(false)
    const state: ListRoot.State = { empty }
    const template = columns
      ?.map((column) => `[${column.name}] ${column.size}`)
      .join(' ')
    const defaultStyle: React.CSSProperties = layout
      ? {
          display: 'grid',
          gridTemplateColumns: 'var(--list-template)',
          ...(template ? { '--list-template': template } : {}),
        }
      : {}
    const consumerStyle = typeof style === 'function' ? style(state) : style
    const contextValue = React.useMemo(
      () => ({
        store,
        layout,
        columns,
        rootId,
        rootRef,
        selectionMode,
        empty,
        firstNavigableKey,
      }),
      [columns, empty, firstNavigableKey, layout, rootId, selectionMode, store],
    )

    React.useLayoutEffect(() => {
      store.collection.setListRef(rootRef)
    }, [store])

    const handlePointerLeave = React.useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        onPointerLeave?.(event)
        if (
          !event.defaultPrevented &&
          store.collection.state.highlightSource === 'pointer'
        )
          store.collection.clearHighlight()
      },
      [onPointerLeave, store],
    )
    const handleKeyDown = useListKeyboard({ onKeyDown, store })
    const handleFocus = React.useCallback(
      (event: React.FocusEvent<HTMLDivElement>) => {
        onFocus?.(event)
        if (!event.defaultPrevented) setFocusWithin(true)
      },
      [onFocus],
    )
    const handleBlur = React.useCallback(
      (event: React.FocusEvent<HTMLDivElement>) => {
        onBlur?.(event)
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setFocusWithin(false)
      },
      [onBlur],
    )

    const element = useRender({
      render,
      ref: [rootRef, forwardedRef],
      state,
      stateAttributesMapping,
      props: {
        ...rest,
        [ListRootDataAttributes.root]: '',
        'data-focus-within': focusWithin ? '' : undefined,
        role: 'listbox',
        'aria-multiselectable': selectionMode === 'multiple' ? true : undefined,
        tabIndex: focusMode === 'virtual' ? 0 : -1,
        'aria-activedescendant':
          focusMode === 'virtual' && keyboardActiveKey !== null
            ? `${rootId}-${keyboardActiveKey}`
            : undefined,
        className,
        style: { ...defaultStyle, ...consumerStyle },
        onPointerLeave: handlePointerLeave,
        onKeyDown: handleKeyDown,
        onFocus: handleFocus,
        onBlur: handleBlur,
        children,
      },
      defaultTagName: 'div',
    })

    return (
      <ListContext.Provider value={contextValue}>
        {element}
      </ListContext.Provider>
    )
  },
)

export namespace ListRoot {
  export type State = ListRootState
  export interface Props extends ListRootProps {}
}
