'use client'

import {
  answerKey,
  buildSnapshotWithoutPositions,
  type CollectionSnapshot,
  dataSnapshotInput,
  decideSettled,
  EMPTY_SETTLE_MEMO,
  type LoaderTarget,
  loaderTarget,
  type SettleMemo,
  tokenQuery,
} from '@bazza-ui/menu-core'
import * as React from 'react'
import {
  CollectionRowsContext,
  type CollectionRowsContextValue,
} from '../../listbox/contexts/collection-row-context.js'
import type {
  OrderedItemsUpdateReason,
  useSurfaceContext,
} from '../../listbox/index.js'
import { publishDataRows } from '../../listbox/store/ListboxStore.js'
import { PopupMenuCheckboxGroupValue } from '../components/checkbox-group/checkbox-group-value.js'
import { PopupMenuGroupLabel } from '../components/group-label/group-label.js'
import {
  type PopupMenuListChildrenState,
  PopupMenuListPrimitive,
  type PopupMenuListProps,
} from '../components/list/list.js'
import {
  GraftPointContext,
  useGraftPoint,
} from '../contexts/graft-point-context.js'
import { useMenuTree } from '../contexts/menu-tree-context.js'
import { usePopupSurfaceId } from '../contexts/popup-surface-id-context.js'
import { useMaybeSubpageContext } from '../contexts/subpage-context.js'
import { useMaybeSubpageStack } from '../contexts/subpage-stack-context.js'
import { useMenuSurfaceTier } from '../contexts/surface-tier-context.js'
import { useResolution } from '../hooks/use-resolution.js'
import { staticChildrenOf } from '../menu-tree/resolve.js'
import type { PopupMenuNode } from '../menu-tree/types.js'
import {
  LoaderScopeContext,
  useAsyncMenuCoordinator,
  useLoaderTarget,
} from './async-coordinator.js'
import {
  DataListContext,
  DataPopupContext,
  ENGINE_SETTERS,
  type RenderNodeFn,
  useDataSurfaceContext,
} from './context.js'
import { DataGroupContainer } from './group-container.js'
import { isRowMenuNode } from './type-guards.js'
import type {
  AsyncContentMode,
  AsyncLoaderConfig,
  AsyncLoaderResult,
  AsyncRenderState,
  AsyncResultBehavior,
  BreadcrumbNode,
  CheckboxGroupDef,
  CheckboxItemDef,
  DataListChildrenState,
  DisplayNode,
  DisplayRowNode,
  GroupDef,
  GroupRenderContext,
  ItemDef,
  LinkItemDef,
  NodeDef,
  RadioGroupDef,
  RowRenderContext,
  SubmenuDef,
  SubpageDef,
} from './types.js'
import {
  isDisplayCheckboxGroupNode,
  isDisplayGroupNode,
  isDisplayRadioGroupNode,
  isDisplaySeparatorNode,
} from './types.js'
import {
  type AsyncSubmenuInfo,
  filterNodes,
  shouldLoadEagerly,
} from './utils.js'

function renderGroupLabelElement<
  C extends GroupRenderContext & { label?: string },
>(
  groupId: string,
  label: string | undefined,
  renderLabel:
    | ((params: {
        node: PopupMenuNode
        props: { id: string }
        context: C
      }) => React.ReactNode)
    | undefined,
  node: PopupMenuNode,
  context: C,
): React.ReactNode {
  if (!label && !renderLabel) return null
  const labelId = `${groupId}-label`
  if (renderLabel) {
    return (
      <React.Fragment key={labelId}>
        {renderLabel({ node, props: { id: labelId }, context })}
      </React.Fragment>
    )
  }
  return (
    <PopupMenuGroupLabel key={labelId} id={labelId}>
      {label}
    </PopupMenuGroupLabel>
  )
}

// ============================================================================
// Row slots: a row re-renders only when what it renders from changes
// ============================================================================

/** Whether a row's render read its context's `search`. */
interface SearchReads {
  search: boolean
}

// Per Menu Node, so a row's reads outlive the renders that skip it. Sticky:
// once a row's render reads `search`, every search change re-renders it.
const searchReadsByNode = new WeakMap<object, SearchReads>()

function searchReadsFor(node: object): SearchReads {
  let reads = searchReadsByNode.get(node)
  if (!reads) {
    reads = { search: false }
    searchReadsByNode.set(node, reads)
  }
  return reads
}

/** Records a read of `context.search` in `reads`, and returns `context`. */
function trackSearchReads<C extends { search: unknown }>(
  context: C,
  reads: SearchReads,
): C {
  const { search } = context
  Object.defineProperty(context, 'search', {
    get() {
      reads.search = true
      return search
    },
    enumerable: true,
    configurable: true,
  })
  return context
}

/**
 * How each field of a row's context goes into its dependencies. Keyed by
 * every `RowRenderContext` field (`satisfies` fails to compile when one is
 * added and not listed here), so the cache can't miss a field a `render`
 * reads.
 */
const contextDependencies = {
  // Compared separately, and only when the row's `render` reads it.
  search: () => {},
  breadcrumbs: (context, deps) => {
    deps.push(context.breadcrumbs.length)
    for (const breadcrumb of context.breadcrumbs) deps.push(breadcrumb.menuNode)
  },
  isDeepSearchResult: (context, deps) => {
    deps.push(context.isDeepSearchResult)
  },
  highlighted: (context, deps) => {
    deps.push(context.highlighted)
  },
  disabled: (context, deps) => {
    deps.push(context.disabled)
  },
  group: (context, deps) => {
    deps.push(context.group?.id, context.group?.label)
  },
  tree: (context, deps) => {
    const { tree } = context
    if (!tree) {
      deps.push(null)
      return
    }
    deps.push(
      tree.depth,
      tree.hasChildren,
      tree.isLastChild,
      tree.header,
      tree.ancestorsLast.length,
      ...tree.ancestorsLast,
    )
  },
} satisfies {
  [K in keyof Required<RowRenderContext>]: (
    context: RowRenderContext,
    deps: unknown[],
  ) => void
}

const contextDependencyReads = Object.values(contextDependencies) as ((
  context: RowRenderContext,
  deps: unknown[],
) => void)[]

/**
 * What a row renders from, besides its context's `search`: its Menu Node and
 * def (whose `render` and props it reads), its checkbox group, and every
 * other field of its context.
 */
