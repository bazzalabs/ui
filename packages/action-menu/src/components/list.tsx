import { useVirtualizer } from '@tanstack/react-virtual'
import * as React from 'react'
import { flat, isShallowEqual, partition, pipe, prop, sortBy } from 'remeda'
import {
  useDisplayMode,
  useFocusOwner,
  useScopedTheme,
  useSurfaceId,
} from '../contexts/index.js'
import { ScopedThemeProvider } from '../contexts/theme-context.js'
import { useNavKeydown } from '../hooks/use-nav-keydown.js'
import { useStickyRowWidth } from '../hooks/use-sticky-row-width.js'
import { useSurfaceSel } from '../hooks/use-surface-sel.js'
import { commandScore } from '../lib/command-score.js'
import { instantiateSingleNode } from '../lib/menu-utils.js'
import { mergeProps } from '../lib/merge-props.js'
import { isElementWithProp } from '../lib/react-utils.js'
import type {
  AfterFilterContext,
  BeforeFilterContext,
  SearchResult,
  TransformNodesContext,
} from '../middleware/types.js'
import type {
  GroupHeadingBindAPI,
  GroupNode,
  ItemNode,
  ListBindAPI,
  Menu,
  MenuNodeDefaults,
  Node,
  SubmenuNode,
  SurfaceStore,
} from '../types.js'
import { Item } from './item.js'
import { Sub } from './submenu.js'
import { SubmenuContent } from './submenu-content.js'
import { SubmenuTrigger } from './submenu-trigger.js'

interface ListProps<T> {
  store: SurfaceStore<T>
  menu: Menu<T>
  defaults?: Partial<MenuNodeDefaults<T>>
  query?: string
  inputActive: boolean
  onTypeStart: (seed: string) => void
}

/**
 * Wrapper component that handles loading/error states before rendering the main list.
 * This ensures we don't violate React's Rules of Hooks by returning early before
 * all hooks in ListContent are called.
 */
export function List<T = unknown>(props: ListProps<T>) {
  const { slots } = useScopedTheme<T>()
  const { menu, query } = props

  // Handle loading state
  // Show loading when:
  // 1. Initial load without data (nodes.length === 0)
  // 2. Deep search with eager loading (query exists, indicating deep search is active)
  const shouldShowLoading =
    menu.loadingState?.isLoading &&
    (menu.nodes.length === 0 || (query && query.trim().length > 0))

  if (shouldShowLoading) {
    const LoadingSlot = slots.Loading
    if (LoadingSlot) {
      return LoadingSlot({
        menu,
        isFetching: menu.loadingState?.isFetching,
        progress: menu.loadingState?.progress,
        query,
      }) as React.ReactElement
    }
    return null
  }

  // Handle error state
  if (menu.loadingState?.isError) {
    const ErrorSlot = slots.Error
    if (ErrorSlot) {
      return ErrorSlot({
        menu,
        error: menu.loadingState.error ?? undefined,
      }) as React.ReactElement
    }
    return null
  }

  return <ListContent {...props} />
}

/**
 * Main list component with all hooks called unconditionally.
 * This component is only rendered when we're not in loading/error states.
 */
