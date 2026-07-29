'use client'

import {
  defaultRangeExtractor,
  type Range,
  useVirtualizer,
} from '@tanstack/react-virtual'
import * as React from 'react'
import type { Key, ListStore } from '../store/use-list-store.js'

export interface UseListVirtualizerOptions {
  estimateSize?: (index: number) => number
  overscan?: number
  includeGroupHeaders?: boolean
}

export interface ListVirtualizer {
  virtualRows: readonly {
    key: Key
    kind: 'row' | 'group-header'
    index: number
    start: number
  }[]
  spacerTop: number
  spacerBottom: number
  scrollContainerRef: React.RefObject<HTMLElement | null>
  /** Consumer must set `data-index={virtualRow.index}` on every measured row/header before passing the element. */
  measureRow: (el: HTMLElement | null) => void
}

type SourceRow = { key: Key; kind: 'row' } | { key: Key; kind: 'group-header' }

function internalKey(row: SourceRow): string {
  const key = String(row.key)
  return `${row.kind === 'row' ? 'r' : 'h'}:${key.length}:${key}`
}

function makeSourceRows(
  store: ListStore<unknown>,
  includeGroupHeaders: boolean,
): SourceRow[] {
  const rows: SourceRow[] = []
  const emittedGroups = new Set<string>()
  const visibleSet = new Set(store.meta.visibleKeys)
  for (const key of store.meta.keys) {
    const group = store.meta.groupOf.get(key)
    if (
      includeGroupHeaders &&
      group !== undefined &&
      !emittedGroups.has(group)
    ) {
      emittedGroups.add(group)
      rows.push({ key: group, kind: 'group-header' })
    }
    if (visibleSet.has(key)) rows.push({ key, kind: 'row' })
  }
  return rows
}

/**
 * Creates offset-spacer virtualization for a list.
 * Consumers must set `data-index={virtualRow.index}` on every measured row/header
 * before passing the element to `measureRow`.
 */