function rowDependencies(displayNode: DisplayRowNode): unknown[] {
  const { node, context, checkboxGroup } = displayNode
  const deps: unknown[] = [
    node,
    node.def,
    checkboxGroup?.id,
    checkboxGroup?.label,
    checkboxGroup?.def,
  ]
  for (const read of contextDependencyReads) read(context, deps)
  return deps
}

/**
 * Whether a branch, or any branch under it, loads its rows. Cached per Menu
 * Node in `cache`, which the list replaces when its tree changes (a graft
 * adds children under a branch without changing the node).
 */
function hasAsyncBranch(
  node: PopupMenuNode,
  cache: WeakMap<PopupMenuNode, boolean>,
): boolean {
  const cached = cache.get(node)
  if (cached !== undefined) return cached
  const value =
    Boolean('asyncNodes' in node.def && node.def.asyncNodes) ||
    node.children.some((child) => hasAsyncBranch(child, cache))
  cache.set(node, value)
  return value
}

function dependenciesEqual(
  a: readonly unknown[],
  b: readonly unknown[],
): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false
  }
  return true
}

interface DataRowSlotProps {
  render: (reads: SearchReads) => React.ReactNode
  deps: readonly unknown[]
  search: RowRenderContext['search']
  reads: SearchReads
}

interface RenderedRow {
  deps: readonly unknown[]
  search: RowRenderContext['search']
  element: React.ReactNode
}

/**
 * Renders a row from its def, reusing the last element when nothing it
 * renders from changed: a search key that leaves a row's place and match
 * alone doesn't call its `render`, unless that `render` reads
 * `context.search`. Returning the same element makes React skip the row's
 * subtree. A cache in a ref instead of `React.memo`, so each row costs one
 * fiber, not two.
 */
function DataRowSlot(props: DataRowSlotProps) {
  const { render, deps, search, reads } = props
  const rendered = React.useRef<RenderedRow | null>(null)
  const last = rendered.current
  if (
    last &&
    dependenciesEqual(last.deps, deps) &&
    (!reads.search ||
      (last.search?.query === search?.query &&
        last.search?.score === search?.score))
  ) {
    return last.element
  }
  const element = render(reads)
  rendered.current = { deps, search, element }
  return element
}

/** Renders an item, link, tree, radio or checkbox row from its def. */
function renderLeafRow(
  displayNode: DisplayRowNode,
  reads: SearchReads,
): React.ReactNode {
  const resolved = displayNode.node
  const node = resolved.def
  const { context } = displayNode
  const id = resolved.id

  if (node.kind === 'item') {
    return node.render({
      node: resolved,
      props: {
        id,
        value: node.value,
        disabled: context.disabled,
        closeOnClick: node.closeOnClick,
        onSelect: node.onSelect,
        shortcut: node.shortcut,
        forceOrder: node.forceOrder,
        forceScore: node.forceScore,
      },
      context: trackSearchReads({ ...context, value: node.value }, reads),
    })
  }

  if (node.kind === 'link-item') {
    return node.render({
      node: resolved,
      props: {
        id,
        value: node.value,
        href: node.href,
        disabled: context.disabled,
        closeOnClick: node.closeOnClick,
        onSelect: node.onSelect,
        shortcut: node.shortcut,
        forceOrder: node.forceOrder,
        forceScore: node.forceScore,
      },
      context: trackSearchReads({ ...context, value: node.value }, reads),
    })
  }

  if (node.kind === 'tree-item') {
    return node.render({
      node: resolved,
      props: {
        id,
        value: node.value,
        disabled: context.disabled,
        selectable: node.selectable !== false,
        closeOnClick: node.closeOnClick,
        onSelect: node.onSelect,
        forceOrder: node.forceOrder,
        forceScore: node.forceScore,
      },
      context: trackSearchReads({ ...context, value: node.value }, reads),
    })
  }

  if (node.kind === 'radio-item') {
    return node.render({
      node: resolved,
      props: {
        id,
        value: node.value,
        disabled: context.disabled,
        closeOnClick: node.closeOnClick,
        onSelect: node.onSelect,
        shortcut: node.shortcut,
        forceOrder: node.forceOrder,
        forceScore: node.forceScore,
      },
      context: trackSearchReads({ ...context, value: node.value }, reads),
    })
  }

  if (node.kind === 'checkbox-item') {
    const checkboxGroup = displayNode.checkboxGroup
    const rendered = node.render({
      node: resolved,
      props: {
        id,
        value: node.value,
        checked: node.checked,
        onCheckedChange: node.onCheckedChange,
        disabled: context.disabled,
        closeOnClick: node.closeOnClick,
        forceOrder: node.forceOrder,
        forceScore: node.forceScore,
      },
      context: trackSearchReads(
        {
          ...context,
          value: node.value,
          checked: checkboxGroup
            ? checkboxGroup.def.value.includes(node.value)
            : node.checked,
        },
        reads,
      ),
    })
    return checkboxGroup ? (
      <PopupMenuCheckboxGroupValue
        groupId={checkboxGroup.id}
        value={checkboxGroup.def.value}
        onValueChange={checkboxGroup.def.onValueChange}
        disabled={checkboxGroup.def.disabled ?? false}
      >
        {rendered}
      </PopupMenuCheckboxGroupValue>
    ) : (
      rendered
    )
  }

  return null
}

/**
 * Publishes the list's Collection to the store from its layout effect. The
 * list renders it after its rows, so its layout effect runs after theirs and
 * before the list primitive's.
 */
function CollectionPublisher({ publish }: { publish: () => void }) {
  React.useLayoutEffect(publish, [publish])
  return null
}

function isAppendOnlyOrderedItemsUpdate(
  previousIds: string[],
  nextIds: string[],
): boolean {
  if (previousIds.length === 0 || nextIds.length <= previousIds.length) {
    return false
  }

  for (let i = 0; i < previousIds.length; i++) {
    if (previousIds[i] !== nextIds[i]) {
      return false
    }
  }

  return true
}

function getBreadcrumbStreamKey(breadcrumbs: BreadcrumbNode[]): string {
  return breadcrumbs
    .map((breadcrumb) => breadcrumb.id ?? breadcrumb.value)
    .join('>')
}

