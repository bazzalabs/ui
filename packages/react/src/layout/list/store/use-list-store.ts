'use client'

import { createSelector, ReactStore } from '@base-ui/utils/store'
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
  getGroupId?: (item: T) => string | undefined
  defaultCollapsedGroups?: Iterable<string>
  collapsedGroups?: Iterable<string>
  onCollapsedGroupsChange?: (groups: ReadonlySet<string>) => void
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
  readonly meta: {
    keys: readonly Key[]
    disabledKeys: ReadonlySet<Key>
    visibleKeys: readonly Key[]
    getGroupId?: (item: unknown) => string | undefined
    groupOf: ReadonlyMap<Key, string>
    collapsedGroups: ReadonlySet<string>
  }
  readonly collapsedGroups: ReadonlySet<string>
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
  toggleGroup(id: string): void
  setGroupCollapsed(id: string, collapsed: boolean): void
  /** Internal render subscription for grouped list parts. */
  readonly collapseStore: {
    useState(key: 'collapsedGroups'): ReadonlySet<string>
  }
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

function sameGroupOf(
  a: ReadonlyMap<Key, string> | null | undefined,
  b: ReadonlyMap<Key, string>,
): boolean {
  if (!a || a.size !== b.size) return false
  for (const [key, groupId] of b) {
    if (a.get(key) !== groupId) return false
  }
  return true
}

function sameStringSet(a: Iterable<string>, b: Iterable<string>): boolean {
  const left = new Set(a)
  const right = new Set(b)
  if (left.size !== right.size) return false
  for (const value of left) if (!right.has(value)) return false
  return true
}

interface CollapseState {
  collapsedGroups: ReadonlySet<string>
}

const collapseSelectors = {
  collapsedGroups: createSelector(
    (state: CollapseState) => state.collapsedGroups,
  ),
}

class CollapseStore extends ReactStore<
  CollapseState,
  Record<string, never>,
  typeof collapseSelectors
> {
  constructor(initial: Iterable<string>) {
    super({ collapsedGroups: new Set(initial) }, {}, collapseSelectors)
  }
}

