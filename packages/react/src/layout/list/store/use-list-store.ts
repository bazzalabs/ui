'use client'

import { useRefWithInit } from '@base-ui/utils/useRefWithInit'
import * as React from 'react'
import { ListboxStore } from '../../../internal/listbox/store/ListboxStore.js'
import {
  type Key,
  type SelectionChangeDetails,
  type SelectionMode,
  SelectionStore,
} from '../../../internal/selection/store/SelectionStore.js'

export interface ActivationDetails {
  method: 'keyboard' | 'pointer'
  event: KeyboardEvent | MouseEvent
}

export interface UseListStoreOptions<T> {
  items: readonly T[]
  getKey: (item: T) => Key
  isDisabled?: (item: T) => boolean
  selectionMode?: SelectionMode
  defaultSelectedKeys?: Iterable<Key>
  selectedKeys?: Iterable<Key>
  onSelectionChange?: (
    keys: ReadonlySet<Key>,
    details: SelectionChangeDetails,
  ) => void
  selectionFollowsFocus?: boolean
  focusMode?: 'roving' | 'virtual'
  onAction?: (key: Key, details: ActivationDetails) => void
}

export interface ListStore<_T> {
  readonly collection: ListboxStore
  readonly selection: SelectionStore
  readonly selectedKeys: ReadonlySet<Key>
  readonly keyboardActiveKey: Key | null
  readonly meta: { keys: readonly Key[]; disabledKeys: ReadonlySet<Key> }
  /** Render-time snapshot of hook options for the component layer. Do not read from event handlers; use `selection.context.mode`. */
  readonly props: { selectionMode: SelectionMode; empty: boolean }
  select: SelectionStore['set']
  clearSelection(): void
  setKeyboardActive(key: Key): void
  scrollToKey(key: Key): void
}

function sameKeys(
  a: Iterable<Key> | undefined,
  b: Iterable<Key> | undefined,
): boolean {
  if (a === undefined || b === undefined) return a === b
  const left = [...a]
  const right = [...b]
  return (
    left.length === right.length &&
    left.every((key, index) => key === right[index])
  )
}

export function useListStore<T>(options: UseListStoreOptions<T>): ListStore<T> {
  const selectionMode = options.selectionMode ?? 'none'
  const selectedKeysProp =
    options.selectedKeys === undefined ? undefined : [...options.selectedKeys]
  const keys = React.useMemo(
    () => options.items.map(options.getKey),
    [options.items, options.getKey],
  )
  const disabledKeys = React.useMemo(
    () =>
      new Set(
        options.items
          .filter((item) => options.isDisabled?.(item) ?? false)
          .map(options.getKey),
      ),
    [options.items, options.getKey, options.isDisabled],
  )
  const metaRef = useRefWithInit(() => ({
    keys,
    disabledKeys,
  }))
  const meta = metaRef.current
  const onSelectionChangeRef = React.useRef(options.onSelectionChange)
  const onActionRef = React.useRef(options.onAction)

  const collection = useRefWithInit(
    () =>
      new ListboxStore(
        { open: true, virtualized: false },
        {
          filter: false,
          loop: false,
          autoHighlightFirst: false,
          clearSearchOnClose: false,
          orderedItems: keys,
        },
      ),
  ).current
  const selection = useRefWithInit(
    () =>
      new SelectionStore(
        {
          selectedKeys: new Set(options.defaultSelectedKeys),
          selectedKeysProp:
            selectedKeysProp === undefined
              ? undefined
              : new Set(selectedKeysProp),
          orderedKeys: keys,
          disabledKeys,
        },
        {
          mode: selectionMode,
          onSelectionChange: (next, details) =>
            onSelectionChangeRef.current?.(next, details),
        },
      ),
  ).current

  const selectedKeys = selection.useState('selectedKeys')
  const highlightedId = collection.useState('highlightedId')
  const highlightSource = collection.useState('highlightSource')
  const selectedKeysRef = React.useRef(selectedKeys)
  const highlightedIdRef = React.useRef(highlightedId)
  const highlightSourceRef = React.useRef(highlightSource)
  selectedKeysRef.current = selectedKeys
  highlightedIdRef.current = highlightedId
  highlightSourceRef.current = highlightSource
  const syncedKeysRef = React.useRef<readonly Key[] | null>(null)
  const syncedDisabledRef = React.useRef<ReadonlySet<Key> | null>(null)

  const store = useRefWithInit(() => {
    const value = {} as ListStore<T>
    Object.defineProperties(value, {
      collection: { value: collection, enumerable: true },
      selection: { value: selection, enumerable: true },
      selectedKeys: { get: () => selectedKeysRef.current, enumerable: true },
      keyboardActiveKey: {
        get: () =>
          highlightSourceRef.current === 'keyboard'
            ? highlightedIdRef.current
            : null,
        enumerable: true,
      },
      meta: { value: meta, enumerable: true },
      props: {
        value: { selectionMode, empty: keys.length === 0 },
        enumerable: true,
      },
      select: { value: selection.set.bind(selection), enumerable: true },
      clearSelection: { value: () => selection.clear(), enumerable: true },
      setKeyboardActive: {
        value: (key: Key) => collection.setHighlightedId(key, 'keyboard'),
        enumerable: true,
      },
      scrollToKey: {
        value: (key: Key) => {
          try {
            collection.context.refs.itemRefs.get(key)?.current?.scrollIntoView({
              block: 'nearest',
            })
          } catch {}
        },
        enumerable: true,
      },
    })
    return value
  }).current

  // This render-time bag is updated before Root and Row render. It is only for
  // the component render path; event handlers use the committed selection mode.
  store.props.selectionMode = selectionMode
  store.props.empty = keys.length === 0

  React.useLayoutEffect(() => {
    onSelectionChangeRef.current = options.onSelectionChange
    onActionRef.current = options.onAction
    ;(store as ListStore<T> & { onAction?: typeof options.onAction }).onAction =
      onActionRef.current
  })

  React.useLayoutEffect(() => {
    selection.setMode(selectionMode)
    if (!sameKeys(selection.state.selectedKeysProp, selectedKeysProp))
      selection.setSelectedKeysProp(selectedKeysProp)
    const keysChanged =
      !sameKeys(syncedKeysRef.current ?? undefined, keys) ||
      !sameKeys(syncedDisabledRef.current ?? undefined, disabledKeys)
    if (keysChanged) {
      meta.keys = keys
      meta.disabledKeys = disabledKeys
      collection.setOrderedItems(keys, { reason: 'append' })
      if (collection.state.highlightSource === 'auto')
        collection.clearHighlight()
      selection.setOrderedKeys(keys, disabledKeys)
      syncedKeysRef.current = keys
      syncedDisabledRef.current = disabledKeys
    }
  }, [
    collection,
    disabledKeys,
    keys,
    meta,
    selectedKeysProp,
    selection,
    selectionMode,
  ])

  return store
}

export type { Key, SelectionChangeDetails, SelectionMode }