function getDisplayNodeStreamKey(displayNode: DisplayNode): string {
  if (isDisplayGroupNode(displayNode)) {
    return `group:${displayNode.node.def.id}:${getBreadcrumbStreamKey(displayNode.context.breadcrumbs)}`
  }

  if (isDisplayRadioGroupNode(displayNode)) {
    return `radio-group:${displayNode.node.def.id}:${getBreadcrumbStreamKey(displayNode.context.breadcrumbs)}`
  }

  if (isDisplayCheckboxGroupNode(displayNode)) {
    return `checkbox-group:${displayNode.node.def.id}:${getBreadcrumbStreamKey(displayNode.context.breadcrumbs)}`
  }

  if (isDisplaySeparatorNode(displayNode)) {
    return `separator:${displayNode.node.def.id ?? 'separator'}`
  }

  return `row:${displayNode.node.def.kind}:${displayNode.node.def.id ?? ''}:${displayNode.node.def.value}:${getBreadcrumbStreamKey(displayNode.context.breadcrumbs)}`
}

function orderDisplayNodesForStreaming(
  displayNodes: DisplayNode[],
  previousOrder: string[],
): {
  orderedNodes: DisplayNode[]
  nextOrder: string[]
} {
  const currentEntries = displayNodes.map(
    (node) => [getDisplayNodeStreamKey(node), node] as const,
  )

  const currentByKey = new Map(currentEntries)
  const currentOrder = currentEntries.map(([key]) => key)

  const preservedOrder = previousOrder.filter((key) => currentByKey.has(key))
  const preservedKeysSet = new Set(preservedOrder)
  const appendedOrder = currentOrder.filter((key) => !preservedKeysSet.has(key))
  const nextOrder = [...preservedOrder, ...appendedOrder]

  const orderedNodes = nextOrder
    .map((key) => currentByKey.get(key))
    .filter((node): node is DisplayNode => node !== undefined)

  return { orderedNodes, nextOrder }
}

// ============================================================================
// Async Loader Component
// ============================================================================

interface AsyncLoaderRendererProps {
  info: AsyncSubmenuInfo
  query: string
  enabled: boolean
}

type BranchChildRow = PopupMenuNode<
  ItemDef | LinkItemDef | CheckboxItemDef | SubmenuDef | SubpageDef
>

/**
 * Renders one child of a submenu or subpage branch, for the `renderNode` its
 * render receives: a group with its rows, a radio or checkbox group, or a
 * row; a separator renders nothing.
 */
export function renderBranchChild(
  arg: PopupMenuNode,
  breadcrumbs: BreadcrumbNode[],
  renderRow: (
    row: BranchChildRow,
    context: RowRenderContext,
  ) => React.ReactNode,
  renderSelectionGroup: (
    node: PopupMenuNode<RadioGroupDef | CheckboxGroupDef>,
    breadcrumbs: BreadcrumbNode[],
  ) => React.ReactNode,
): React.ReactNode {
  const childNode = arg.def
  if (childNode.kind === 'separator') {
    return null
  }

  if (childNode.kind === 'group') {
    const groupItems = arg.children.filter(
      (n): n is BranchChildRow =>
        (n.def.kind === 'item' ||
          n.def.kind === 'link-item' ||
          n.def.kind === 'checkbox-item' ||
          n.def.kind === 'submenu' ||
          n.def.kind === 'subpage') &&
        !n.def.hidden,
    )

    if (groupItems.length === 0) {
      return null
    }

    const groupChildren = groupItems.map((item) =>
      renderRow(item, {
        search: null,
        breadcrumbs: breadcrumbs,
        isDeepSearchResult: false,
        highlighted: false,
        disabled: item.def.disabled ?? false,
        group: { id: childNode.id, label: childNode.label },
        tree: null,
      }),
    )

    if (childNode.render) {
      const groupContext: GroupRenderContext = {
        search: null,
        matchCount: groupItems.length,
        breadcrumbs: breadcrumbs,
        isDeepSearchResult: false,
      }

      const groupMenuNode = arg as PopupMenuNode<GroupDef>
      return (
        <React.Fragment key={childNode.id}>
          {childNode.render({
            node: groupMenuNode,
            props: {},
            context: {
              ...groupContext,
              label: childNode.label,
            },
            children: <>{groupChildren}</>,
          })}
        </React.Fragment>
      )
    }

    return (
      <DataGroupContainer key={childNode.id} label={childNode.label}>
        {groupChildren}
      </DataGroupContainer>
    )
  }

  if (childNode.kind === 'radio-group' || childNode.kind === 'checkbox-group') {
    if (childNode.kind === 'checkbox-group' && childNode.hidden) return null
    return renderSelectionGroup(
      arg as PopupMenuNode<RadioGroupDef | CheckboxGroupDef>,
      breadcrumbs,
    )
  }

  if (
    childNode.kind !== 'item' &&
    childNode.kind !== 'link-item' &&
    childNode.kind !== 'checkbox-item' &&
    childNode.kind !== 'submenu' &&
    childNode.kind !== 'subpage'
  ) {
    return null
  }

  return renderRow(
    arg as PopupMenuNode<
      ItemDef | LinkItemDef | CheckboxItemDef | SubmenuDef | SubpageDef
    >,
    {
      search: null,
      breadcrumbs: breadcrumbs,
      isDeepSearchResult: false,
      highlighted: false,
      disabled: childNode.disabled ?? false,
      group: null,
      tree: null,
    },
  )
}

/**
 * Renders a radio or checkbox group around its rows: with its own `render`,
 * else in the default container, with its label element unless `withLabel`
 * is false (the subpage outlet's default omits it). Radio and checkbox group
 * params differ only in the value's type.
 */
export function renderSelectionContainer(
  node: PopupMenuNode<RadioGroupDef | CheckboxGroupDef>,
  groupContext: GroupRenderContext,
  children: React.ReactNode,
  withLabel = true,
): React.ReactNode {
  const group = node.def
  const context = {
    ...groupContext,
    label: group.label,
    value: group.value,
    disabled: group.disabled ?? false,
  }
  const render = group.render as
    | ((params: object) => React.ReactNode)
    | undefined
  if (render) {
    return (
      <React.Fragment key={group.id}>
        {render({
          node,
          props: {
            value: group.value,
            onValueChange: group.onValueChange,
            disabled: group.disabled ?? false,
          },
          context,
          children: <>{children}</>,
        })}
      </React.Fragment>
    )
  }
  return (
    <DataGroupContainer key={group.id} label={group.label}>
      {withLabel &&
        renderGroupLabelElement(
          group.id,
          group.label,
          group.renderLabel as
            | ((params: {
                node: PopupMenuNode
                props: { id: string }
                context: typeof context
              }) => React.ReactNode)
            | undefined,
          node,
          context,
        )}
      {children}
    </DataGroupContainer>
  )
}

