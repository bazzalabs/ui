'use client'

import * as React from 'react'
import { ListContext } from '../contexts/list-context.js'
import type { Key, ListStore } from '../store/use-list-store.js'

interface UseListKeyboardOptions {
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
  store?: ListStore<unknown>
}

export function useListKeyboard({
  onKeyDown,
  store: storeProp,
}: UseListKeyboardOptions): React.KeyboardEventHandler<HTMLDivElement> {
  const context = React.useContext(ListContext)
  const store = context?.store ?? storeProp
  if (!store) throw new Error('List components must be used within a List.Root')

  return React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event)
      if (event.defaultPrevented) return
      if (event.nativeEvent.isComposing || event.keyCode === 229) return

      const command = event.metaKey || event.ctrlKey
      const modified = command || event.altKey
      const mode = store.selection.context.mode
      const cursor = store.collection.state.highlightedId
      const move = (direction: 'next' | 'prev' | 'first' | 'last') => {
        const key = store.moveKeyboard(direction)
        if (key === null) return
        if (event.shiftKey && (direction === 'next' || direction === 'prev')) {
          if (store.selection.state.anchorKey === null)
            store.selection.set(cursor === null ? [key] : [cursor])
          store.selection.extendRange(key)
          if (mode !== 'none') store.setMultiSelectActive(true)
        } else if (
          store.props.selectionFollowsFocus &&
          !store.multiSelectActive &&
          mode !== 'none'
        ) {
          store.select([key])
        }
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          move('next')
          return
        case 'ArrowUp':
          event.preventDefault()
          move('prev')
          return
        case 'j':
          if (modified) return
          event.preventDefault()
          move('next')
          return
        case 'k':
          if (modified) return
          event.preventDefault()
          move('prev')
          return
        case 'x':
          if (modified) return
          event.preventDefault()
          if (
            cursor !== null &&
            store.collection.getVisibleItemIds().includes(cursor)
          ) {
            store.selection.toggle(cursor)
            if (mode !== 'none') store.setMultiSelectActive(true)
            store.moveKeyboard('next')
          }
          return
        case 'a':
          if (!command || event.altKey) return
          event.preventDefault()
          if (mode === 'multiple') {
            store.selection.selectAll()
            store.setMultiSelectActive(true)
          }
          return
        case 'Escape':
          event.preventDefault()
          store.clearSelection()
          return
        case 'Enter':
          event.preventDefault()
          if (
            cursor !== null &&
            store.collection.getVisibleItemIds().includes(cursor)
          ) {
            const actionStore = store as typeof store & {
              onAction?: (
                key: Key,
                details: { method: 'keyboard'; event: KeyboardEvent },
              ) => void
            }
            actionStore.onAction?.(cursor, {
              method: 'keyboard',
              event: event.nativeEvent,
            })
          }
          return
        case 'Home':
          event.preventDefault()
          move('first')
          return
        case 'End':
          event.preventDefault()
          move('last')
          return
        default:
          return
      }
    },
    [onKeyDown, store],
  )
}