function ListContent<T = unknown>({
  store,
  menu,
  defaults,
  query,
  inputActive,
  onTypeStart,
}: ListProps<T>) {
  const { slots, slotProps, classNames } = useScopedTheme<T>()

  const localId = React.useId()
  const listId = useSurfaceSel(store, (s) => s.listId)
  const hasInput = useSurfaceSel(store, (s) => s.hasInput)
  const activeId = useSurfaceSel(store, (s) => s.activeId ?? undefined)
  const navKeydown = useNavKeydown('list')
  const { ownerId } = useFocusOwner()
  const surfaceId = useSurfaceId() ?? 'root'
  const mode = useDisplayMode()

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (ownerId !== surfaceId) return
      if (!inputActive && !e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === 'Backspace') {
          e.preventDefault()
          onTypeStart('')
          return
        }
        if (e.key.length === 1) {
          e.preventDefault()
          onTypeStart(e.key)
          return
        }
      }
      navKeydown(e)
    },
    [surfaceId, ownerId, inputActive, onTypeStart, navKeydown],
  )

  React.useEffect(() => {
    const id = listId ?? `action-menu-list-${localId}`
    store.set('listId', id)
    return () => store.set('listId', null)
  }, [localId])

  const effectiveListId =
    store.snapshot().listId ?? `action-menu-list-${localId}`
  const q = (query ?? '').trim()

  // Normalize minLength configuration
  const minLengthConfig = React.useMemo(() => {
    const raw = menu.search?.minLength
    if (raw === undefined) return { local: 0, deep: 0 }
    if (typeof raw === 'number') return { local: 0, deep: raw }
    return { local: raw.local ?? 0, deep: raw.deep ?? 0 }
  }, [menu.search?.minLength])

  // Apply minLength.local threshold - only perform local search if query meets minimum length
  const effectiveLocalQuery = React.useMemo(() => {
    return q.length >= minLengthConfig.local ? q : ''
  }, [q, minLengthConfig.local])

  // Apply minLength.deep threshold - only perform deep search if query meets minimum length
  const effectiveDeepQuery = React.useMemo(() => {
    return q.length >= minLengthConfig.deep ? q : ''
  }, [q, minLengthConfig.deep])

  type SRContext = {
    breadcrumbs: string[]
    breadcrumbIds: string[]
    score: number
  }

  type SRItem = SRContext & {
    type: 'item'
    node: ItemNode<T>
  }
  type SRSub = SRContext & {
    type: 'submenu'
    node: SubmenuNode<any>
  }

  type SR = SRItem | SRSub

  // Apply beforeFilter middleware (pre-filter nodes before search)
  const processedNodes = React.useMemo(() => {
    if (!menu.middleware?.beforeFilter) {
      return menu.nodes
    }

    try {
      const context: BeforeFilterContext<T> = {
        nodes: menu.nodes,
        query: effectiveLocalQuery,
        menu,
      }
      return menu.middleware.beforeFilter(context)
    } catch (error) {
      console.error('[ActionMenu] Error in beforeFilter middleware:', error)
      return menu.nodes
    }
  }, [menu.nodes, menu.middleware, effectiveLocalQuery, menu])

  const collect = React.useCallback(
    (
      nodes: Node<T>[] | undefined,
      localQuery: string,
      deepQuery: string,
      originalQuery: string,
      bc: string[] = [],
      bcIds: string[] = [],
      currentMenu: Menu<T> = menu,
      parentDeepThreshold: number = minLengthConfig.deep,
    ): SR[] => {
      const out: SR[] = []
      // Use localQuery for items/submenus at the current level (not deep)
      // Use deepQuery for recursing into submenus (deep search)
      const isDeepSearch = bc.length > 0
      const queryForCurrentLevel = isDeepSearch ? deepQuery : localQuery

      for (const n of nodes ?? []) {
        if ((n as any).hidden) continue
        if (n.kind === 'item') {
          const score = commandScore(n.id, queryForCurrentLevel, n.keywords)
          if (score > 0)
            out.push({
              type: 'item',
              node: {
                ...n,
                id: bcIds.at(-1) ? `${bcIds.at(-1)}-${n.id}` : n.id,
                parent: currentMenu,
              } as ItemNode<T>,
              breadcrumbs: bc,
              breadcrumbIds: bcIds,
              score,
            })
        } else if (n.kind === 'group') {
          out.push(
            ...collect(
              (n as GroupNode<T>).nodes,
              localQuery,
              deepQuery,
              originalQuery,
              bc,
              bcIds,
              currentMenu,
              parentDeepThreshold,
            ),
          )
        } else if (n.kind === 'submenu') {
          const sub = n as SubmenuNode<any>
          const score = commandScore(n.id, queryForCurrentLevel, n.keywords)
          if (score > 0)
            out.push({
              type: 'submenu',
              node: { ...sub, parent: currentMenu, def: sub.def },
              breadcrumbs: bc,
              breadcrumbIds: bcIds,
              score,
            })

          // deepSearch defaults to true, so only exclude if explicitly set to false
          if (sub.deepSearch) {
            // Check if this submenu has its own minLength config
            const submenuMinLength = (sub.child as Menu<any>)?.search?.minLength
            let effectiveDeepThreshold = parentDeepThreshold

            if (submenuMinLength !== undefined) {
              if (typeof submenuMinLength === 'number') {
                effectiveDeepThreshold = submenuMinLength
              } else {
                effectiveDeepThreshold = submenuMinLength.deep ?? 0
              }
            }

            // Only deep search if the ORIGINAL query meets the threshold
            // (we check originalQuery not deepQuery because deepQuery might be filtered)
            if (originalQuery.length >= effectiveDeepThreshold) {
              const title = sub.title ?? sub.label ?? sub.id ?? ''
              out.push(
                ...collect(
                  sub.nodes as any,
                  localQuery,
                  deepQuery,
                  originalQuery,
                  [...bc, title],
                  [...bcIds, sub.id],
                  sub.child as Menu<any>,
                  effectiveDeepThreshold,
                ),
              )
            }
          }
        }
      }
      return out
    },
    [minLengthConfig.deep],
  )

  const results = React.useMemo(() => {
    if (!effectiveLocalQuery) return []

    const searchMode = menu.search?.mode ?? 'client'

    // Server mode: Skip client-side filtering, use nodes as-is
    if (searchMode === 'server') {
      // Map nodes directly without scoring (server already filtered)
      const serverResults: SR[] = []
      for (const node of processedNodes) {
        if (node.kind === 'item') {
          serverResults.push({
            type: 'item',
            node: node as ItemNode<T>,
            breadcrumbs: [],
            breadcrumbIds: [],
            score: 1, // All server results have equal score
          })
        } else if (node.kind === 'submenu') {
          serverResults.push({
            type: 'submenu',
            node: node as SubmenuNode<any>,
            breadcrumbs: [],
            breadcrumbIds: [],
            score: 1,
          })
        }
      }
      return serverResults
    }

    // Client or hybrid mode: Apply client-side filtering
    return pipe(
      collect(
        processedNodes,
        effectiveLocalQuery,
        effectiveDeepQuery,
        q,
        [],
        [],
        menu,
      ),
      sortBy([prop('score'), 'desc']),
      partition((v) => v.type === 'submenu'),
      flat(),
    )
  }, [
    effectiveLocalQuery,
    effectiveDeepQuery,
    q,
    processedNodes,
    menu.search?.mode,
    collect,
    menu,
  ])

  // Apply afterFilter middleware (post-filter search results)
  const filteredResults = React.useMemo(() => {
    if (!menu.middleware?.afterFilter || !effectiveLocalQuery) {
      return results
    }

    try {
      const context: AfterFilterContext<T> = {
        results: results as SearchResult<T>[],
        query: effectiveLocalQuery,
        menu,
      }
      return menu.middleware.afterFilter(context) as SR[]
    } catch (error) {
      console.error('[ActionMenu] Error in afterFilter middleware:', error)
      return results
    }
  }, [results, menu.middleware, effectiveLocalQuery, menu])
  const flattenedNodes = React.useMemo(() => {
    const acc: Node<T>[] = []

    if (effectiveLocalQuery) {
      if (filteredResults.length === 0) return []
      for (const sr of filteredResults) {
        acc.push({
          ...sr.node,
          search: {
            query: effectiveLocalQuery,
            score: sr.score,
            isDeep: sr.breadcrumbs.length > 0,
            breadcrumbs: sr.breadcrumbs,
            breadcrumbIds: sr.breadcrumbIds,
          },
        })
      }
    } else {
      for (const node of processedNodes) {
        if (node.kind === 'item' || node.kind === 'submenu') {
          acc.push(node)
        } else if (node.kind === 'separator') {
          // Separators are always included in the flattened list
          acc.push(node)
        } else if (node.kind === 'group') {
          // Only push group node if it has a heading to render
          if (node.heading) acc.push(node)
          // Add child items with group position metadata
          const groupSize = node.nodes.length
          node.nodes.forEach((child: Node<T>, index: number) => {
            const groupPosition =
              groupSize === 1
                ? 'only'
                : index === 0
                  ? 'first'
                  : index === groupSize - 1
                    ? 'last'
                    : 'middle'
            acc.push({
              ...child,
              groupPosition,
              groupIndex: index,
              groupSize,
            } as Node<T>)
          })
        }
      }
    }

    return acc
  }, [effectiveLocalQuery, filteredResults, processedNodes])

  // Apply transformNodes middleware (transform flattened nodes before rendering)
  const transformedNodes = React.useMemo(() => {
    if (!menu.middleware?.transformNodes) {
      return flattenedNodes
    }

    try {
      const context: TransformNodesContext<T> = {
        nodes: flattenedNodes,
        query: q,
        mode: effectiveLocalQuery ? 'search' : 'browse',
        allNodes: menu.nodes,
        menu,
        createNode: <U = T>(def: import('../types.js').ItemDef<U>) =>
          instantiateSingleNode(def, menu) as import('../types.js').ItemNode<U>,
        hasExactMatch: (query: string) =>
          flattenedNodes.some(
            (node) =>
              node.kind === 'item' &&
              node.label?.toLowerCase() === query.toLowerCase(),
          ),
      }

      return menu.middleware.transformNodes(context)
    } catch (error) {
      console.error('[ActionMenu] Error in transformNodes middleware:', error)
      return flattenedNodes
    }
  }, [flattenedNodes, q, effectiveLocalQuery, menu])

  // Track the last pointer position to detect actual movement vs. items moving under cursor
  const lastPointerPosRef = React.useRef<{ x: number; y: number } | null>(null)

  // Whenever the query changes, ensure the first menu row is selected.
  React.useLayoutEffect(() => {
    store.first('keyboard')
    // Disable pointer events when typing
    if (q) {
      store.ignorePointerRef.current = true
    }
  }, [q])

  // Re-enable pointer events immediately on actual mouse movement
  React.useEffect(() => {
    const listEl = store.listRef.current
    if (!listEl) return

    const handlePointerMove = (e: PointerEvent) => {
      const lastPos = lastPointerPosRef.current

      // Track position
      const currentPos = { x: e.clientX, y: e.clientY }

      // Check if pointer actually moved
      if (lastPos) {
        const deltaX = Math.abs(currentPos.x - lastPos.x)
        const deltaY = Math.abs(currentPos.y - lastPos.y)

        // Re-enable immediately if the mouse actually moved (not just items shifting under cursor)
        if (deltaX > 2 || deltaY > 2) {
          store.ignorePointerRef.current = false
        }
      }

      lastPointerPosRef.current = currentPos
    }

    listEl.addEventListener('pointermove', handlePointerMove)
    return () => {
      listEl.removeEventListener('pointermove', handlePointerMove)
    }
  }, [store])

  React.useEffect(() => {
    const order = store.getOrder()
    const validRows = transformedNodes.filter(
      (n) => (n.kind === 'item' || n.kind === 'submenu') && !n.disabled,
    )
    const validRowIds = validRows.map((n) => n.id)

    const virtualIndexMap = new Map<string, number>()
    transformedNodes.forEach((node, index) => {
      if (node.kind === 'item' || node.kind === 'submenu') {
        virtualIndexMap.set(node.id, index)
      }
    })

    if (
      order.length !== validRowIds.length ||
      !isShallowEqual(order, validRowIds)
    ) {
      store.resetOrder(validRowIds)
      store.resetVirtualIndexMap(virtualIndexMap)
      store.setActiveByIndex(0, 'keyboard')
    }
  }, [transformedNodes, store])

  const count = React.useMemo(() => transformedNodes.length, [transformedNodes])

  const getItemKey = React.useCallback(
    (index: number) => transformedNodes[index]?.id ?? index,
    [transformedNodes],
  )

  const virtualizer = useVirtualizer({
    count,
    estimateSize: () => menu.virtualization?.estimateSize ?? 32,
    getScrollElement: () => store.listRef.current,
    getItemKey,
    overscan: menu.virtualization?.overscan ?? 12,
    initialRect: { width: 0, height: 500 },
  })

  // Store the virtualizer reference in the store
  React.useEffect(() => {
    store.virtualizerRef.current = virtualizer
  }, [virtualizer, store])

  const totalSize = virtualizer.getTotalSize()
  const totalSizePx = React.useMemo(() => `${totalSize}px`, [totalSize])

  const { measureRow } = useStickyRowWidth({ containerRef: store.listRef })

  const baseListProps = React.useMemo(
    () => ({
      ref: store.listRef as any,
      role: 'listbox' as const,
      id: effectiveListId,
      tabIndex: hasInput ? -1 : 0,
      'data-slot': 'action-menu-list' as const,
      'data-action-menu-list': true as const,
      'aria-activedescendant': hasInput ? undefined : activeId,
      'data-mode': mode,
      className: classNames?.list,
      onKeyDown,
      style: {
        '--total-size': totalSizePx,
      } as React.CSSProperties,
    }),
    [
      mode,
      onKeyDown,
      store.listRef,
      effectiveListId,
      activeId,
      classNames?.list,
      hasInput,
      totalSizePx,
    ],
  )

  const bind = React.useMemo(
    () =>
      ({
        getListProps: (overrides) =>
          mergeProps(
            baseListProps as any,
            mergeProps(slotProps?.list as any, overrides as any),
          ),
        getItemOrder: () => store.getOrder(),
        getActiveId: () => store.snapshot().activeId,
      }) satisfies ListBindAPI,
    [baseListProps, slotProps?.list, store],
  )

  const virtualItems = virtualizer.getVirtualItems()

  const ItemSlot = slots.Item
  const SubmenuTriggerSlot = slots.SubmenuTrigger
  const GroupHeadingSlot = slots.GroupHeading
  const SeparatorSlot = slots.Separator

  const listRows = React.useMemo(
    () => (
      <ul
        style={
          {
            '--total-size': totalSizePx,
            height: totalSizePx,
            position: 'relative',
          } as React.CSSProperties
        }
      >
        {virtualItems.map((virtualRow) => {
          const node = transformedNodes[virtualRow.index]!

          if (node.kind === 'group') {
            const childCount = node.nodes.length

            const headingBind: GroupHeadingBindAPI = {
              getGroupHeadingProps: (overrides) =>
                mergeProps(
                  {
                    role: 'presentation',
                    'data-index': virtualRow.index,
                    'data-action-menu-group-heading': '',
                    className: classNames?.groupHeading,
                    'data-group-size': childCount,
                  },
                  overrides as any,
                ),
            }

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {GroupHeadingSlot({ node, bind: headingBind })}
              </div>
            )
          }

          if (node.kind === 'separator') {
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className={classNames?.separator}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {SeparatorSlot?.({ node })}
              </div>
            )
          }

          if (node.kind === 'item') {
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className={classNames?.itemWrapper}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <Item
                  ref={measureRow}
                  key={node.id}
                  virtualItem={virtualRow}
                  node={node}
                  slot={ItemSlot}
                  defaults={defaults?.item}
                  className={classNames?.item}
                  store={store}
                  search={node.search}
                />
              </div>
            )
          }

          if (node.kind === 'submenu') {
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <ScopedThemeProvider __scopeId={node.id} theme={node.ui as any}>
                  <Sub def={node as any}>
                    <SubmenuTrigger
                      ref={measureRow}
                      key={virtualRow.key}
                      virtualItem={virtualRow}
                      node={node}
                      slot={SubmenuTriggerSlot}
                      classNames={classNames}
                      search={node.search}
                    />
                    <SubmenuContent menu={node as any} />
                  </Sub>
                </ScopedThemeProvider>
              </div>
            )
          }

          return null
        })}
      </ul>
    ),
    [
      ItemSlot,
      SubmenuTriggerSlot,
      GroupHeadingSlot,
      SeparatorSlot,
      store,
      transformedNodes,
      virtualizer.measureElement,
      virtualItems,
      totalSizePx,
      measureRow,
      defaults,
      classNames,
    ],
  )

  const EmptySlot = slots.Empty
  const children: React.ReactNode = React.useMemo(
    () => (transformedNodes.length > 0 ? listRows : EmptySlot({ query: q })),
    [listRows, EmptySlot, q, transformedNodes.length],
  )

  const ListSlot = slots.List
  const el = React.useMemo(
    () =>
      ListSlot({
        query: q,
        nodes: transformedNodes,
        children,
        bind,
      }),
    [bind, ListSlot, children, transformedNodes, q],
  )

  if (el === null) return null

  if (!isElementWithProp(el, 'data-action-menu-list')) {
    return (
      <div
        {...(bind.getListProps(
          mergeProps(slotProps?.list as any, {
            onPointerDown: () => {},
          }),
        ) as any)}
      >
        {listRows}
      </div>
    )
  }
  return el as React.ReactElement
}

function useDebugMemo<T>(factory: () => T, deps: any[], label: string): T {
  const prevDeps = React.useRef<any[]>(deps)

  React.useEffect(() => {
    deps.forEach((dep, i) => {
      if (dep !== prevDeps.current[i]) {
        console.log(`[${label}] Dependency ${i} changed:`, {
          old: prevDeps.current[i],
          new: dep,
        })
      }
    })
    prevDeps.current = deps
  }, deps)

  return React.useMemo(() => {
    console.log(`[${label}] recomputing`)
    return factory()
  }, deps)
}