/** The async state a branch row's render receives. */
export function getBranchAsyncState(
  menuNode: PopupMenuNode<SubmenuDef | SubpageDef>,
  searchQuery: string,
  coordinator: ReturnType<typeof useAsyncMenuCoordinator>,
): AsyncRenderState | undefined {
  const node = menuNode.def
  if (!node.asyncNodes || !coordinator) {
    return undefined
  }

  const asyncResult = coordinator.loaders.get(menuNode.id)

  if (!asyncResult) {
    return undefined
  }

  const { isBelowMinLength } = loaderTarget(node.asyncNodes, searchQuery)

  return {
    status: asyncResult.result.status,
    fetchStatus: asyncResult.result.fetchStatus,
    loadingPhase: asyncResult.result.loadingPhase,
    isLoading: asyncResult.result.isLoading,
    isFetching: asyncResult.result.isFetching,
    isInitialLoading: asyncResult.result.isInitialLoading,
    isRefetching: asyncResult.result.isRefetching,
    isError: asyncResult.result.isError,
    error: asyncResult.result.error,
    isBelowMinLength,
  }
}

/**
 * Puts display nodes from local content ahead of loaded ones, keeping each
 * side's order. Returns the input when nothing moves.
 */
function localFirst<T extends DisplayNode>(
  nodes: T[],
  localDefs: ReadonlySet<NodeDef>,
): T[] {
  const local: T[] = []
  const loaded: T[] = []
  for (const node of nodes) {
    if (localDefs.has(node.node.def)) local.push(node)
    else loaded.push(node)
  }
  if (local.length === 0 || loaded.length === 0) return nodes
  const ordered = [...local, ...loaded]
  return ordered.every((node, index) => node === nodes[index]) ? nodes : ordered
}

/**
 * Whether the root `asyncContent` loader has settled for the current search:
 * the settle policy (`decideSettled`) the menu tree's `LoaderManager` applies
 * to every loader, run in render over one stream of results. A root loader
 * that is not rendered, or a query loader disabled below `minQueryLength`, has
 * nothing pending, and tracking starts over when it becomes active again.
 */
export function useRootAsyncSettled(
  asyncContent: AsyncLoaderConfig | undefined,
  query: string,
  result: AsyncLoaderResult<NodeDef[]> | undefined,
  loaderRendered: boolean,
): { settled: boolean; settledOnce: boolean } {
  const memoRef = React.useRef<SettleMemo<NodeDef[]>>(EMPTY_SETTLE_MEMO)
  const target = asyncContent ? loaderTarget(asyncContent, query) : null
  const decision = decideSettled(memoRef.current, {
    active: loaderRendered && (target?.enabled ?? false),
    key: asyncContent && target ? tokenQuery(asyncContent, target) : '',
    result,
    waiting: false,
  })
  memoRef.current = decision.memo
  return { settled: decision.settled, settledOnce: decision.settledOnce }
}

/**
 * Renders an async loader component and reports its state to the loader
 * scope. This component exists solely to call the Loader component (which
 * contains hooks).
 */
function AsyncLoaderRenderer({
  info,
  query,
  enabled,
}: AsyncLoaderRendererProps) {
  const { config, id } = info
  const Loader = config.Loader

  // Track if this loader should be active: only an active one starts.
  const isActive = enabled || shouldLoadEagerly(config)
  const given = useLoaderTarget(id, isActive ? config : undefined, query)

  if (!isActive) {
    return null
  }

  return (
    <Loader query={given.query} enabled={given.enabled}>
      {(result) => (
        <AsyncLoaderResultHandler
          id={id}
          given={given}
          answers={answerKey(config, given)}
          result={result}
        />
      )}
    </Loader>
  )
}

interface AsyncLoaderResultHandlerProps {
  /** The branch's id; `null` for the surface's own loader. */
  id: string | null
  /** What the loader was given when it rendered `result`. */
  given: LoaderTarget
  /** Which query that asks for (`answerKey`): a new one is reported again. */
  answers: string | null
  result: AsyncLoaderResult<NodeDef[]>
}

/**
 * The one bridge from a loader adapter (vanilla, SWR, TanStack Query or a
 * custom one) to the loader scope: reports each meaningful change of its
 * result, with what the loader was given, and withdraws it on unmount.
 * This is a separate component to avoid re-rendering the Loader on every result change.
 */
function AsyncLoaderResultHandler({
  id,
  given,
  answers,
  result,
}: AsyncLoaderResultHandlerProps) {
  const handle = React.useContext(LoaderScopeContext)

  // Track previous result values to avoid unnecessary updates
  // TanStack Query returns new object references on every render
  const prevResultRef = React.useRef<{
    data: unknown
    status: string
    fetchStatus: string
    loadingPhase: string
    isLoading: boolean
    isFetching: boolean
    isInitialLoading: boolean
    isRefetching: boolean
    isPending: boolean
    isSuccess: boolean
    isError: boolean
    isPaused: boolean
    hasData: boolean
    hasFetched: boolean
    error: Error | null
    answers: string | null
  } | null>(null)

  // What it reported is withdrawn with the effect, so the next setup reports
  // again, even a result that hasn't changed: StrictMode, `<Activity>` and
  // Fast Refresh run cleanups and setups without a new result, and a new
  // scope or id starts with nothing.
  React.useEffect(() => {
    if (!handle) return undefined
    return () => {
      prevResultRef.current = null
      handle.withdraw(id)
    }
  }, [handle, id])

  // Update result when meaningful values change
  // IMPORTANT: Depend on individual result values, not the result object reference.
  // TanStack Query creates new object references on every render, but we only want
  // to trigger updates when actual values change. The query the loader was
  // given is compared too: the scope drops a result for a query the loader
  // no longer has, so one for the query it has now is reported again.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally field-granular — the result object has a new identity every render (see comment above)
  React.useEffect(() => {
    if (!handle) return

    const prev = prevResultRef.current
    const hasChanged =
      prev === null ||
      prev.data !== result.data ||
      prev.status !== result.status ||
      prev.fetchStatus !== result.fetchStatus ||
      prev.loadingPhase !== result.loadingPhase ||
      prev.isLoading !== result.isLoading ||
      prev.isFetching !== result.isFetching ||
      prev.isInitialLoading !== result.isInitialLoading ||
      prev.isRefetching !== result.isRefetching ||
      prev.isPending !== result.isPending ||
      prev.isSuccess !== result.isSuccess ||
      prev.isError !== result.isError ||
      prev.isPaused !== result.isPaused ||
      prev.hasData !== result.hasData ||
      prev.hasFetched !== result.hasFetched ||
      prev.error !== result.error ||
      prev.answers !== answers

    if (hasChanged) {
      prevResultRef.current = {
        data: result.data,
        status: result.status,
        fetchStatus: result.fetchStatus,
        loadingPhase: result.loadingPhase,
        isLoading: result.isLoading,
        isFetching: result.isFetching,
        isInitialLoading: result.isInitialLoading,
        isRefetching: result.isRefetching,
        isPending: result.isPending,
        isSuccess: result.isSuccess,
        isError: result.isError,
        isPaused: result.isPaused,
        hasData: result.hasData,
        hasFetched: result.hasFetched,
        error: result.error,
        answers,
      }
      handle.report(id, given, result)
    }
  }, [
    handle,
    id,
    result.data,
    result.status,
    result.fetchStatus,
    result.loadingPhase,
    result.isLoading,
    result.isFetching,
    result.isInitialLoading,
    result.isRefetching,
    result.isPending,
    result.isSuccess,
    result.isError,
    result.isPaused,
    result.hasData,
    result.hasFetched,
    result.error,
    answers,
  ])

  return null
}

