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
  readonly props: {
    selectionMode: SelectionMode
    empty: boolean
    selectionFollowsFocus: boolean
    focusMode: 'roving' | 'virtual'
    disabledKeys: ReadonlySet<Key>
    firstNavigableKey: Key | null
  }
  select: SelectionStore['set']
  clearSelection(): void
  setKeyboardActive(key: Key): void
  registerRowDisabled(key: Key, disabled: boolean): () => void
  moveKeyboard(direction: 'next' | 'prev' | 'first' | 'last'): Key | null
  setMultiSelectActive(active: boolean): void
  readonly multiSelectActive: boolean
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
  const selectionFollowsFocus = options.selectionFollowsFocus ?? true
  const focusMode = options.focusMode ?? 'roving'
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
  const rowDisabledKeysRef = React.useRef(new Map<Key, true>())
  const [, bumpRowDisabledVersion] = React.useReducer((n) => n + 1, 0)
  const renderDisabledKeys = new Set([
    ...disabledKeys,
    ...rowDisabledKeysRef.current.keys(),
  ])
  const firstNavigableKey =
    keys.find((key) => !renderDisabledKeys.has(key)) ?? null
  const metaRef = useRefWithInit(() => ({
    keys,
    disabledKeys,
  }))
  const meta = metaRef.current
  const onSelectionChangeRef = React.useRef(options.onSelectionChange)
  const onActionRef = React.useRef(options.onAction)
  const multiSelectActiveRef = React.useRef(false)

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
  const selection = useRefWithInit(() => {
    const value = new SelectionStore(
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
        onSelectionChange: (next, details) => {
          if (details.type === 'clear' || details.type === 'set')
            multiSelectActiveRef.current = false
          onSelectionChangeRef.current?.(next, details)
        },
      },
    )
    const originalSet = value.set.bind(value)
    const originalClear = value.clear.bind(value)
    value.set = ((...args: never[]) => {
      if (args.length === 1) multiSelectActiveRef.current = false
      ;(originalSet as (...args: never[]) => void)(...args)
    }) as SelectionStore['set']
    value.clear = (() => {
      multiSelectActiveRef.current = false
      originalClear()
    }) as SelectionStore['clear']
    return value
  }).current

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
  const getSelectionDisabledKeys = React.useCallback(
    (syncedDisabled: ReadonlySet<Key>) =>
      new Set([...syncedDisabled, ...rowDisabledKeysRef.current.keys()]),
    [],
  )

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
        value: {
          selectionMode,
          empty: keys.length === 0,
          selectionFollowsFocus,
          focusMode,
          disabledKeys: renderDisabledKeys,
          firstNavigableKey,
        },
        enumerable: true,
      },
      select: {
        value: (keys: Iterable<Key>) => {
          multiSelectActiveRef.current = false
          selection.set(keys)
        },
        enumerable: true,
      },
      clearSelection: {
        value: () => {
          multiSelectActiveRef.current = false
          selection.clear()
        },
        enumerable: true,
      },
      setKeyboardActive: {
        value: (key: Key) => {
          if (
            collection.state.highlightedId === key &&
            collection.state.highlightSource !== 'keyboard'
          ) {
            collection.clearHighlight()
          }
          collection.setHighlightedId(key, 'keyboard')
        },
        enumerable: true,
      },
      registerRowDisabled: {
        value: (key: Key, disabled: boolean) => {
          const wasDisabled = rowDisabledKeysRef.current.has(key)
          const added = disabled && !wasDisabled
          if (disabled !== wasDisabled) {
            if (disabled) rowDisabledKeysRef.current.set(key, true)
            else rowDisabledKeysRef.current.delete(key)
            bumpRowDisabledVersion()
          }
          const syncedDisabled = syncedDisabledRef.current ?? disabledKeys
          selection.setOrderedKeys(
            meta.keys,
            getSelectionDisabledKeys(syncedDisabled),
          )
          return () => {
            if (added && rowDisabledKeysRef.current.delete(key)) {
              bumpRowDisabledVersion()
              const currentDisabled = syncedDisabledRef.current ?? disabledKeys
              selection.setOrderedKeys(
                meta.keys,
                getSelectionDisabledKeys(currentDisabled),
              )
            }
          }
        },
        enumerable: true,
      },
      moveKeyboard: {
        value: (direction: 'next' | 'prev' | 'first' | 'last') => {
          const visibleIds = collection.getVisibleItemIds()
          if (visibleIds.length === 0) return null
          const current = collection.state.highlightedId
          const currentIndex =
            current !== null ? visibleIds.indexOf(current) : -1
          let index: number
          if (direction === 'first') index = 0
          else if (direction === 'last') index = visibleIds.length - 1
          else if (direction === 'next')
            index = Math.min(currentIndex + 1, visibleIds.length - 1)
          else
            index =
              currentIndex < 0
                ? visibleIds.length - 1
                : Math.max(currentIndex - 1, 0)
          const key = visibleIds[index]
          if (key !== undefined) {
            ;(value as ListStore<T>).setKeyboardActive(key)
            return key
          }
          return null
        },
        enumerable: true,
      },
      setMultiSelectActive: {
        value: (active: boolean) => {
          multiSelectActiveRef.current = active
        },
        enumerable: true,
      },
      multiSelectActive: {
        get: () => multiSelectActiveRef.current,
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
  store.props.selectionFollowsFocus = selectionFollowsFocus
  store.props.focusMode = focusMode
  store.props.disabledKeys = renderDisabledKeys
  store.props.firstNavigableKey = firstNavigableKey

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
      selection.setOrderedKeys(keys, getSelectionDisabledKeys(disabledKeys))
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
    getSelectionDisabledKeys,
  ])

  return store
}

export type { Key, SelectionChangeDetails, SelectionMode }