export function useListStore<T>(options: UseListStoreOptions<T>): ListStore<T> {
  const selectionMode = options.selectionMode ?? 'none'
  const selectionFollowsFocus = options.selectionFollowsFocus ?? true
  const focusMode = options.focusMode ?? 'roving'
  const selectedKeysProp =
    options.selectedKeys === undefined ? undefined : [...options.selectedKeys]
  const collapsedGroupsProp =
    options.collapsedGroups === undefined
      ? undefined
      : new Set(options.collapsedGroups)
  const collapseStore = useRefWithInit(
    () =>
      new CollapseStore(
        collapsedGroupsProp ?? new Set(options.defaultCollapsedGroups),
      ),
  ).current
  const collapsedGroupsSnapshot = collapseStore.useState('collapsedGroups')
  const effectiveCollapsedGroups =
    collapsedGroupsProp ?? collapsedGroupsSnapshot
  const controlledCollapsedGroupsRef = React.useRef(
    collapsedGroupsProp !== undefined,
  )
  const controlledCollapsedGroupsValueRef = React.useRef(collapsedGroupsProp)
  controlledCollapsedGroupsRef.current = collapsedGroupsProp !== undefined
  const pendingCollapsedGroupsRef = React.useRef<ReadonlySet<string>>(
    effectiveCollapsedGroups,
  )
  const keys = React.useMemo(
    () => options.items.map(options.getKey),
    [options.items, options.getKey],
  )
  const groupOf = React.useMemo(() => {
    const result = new Map<Key, string>()
    if (options.getGroupId) {
      for (const item of options.items) {
        const groupId = options.getGroupId(item)
        if (groupId !== undefined) result.set(options.getKey(item), groupId)
      }
    }
    return result
  }, [options.getGroupId, options.getKey, options.items])
  const visibleKeys = React.useMemo(
    () =>
      keys.filter(
        (key) =>
          !(
            groupOf.has(key) &&
            effectiveCollapsedGroups.has(groupOf.get(key) as string)
          ),
      ),
    [effectiveCollapsedGroups, groupOf, keys],
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
    visibleKeys.find((key) => !renderDisabledKeys.has(key)) ?? null
  const metaRef = useRefWithInit(() => ({
    keys,
    disabledKeys,
    visibleKeys,
    getGroupId: options.getGroupId as
      | ((item: unknown) => string | undefined)
      | undefined,
    groupOf,
    collapsedGroups: effectiveCollapsedGroups,
  }))
  const meta = metaRef.current
  const onSelectionChangeRef = React.useRef(options.onSelectionChange)
  const onActionRef = React.useRef(options.onAction)
  const onCollapsedGroupsChangeRef = React.useRef(
    options.onCollapsedGroupsChange,
  )
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
          orderedItems: visibleKeys,
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
  const collapsedGroupsRef = React.useRef<ReadonlySet<string>>(
    effectiveCollapsedGroups,
  )
  collapsedGroupsRef.current = effectiveCollapsedGroups
  selectedKeysRef.current = selectedKeys
  highlightedIdRef.current = highlightedId
  highlightSourceRef.current = highlightSource
  const syncedKeysRef = React.useRef<readonly Key[] | null>(null)
  const syncedDisabledRef = React.useRef<ReadonlySet<Key> | null>(null)
  const syncedGroupOfRef = React.useRef<ReadonlyMap<Key, string> | null>(null)
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
      collapseStore: {
        value: collapseStore,
        enumerable: true,
      },
      collapsedGroups: {
        get: () => collapsedGroupsRef.current,
        enumerable: true,
      },
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
      toggleGroup: {
        value: (id: string) => {
          ;(value as ListStore<T>).setGroupCollapsed(
            id,
            !pendingCollapsedGroupsRef.current.has(id),
          )
        },
        enumerable: true,
      },
      setGroupCollapsed: {
        value: (id: string, collapsed: boolean) => {
          const current = controlledCollapsedGroupsRef.current
            ? pendingCollapsedGroupsRef.current
            : collapseStore.state.collapsedGroups
          if (current.has(id) === collapsed) return
          const next = new Set(current)
          if (collapsed) next.add(id)
          else next.delete(id)
          pendingCollapsedGroupsRef.current = next
          onCollapsedGroupsChangeRef.current?.(next)
          if (controlledCollapsedGroupsRef.current) {
            queueMicrotask(() => {
              pendingCollapsedGroupsRef.current =
                controlledCollapsedGroupsValueRef.current ??
                collapseStore.state.collapsedGroups
            })
          } else {
            collapseStore.set('collapsedGroups', next)
          }
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
    onCollapsedGroupsChangeRef.current = options.onCollapsedGroupsChange
    ;(store as ListStore<T> & { onAction?: typeof options.onAction }).onAction =
      onActionRef.current
  })

  React.useLayoutEffect(() => {
    controlledCollapsedGroupsValueRef.current = collapsedGroupsProp
    if (
      !sameStringSet(
        collapseStore.state.collapsedGroups,
        effectiveCollapsedGroups,
      )
    )
      collapseStore.set('collapsedGroups', effectiveCollapsedGroups)
    pendingCollapsedGroupsRef.current = effectiveCollapsedGroups
  }, [collapseStore, collapsedGroupsProp, effectiveCollapsedGroups])

  React.useLayoutEffect(() => {
    selection.setMode(selectionMode)
    if (!sameKeys(selection.state.selectedKeysProp, selectedKeysProp))
      selection.setSelectedKeysProp(selectedKeysProp)
    const keysChanged =
      !sameKeys(syncedKeysRef.current ?? undefined, keys) ||
      !sameKeys(syncedDisabledRef.current ?? undefined, disabledKeys)
    const visibleChanged = !sameKeys(meta.visibleKeys, visibleKeys)
    const collapsedChanged = !sameKeys(
      meta.collapsedGroups,
      effectiveCollapsedGroups,
    )
    const groupOfChanged = !sameGroupOf(syncedGroupOfRef.current, groupOf)
    if (keysChanged || visibleChanged || collapsedChanged || groupOfChanged) {
      meta.keys = keys
      meta.disabledKeys = disabledKeys
      meta.visibleKeys = visibleKeys
      meta.groupOf = groupOf
      meta.collapsedGroups = effectiveCollapsedGroups
      collection.setOrderedItems(visibleKeys, { reason: 'append' })
      if (
        collection.state.highlightedId !== null &&
        !visibleKeys.includes(collection.state.highlightedId)
      )
        collection.clearHighlight()
      else if (collection.state.highlightSource === 'auto')
        collection.clearHighlight()
      selection.setOrderedKeys(keys, getSelectionDisabledKeys(disabledKeys))
      syncedKeysRef.current = keys
      syncedDisabledRef.current = disabledKeys
      syncedGroupOfRef.current = groupOf
    }
  }, [
    collection,
    disabledKeys,
    keys,
    visibleKeys,
    effectiveCollapsedGroups,
    groupOf,
    meta,
    selectedKeysProp,
    selection,
    selectionMode,
    getSelectionDisabledKeys,
  ])

  React.useLayoutEffect(() => {
    meta.getGroupId = options.getGroupId as
      | ((item: unknown) => string | undefined)
      | undefined
  }, [meta, options.getGroupId])

  return store
}

export type { Key, SelectionChangeDetails, SelectionMode }