// ============================================================================
// Root Async Loader Component
// ============================================================================

interface RootAsyncLoaderProps {
  query: string
}

/**
 * Renders the root async content loader if configured.
 */
function RootAsyncLoader({ query }: RootAsyncLoaderProps) {
  const { asyncContent } = useDataSurfaceContext()

  const given = useLoaderTarget(null, asyncContent, query)

  if (!asyncContent) {
    return null
  }

  const Loader = asyncContent.Loader

  return (
    <Loader query={given.query} enabled={given.enabled}>
      {(result) => (
        <AsyncLoaderResultHandler
          id={null}
          given={given}
          answers={answerKey(asyncContent, given)}
          result={result}
        />
      )}
    </Loader>
  )
}

// ============================================================================
// DataList Inner Component (with coordinator access)
// ============================================================================

export interface DataListInnerProps extends PopupMenuListProps {
  content: NodeDef[]
  asyncContent: ReturnType<typeof useDataSurfaceContext>['asyncContent']
  asyncContentMode?: AsyncContentMode
  asyncContentReveal?: AsyncResultBehavior
  deepSearchConfig: ReturnType<typeof useDataSurfaceContext>['deepSearchConfig']
  includeInDeepSearch: ReturnType<
    typeof useDataSurfaceContext
  >['includeInDeepSearch']
  filter: ReturnType<typeof useDataSurfaceContext>['filter']
  search: string
  normalizedSearch: string
  store: ReturnType<typeof useSurfaceContext>['store']
}

export const DataListInner = React.forwardRef<
  HTMLDivElement,
  DataListInnerProps