export function useListVirtualizer<T>(
  store: ListStore<T>,
  options: UseListVirtualizerOptions = {},
): ListVirtualizer {
  /** Consumer must set `data-index={virtualRow.index}` on every measured row/header before passing the element. */
  const metaVersion = store.metaStore.useState('version')
  const includeGroupHeaders = options.includeGroupHeaders ?? true
  // biome-ignore lint/correctness/useExhaustiveDependencies: metaVersion is the invalidation key for the non-reactive `store.meta` snapshot read inside makeSourceRows.
  const rows = React.useMemo(
    () => makeSourceRows(store as ListStore<unknown>, includeGroupHeaders),
    [store, metaVersion, includeGroupHeaders],
  )
  const scrollContainerRef = React.useRef<HTMLElement | null>(null)
  const { headerIndexesByGroup, groupByKey } = React.useMemo(() => {
    const headerIndexesByGroup = new Map<string, number>()
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]
      if (row?.kind === 'group-header')
        headerIndexesByGroup.set(String(row.key), index)
    }
    return { headerIndexesByGroup, groupByKey: store.meta.groupOf }
  }, [rows, store.meta.groupOf])
  const activeHeaderIndexRef = React.useRef<number | null>(null)
  const injectedHeaderRef = React.useRef(false)
  const rangeExtractor = React.useCallback(
    (range: Range) => {
      const indexes = new Set(defaultRangeExtractor(range))
      const rangeStart = rows[range.startIndex]
      if (rangeStart?.kind === 'group-header') {
        activeHeaderIndexRef.current = range.startIndex
        injectedHeaderRef.current = false
        return [...indexes].sort((a, b) => a - b)
      }
      let firstRow: SourceRow | undefined
      for (let index = range.startIndex; index <= range.endIndex; index++) {
        if (rows[index]?.kind === 'row') {
          firstRow = rows[index]
          break
        }
      }
      if (!firstRow) {
        for (let index = range.startIndex - 1; index >= 0; index--) {
          if (rows[index]?.kind === 'row') {
            firstRow = rows[index]
            break
          }
        }
      }
      const group = firstRow ? groupByKey.get(firstRow.key) : undefined
      const headerIndex =
        group === undefined ? undefined : headerIndexesByGroup.get(group)
      const injected = headerIndex !== undefined && !indexes.has(headerIndex)
      activeHeaderIndexRef.current = headerIndex ?? null
      injectedHeaderRef.current = injected
      if (injected && headerIndex !== undefined) indexes.add(headerIndex)
      return [...indexes].sort((a, b) => a - b)
    },
    [groupByKey, headerIndexesByGroup, rows],
  )
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: options.estimateSize ?? (() => 40),
    overscan: options.overscan ?? 10,
    getItemKey: (index) => internalKey(rows[index] as SourceRow),
    rangeExtractor,
    useFlushSync: false,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const activeHeaderIndex = activeHeaderIndexRef.current
  const activeHeaderItem =
    activeHeaderIndex === null
      ? undefined
      : virtualItems.find((item) => item.index === activeHeaderIndex)
  const inferredInjected =
    activeHeaderItem !== undefined &&
    virtualItems[0] === activeHeaderItem &&
    virtualItems[1] !== undefined &&
    virtualItems[1].index !== activeHeaderItem.index + 1
  const injectedHeader =
    (injectedHeaderRef.current || inferredInjected) && activeHeaderItem
      ? activeHeaderItem
      : undefined
  const normalItems = injectedHeader
    ? virtualItems.filter((item) => item !== injectedHeader)
    : virtualItems
  const normalFirst = normalItems[0]
  const adjustedHeaderStart = injectedHeader
    ? Math.max(
        0,
        (normalFirst?.start ?? injectedHeader.start) - injectedHeader.size,
      )
    : undefined
  const virtualRows = virtualItems
    .slice()
    .sort((a, b) => {
      if (injectedHeader && a === injectedHeader) return -1
      if (injectedHeader && b === injectedHeader) return 1
      return a.index - b.index
    })
    .map((item) => {
      const row = rows[item.index] as SourceRow
      return {
        key: row.key,
        kind: row.kind,
        index: item.index,
        start:
          item === injectedHeader
            ? (adjustedHeaderStart ?? item.start)
            : item.start,
      }
    })
  const first = injectedHeader ?? normalFirst
  const last = normalItems[normalItems.length - 1]

  const fullItems = React.useMemo(
    () =>
      rows
        .filter((row): row is { key: Key; kind: 'row' } => row.kind === 'row')
        .map((row) => ({
          value: row.key,
          disabled: store.meta.disabledKeys.has(row.key),
        })),
    [rows, store.meta.disabledKeys],
  )
  const fullIndexByKey = React.useMemo(
    () =>
      new Map(
        rows
          .filter((row): row is { key: Key; kind: 'row' } => row.kind === 'row')
          .map((row) => [row.key, rows.indexOf(row)]),
      ),
    [rows],
  )
  const scrollToIndexRef = React.useRef(virtualizer.scrollToIndex)
  scrollToIndexRef.current = virtualizer.scrollToIndex
  React.useLayoutEffect(() => {
    const collection = store.collection
    const previous = collection.context.onHighlightChange
    collection.setVirtualized(true)
    collection.setVirtualItems(fullItems)
    collection.setOnHighlightChange((id, _index, details) => {
      if (details.reason !== 'keyboard' || id === null) return
      const fullIndex = fullIndexByKey.get(id)
      if (fullIndex === undefined) return
      queueMicrotask(() =>
        scrollToIndexRef.current(fullIndex, { align: 'auto' }),
      )
    })
    return () => {
      collection.setVirtualized(false)
      collection.setVirtualItems([])
      collection.setOnHighlightChange(previous)
    }
  }, [fullIndexByKey, fullItems, store])

  return {
    virtualRows,
    spacerTop: adjustedHeaderStart ?? first?.start ?? 0,
    spacerBottom: Math.max(
      0,
      virtualizer.getTotalSize() - (last ? last.start + last.size : 0),
    ),
    scrollContainerRef,
    measureRow: virtualizer.measureElement,
  }
}