>(function DataListInner(props, forwardedRef) {
  const {
    children,
    content,
    asyncContent,
    asyncContentMode = 'replace',
    asyncContentReveal = 'stream',
    deepSearchConfig,
    includeInDeepSearch,
    filter,
    search,
    normalizedSearch,
    store,
    label = 'Menu',
    remeasureDependencies,
    ...listProps
  } = props

  const tree = useMenuTree()
  const loaderScope = React.useContext(LoaderScopeContext)
  const scopeId = loaderScope?.id ?? null
  const popupId = usePopupSurfaceId()
  const graftParent = useGraftPoint()
  const { depth: surfaceDepth } = useMenuSurfaceTier('listbox')
  const resolverSubpageContext = useMaybeSubpageContext()
  const resolverSubpageStack = useMaybeSubpageStack()
  // Mirrors surface.tsx's isSubpageSurfaceInThisPopup: a data surface
  // rendered as a subpage of this popup must never feed resolution.
  const isSubpageSurface = Boolean(
    resolverSubpageContext &&
      resolverSubpageStack?.getSurfaceId(resolverSubpageContext.pageId),
  )
  const isResolutionRoot = surfaceDepth === 0 && !isSubpageSurface

  // Get coordinator for async state
  const coordinator = useAsyncMenuCoordinator()

  // Determine if deep search is active
  const minLength = deepSearchConfig.minLength ?? 0
  const isDeepSearchActive =
    deepSearchConfig.enabled !== false && normalizedSearch.length >= minLength

  const { slice, asyncSubmenus, localDefs, loaded } = useResolution({
    tree,
    scopeId,
    content,
    asyncContent,
    asyncContentMode,
    graftParent,
    isSubpageSurface,
    isResolutionRoot,
    includeInDeepSearch,
    disabledBranchBehavior: deepSearchConfig.disabledBranchBehavior,
  })

  // The popup's subpages render from the tree, so the root list only tells
  // it which content it resolved, which replaces a slot a consumer set. A
  // consumer's own `DataPopupContext` gets the list's nodes, as it always did.
  // Both happen again after every graft: a store-time graft re-renders the
  // list (its scope changed) with a new tree version.
  const setResolvedNodes = React.useContext(DataPopupContext)?.setResolvedNodes
  const treeVersion = tree.state.version
  // biome-ignore lint/correctness/useExhaustiveDependencies: treeVersion is the signal that a graft changed nodes under the list without a new slice
  React.useLayoutEffect(() => {
    if (isSubpageSurface || !setResolvedNodes) return
    if (ENGINE_SETTERS.has(setResolvedNodes)) {
      tree.updatePopup(popupId ?? '', {
        content,
        loaded,
        loadedBy: asyncContent,
        slot: undefined,
      })
    } else {
      setResolvedNodes({
        nodes: slice.nodes,
        graftVersion: tree.state.version,
        content,
      })
    }
  }, [
    tree,
    popupId,
    isSubpageSurface,
    setResolvedNodes,
    slice,
    content,
    loaded,
    asyncContent,
    treeVersion,
  ])

  // Determine which async loaders should be rendered
  const shouldRenderAsyncLoaders =
    isDeepSearchActive ||
    asyncSubmenus.some((s) => shouldLoadEagerly(s.config)) ||
    (asyncContent && asyncContent.loadStrategy === 'eager')

  // Whether the root loader has settled for the search: the tree's loader
  // manager decides, from the store update that changed the search. Until
  // the loader starts (its layout effect), it hasn't.
  const rootLoader = tree.useState('loaders', scopeId ?? '').loaders.root
  const rootSettled =
    asyncContent && shouldRenderAsyncLoaders
      ? (rootLoader?.settled ?? false)
      : true
  // Published once the rows are (the List's layout effects run first), so a
  // reader of the reveal never sees a settle before the rows it brings.
  const settledOnce = rootLoader?.settledOnce ?? false
  const block = asyncContentReveal === 'block' && asyncContent !== undefined
  React.useLayoutEffect(() => {
    loaderScope?.setReveal({ settled: rootSettled, settledOnce, block })
  }, [loaderScope, rootSettled, settledOnce, block])
  // The last list shown while the root loader was settled; `'block'` keeps it
  // up while the current search's rows are still loading.
  const lastSettledDisplayRef = React.useRef<DisplayNode[] | null>(null)

  const streamOrderRef = React.useRef<{
    query: string
    order: string[]
  } | null>(null)

  // Compute filtered display nodes
  const { displayNodes, isDeepSearching } = React.useMemo(() => {
    const result = filterNodes({
      query: normalizedSearch,
      nodes: slice.nodes,
      highlightedId: null, // Primitives handle highlighting via store
      deepSearch: deepSearchConfig.enabled,
      includeInDeepSearch,
      disabledBranchBehavior: deepSearchConfig.disabledBranchBehavior,
      minLength: deepSearchConfig.minLength,
      groupSearchBehavior: deepSearchConfig.groupSearchBehavior,
      radioGroupSearchBehavior: deepSearchConfig.radioGroupSearchBehavior,
      checkboxGroupSearchBehavior: deepSearchConfig.checkboxGroupSearchBehavior,
      sortGroups: deepSearchConfig.sortGroups,
      filter,
    })

    const asyncResultBehavior = deepSearchConfig.asyncResultBehavior ?? 'stream'
    const expectedAsyncLoaderCount =
      asyncSubmenus.length + (asyncContent ? 1 : 0)
    const hasAsyncSources = expectedAsyncLoaderCount > 0

    const shouldBlockAsyncResults =
      asyncResultBehavior === 'block' &&
      result.isDeepSearching &&
      hasAsyncSources &&
      coordinator !== null &&
      (coordinator.loaders.size + (coordinator.root ? 1 : 0) <
        expectedAsyncLoaderCount ||
        coordinator.isAnyLoading)

    let displayNodesToRender = result.displayNodes

    if (shouldBlockAsyncResults) {
      streamOrderRef.current = null
      displayNodesToRender = []
    } else if (asyncResultBehavior === 'stream' && result.isDeepSearching) {
      const previousStreamState = streamOrderRef.current

      if (
        !previousStreamState ||
        previousStreamState.query !== normalizedSearch
      ) {
        streamOrderRef.current = {
          query: normalizedSearch,
          order: displayNodesToRender.map(getDisplayNodeStreamKey),
        }
      } else {
        const { orderedNodes, nextOrder } = orderDisplayNodesForStreaming(
          displayNodesToRender,
          previousStreamState.order,
        )

        displayNodesToRender = orderedNodes
        streamOrderRef.current = {
          query: normalizedSearch,
          order: nextOrder,
        }
      }
    } else {
      streamOrderRef.current = null
    }

    // Append mode: local rows stay ahead of loaded rows even when scoring
    // would interleave them; each side keeps its own order.
    if (localDefs) {
      displayNodesToRender = localFirst(
        displayNodesToRender.map((displayNode) =>
          'items' in displayNode
            ? {
                ...displayNode,
                items: localFirst(displayNode.items, localDefs),
              }
            : displayNode,
        ),
        localDefs,
      )
    }

    if (asyncContentReveal === 'block' && asyncContent) {
      if (rootSettled) {
        lastSettledDisplayRef.current = displayNodesToRender
      } else {
        displayNodesToRender = lastSettledDisplayRef.current ?? []
      }
    }

    return {
      displayNodes: displayNodesToRender,
      isDeepSearching: result.isDeepSearching,
    }
  }, [
    normalizedSearch,
    slice,
    deepSearchConfig,
    includeInDeepSearch,
    filter,
    asyncSubmenus.length,
    asyncContent,
    coordinator,
    coordinator?.isAnyLoading,
    coordinator?.loaders,
    asyncContentReveal,
    rootSettled,
    localDefs,
  ])

  // Whether any row renders as a search row: a deep-search result (with
  // breadcrumbs) or a tree row (flat while searching).
  const showsSearchRows = React.useMemo(
    () =>
      isDeepSearching &&
      displayNodes.some((displayNode) =>
        (displayNode.kind === 'row'
          ? [displayNode]
          : 'items' in displayNode
            ? displayNode.items
            : []
        ).some(
          (row) =>
            row.context.isDeepSearchResult || row.node.def.kind === 'tree-item',
        ),
      ),
    [isDeepSearching, displayNodes],
  )

  // The list's rows are this surface's Collection (the store's Data
  // adapter) until it unmounts.
  React.useLayoutEffect(() => () => publishDataRows(store, null), [store])

  // The Collection the store reads order, visibility and row metadata from.
  // An unchanged build returns the last snapshot.
  const publishedSnapshotRef = React.useRef<CollectionSnapshot | undefined>(
    undefined,
  )
  const snapshot = React.useMemo(
    () =>
      // The store works positions out itself, with the rows parts register.
      buildSnapshotWithoutPositions(
        // Only the rows shown: rows a search hides unmount, so nothing reads
        // them, and leaving them out keeps a key's work to the rows it shows.
        dataSnapshotInput({ displayNodes, browseNodes: displayNodes }),
        publishedSnapshotRef.current,
      ),
    [displayNodes],
  )

  // Which rows are the Collection's, for its rows to read while they render
  // (they bind instead of registering). The latest render's snapshot, read
  // through a stable value, so a new snapshot doesn't re-render every row.
  const renderedSnapshotRef = React.useRef(snapshot)
  renderedSnapshotRef.current = snapshot
  const collectionRows = React.useMemo<CollectionRowsContextValue>(
    () => ({
      store,
      has: (id) => renderedSnapshotRef.current.rows.has(id),
    }),
    [store],
  )

  // The rows navigation visits, as a new array only when they change, so the
  // highlight only resets when they do.
  const prevOrderedItemIdsRef = React.useRef<string[]>([])
  const orderedItemIds = React.useMemo(() => {
    const prev = prevOrderedItemIdsRef.current
    const current = snapshot.navOrder
    const changed =
      prev.length !== current.length || prev.some((id, i) => id !== current[i])
    if (!changed) return prev
    prevOrderedItemIdsRef.current = current as string[]
    return current as string[]
  }, [snapshot])

  // What the store was last given: the rows and the search they were for.
  // Tracked together, so a keystroke that leaves the rows unchanged still
  // counts as a search change.
  const lastSyncRef = React.useRef<{
    ids: string[] | null
    search: string | null
  }>({ ids: null, search: null })
  const asyncResultBehavior = deepSearchConfig.asyncResultBehavior ?? 'stream'

  // Run from the layout effect of `CollectionPublisher`, the list's last
  // child: after the rows' layout effects (so they're bound) and before the
  // list primitive's flush, so positions and the highlight land before paint
  // in one publish, in the commit that mounts and unmounts the rows.
  const publish = React.useCallback(() => {
    publishedSnapshotRef.current = snapshot
    publishDataRows(store, snapshot)

    const last = lastSyncRef.current
    lastSyncRef.current = { ids: orderedItemIds, search: normalizedSearch }
    const searchChanged = last.search !== normalizedSearch

    if (last.ids === orderedItemIds) {
      // Same rows, new search: the highlight still resets to the first row.
      if (searchChanged) store.highlightFirstOrderedItem()
      return
    }

    // Same search, different rows (async results landed, a loader refetched):
    // keep the highlighted row. A new search resets to the first row.
    const reason: OrderedItemsUpdateReason = searchChanged
      ? 'replace'
      : asyncResultBehavior === 'stream' &&
          isDeepSearching &&
          isAppendOnlyOrderedItemsUpdate(last.ids ?? [], orderedItemIds)
        ? 'append'
        : 'refresh'
    store.setOrderedItems(orderedItemIds, { reason })
  }, [
    store,
    snapshot,
    orderedItemIds,
    normalizedSearch,
    asyncResultBehavior,
    isDeepSearching,
  ])

  // Which branches load rows, worked out once per tree slice.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new slice is the signal that a graft changed nodes under the list
  const asyncBranchCache = React.useMemo(
    () => new WeakMap<PopupMenuNode, boolean>(),
    [slice],
  )

  // Helper to render a single row node (item, checkbox item, submenu, or subpage)
  // biome-ignore lint/correctness/useExhaustiveDependencies: renderRowNode and renderSelectionGroup are intentionally recursive.
  const renderRowNode = React.useCallback(
    (displayNode: DisplayRowNode): React.ReactNode => {
      const resolved = displayNode.node
      const node = resolved.def
      const { context } = displayNode

      const id = resolved.id

      if (
        node.kind === 'item' ||
        node.kind === 'link-item' ||
        node.kind === 'tree-item' ||
        node.kind === 'radio-item' ||
        node.kind === 'checkbox-item'
      ) {
        return (
          <DataRowSlot
            key={id}
            render={(reads) => renderLeafRow(displayNode, reads)}
            // A new `content` re-renders every row, as an app re-rendering
            // with it did: a `render` may read app state its def doesn't
            // carry. A search alone leaves it alone.
            deps={[content, ...rowDependencies(displayNode)]}
            search={context.search}
            reads={searchReadsFor(resolved)}
          />
        )
      }

      if (node.kind === 'submenu' || node.kind === 'subpage') {
        // Only a branch with an async branch at or under it reads the loaders
        // (its async state) and the search (`isBelowMinLength`); the
        // coordinator is a new object on every key.
        const readsLoaders = hasAsyncBranch(resolved, asyncBranchCache)
        return (
          <DataRowSlot
            key={id}
            render={(reads) => renderBranchRow(reads)}
            deps={[
              content,
              ...rowDependencies(displayNode),
              slice,
              readsLoaders ? coordinator : null,
              readsLoaders ? normalizedSearch : null,
            ]}
            search={context.search}
            reads={searchReadsFor(resolved)}
          />
        )
      }

      return null

      function renderBranchRow(reads: SearchReads): React.ReactNode {
        if (node.kind === 'submenu') {
          // For submenus, provide the nodes and a recursive renderNode function
          // Note: We pass the resolved id to the submenu trigger so it registers with the
          // correct ID for keyboard navigation during deep search
          const submenuAsyncState = getBranchAsyncState(
            resolved as PopupMenuNode<SubmenuDef | SubpageDef>,
            normalizedSearch,
            coordinator,
          )

          // Static nodes only - async content is handled by the submenu's own DataSurface
          const staticChildren = staticChildrenOf(resolved)

          // Create breadcrumb node for current submenu (used in child contexts)
          const submenuBreadcrumb: BreadcrumbNode = {
            node,
            menuNode: resolved as PopupMenuNode<SubmenuDef>,
            value: node.value,
            id: node.id,
          }

          const submenuRenderNode = (arg: PopupMenuNode): React.ReactNode =>
            renderBranchChild(
              arg,
              [...context.breadcrumbs, submenuBreadcrumb],
              (row, rowContext) =>
                renderRowNode({ kind: 'row', node: row, context: rowContext }),
              renderSelectionGroup,
            )

          return (
            <React.Fragment key={id}>
              <GraftPointContext.Provider value={resolved}>
                {node.render({
                  node: resolved,
                  props: {
                    id,
                    value: node.value,
                    disabled: context.disabled,
                    forceOrder: node.forceOrder,
                    forceScore: node.forceScore,
                  },
                  context: trackSearchReads(
                    {
                      ...context,
                      value: node.value,
                      async: submenuAsyncState,
                    },
                    reads,
                  ),
                  nodes: staticChildren,
                  asyncContent: node.asyncNodes,
                  renderNode: submenuRenderNode,
                })}
              </GraftPointContext.Provider>
            </React.Fragment>
          )
        }

        if (node.kind === 'subpage') {
          const subpageAsyncState = getBranchAsyncState(
            resolved as PopupMenuNode<SubmenuDef | SubpageDef>,
            normalizedSearch,
            coordinator,
          )
          const pageId = resolved.id

          return (
            <React.Fragment key={id}>
              {node.renderTrigger({
                node: resolved,
                props: {
                  id,
                  value: node.value,
                  disabled: context.disabled,
                  targetPageId: pageId,
                },
                context: trackSearchReads(
                  {
                    ...context,
                    value: node.value,
                    async: subpageAsyncState,
                  },
                  reads,
                ),
              })}
            </React.Fragment>
          )
        }

        return null
      }
    },
    [
      content,
      coordinator,
      normalizedSearch,
      isDeepSearching,
      slice,
      asyncBranchCache,
    ],
  )

  // A radio group or a checkbox group: the same params, and each row knows
  // its group.
  const renderSelectionGroup = React.useCallback(
    (
      groupNode: PopupMenuNode<RadioGroupDef | CheckboxGroupDef>,
      breadcrumbs: BreadcrumbNode[] = [],
    ): React.ReactNode => {
      const group = groupNode.def
      const isDeepSearchResult = breadcrumbs.length > 0
      // Render children - renderRowNode already wraps in keyed Fragment
      const childElements = groupNode.children.map((item) => {
        if (!isRowMenuNode(item) || item.def.hidden) return null
        return renderRowNode({
          kind: 'row',
          node: item,
          context: {
            search: null,
            breadcrumbs,
            isDeepSearchResult,
            highlighted: false,
            disabled: item.def.disabled ?? false,
            group: null,
            tree: null,
          },
          ...(group.kind === 'radio-group'
            ? { radioGroup: { id: group.id, label: group.label } }
            : {
                checkboxGroup: { id: group.id, label: group.label, def: group },
              }),
        })
      })
      return renderSelectionContainer(
        groupNode,
        {
          search: null,
          matchCount: group.nodes.length,
          breadcrumbs,
          isDeepSearchResult,
        },
        childElements,
      )
    },
    [renderRowNode],
  )

  // Build the renderNode function that handles groups, radio groups, and rows
  const renderNode: RenderNodeFn = React.useCallback(
    (displayNode: DisplayNode): React.ReactNode => {
      // Handle group display nodes
      if (isDisplayGroupNode(displayNode)) {
        const groupNode = displayNode.node
        const { context, items } = displayNode
        const group = groupNode.def

        // Render children - renderRowNode already wraps in keyed Fragment
        const children = items.map((item) => renderRowNode(item))

        // Use custom render if provided
        if (group.render) {
          return (
            <React.Fragment key={group.id}>
              {group.render({
                node: groupNode,
                props: {},
                context: {
                  ...context,
                  label: group.label,
                },
                children: <>{children}</>,
              })}
            </React.Fragment>
          )
        }

        // Minimal default: just render children with a wrapper
        return (
          <DataGroupContainer key={group.id} label={group.label}>
            {renderGroupLabelElement(
              group.id,
              group.label,
              group.renderLabel,
              groupNode,
              {
                ...context,
                label: group.label,
              },
            )}
            {children}
          </DataGroupContainer>
        )
      }

      if (
        isDisplayRadioGroupNode(displayNode) ||
        isDisplayCheckboxGroupNode(displayNode)
      ) {
        return renderSelectionContainer(
          displayNode.node,
          displayNode.context,
          displayNode.items.map((item) => renderRowNode(item)),
        )
      }

      // Handle separator display nodes
      if (isDisplaySeparatorNode(displayNode)) {
        const separator = displayNode.node.def

        // Use custom render if provided
        if (separator.render) {
          return (
            <React.Fragment key={separator.id ?? 'separator'}>
              {separator.render({
                props: { id: separator.id },
              })}
            </React.Fragment>
          )
        }

        // Minimal default: render a div with role="none"
        return <div key={separator.id ?? 'separator'} role="none" />
      }

      // Handle row display nodes (items/checkbox items/submenus/subpages)
      // renderRowNode already wraps in keyed Fragment
      return renderRowNode(displayNode)
    },
    [renderRowNode],
  )

  // Get async state from coordinator
  const asyncState = React.useMemo(() => {
    if (!coordinator) {
      return {
        isLoading: false,
        isFetching: false,
        isInitialLoading: false,
        isRefetching: false,
        isAllRefetching: false,
        isStaticLoading: false,
        isStaticInitialLoading: false,
        isStaticRefetching: false,
        isQueryLoading: false,
        isQueryInitialLoading: false,
        isQueryRefetching: false,
        skippedMenus: [],
      }
    }
    return coordinator.getAsyncState()
  }, [
    coordinator,
    coordinator?.loaders,
    coordinator?.erroredLoaders,
    coordinator?.root,
  ])

  // Build children state
  const childrenState: DataListChildrenState = React.useMemo(
    () => ({
      search,
      nodes: displayNodes,
      renderNode,
      count: displayNodes.length,
      isDeepSearching,
      async: asyncState,
    }),
    [search, displayNodes, renderNode, isDeepSearching, asyncState],
  )

  // Use PopupMenuList which handles keyboard navigation
  return (
    <>
      {/* Render async loaders (hidden, just for hook execution) */}
      {shouldRenderAsyncLoaders && (
        <>
          {/* Root async content loader */}
          <RootAsyncLoader query={normalizedSearch} />

          {/* Submenu async loaders */}
          {asyncSubmenus.map((info) => (
            <AsyncLoaderRenderer
              key={info.id}
              info={info}
              query={normalizedSearch}
              enabled={isDeepSearchActive && filter !== false}
            />
          ))}
        </>
      )}

      <DataListContext.Provider value={childrenState}>
        <CollectionRowsContext.Provider value={collectionRows}>
          <PopupMenuListPrimitive
            ref={forwardedRef}
            label={label}
            {...listProps}
            // Re-measure rows when deep search starts or stops showing rows
            // that render differently from browsing — the same Resolved IDs
            // render different content (label vs breadcrumb row, tree row vs
            // flat row). A search that shows only browse rows changes no
            // row's width. Consumer deps are merged in rather than replaced.
            remeasureDependencies={[
              showsSearchRows,
              ...(remeasureDependencies ?? []),
            ]}
          >
            {typeof children === 'function' ? (
              (state: PopupMenuListChildrenState) => (
                <>
                  {children(state)}
                  <CollectionPublisher publish={publish} />
                </>
              )
            ) : (
              <>
                {children}
                <CollectionPublisher publish={publish} />
              </>
            )}
          </PopupMenuListPrimitive>
        </CollectionRowsContext.Provider>
      </DataListContext.Provider>
    </>
  )
})
