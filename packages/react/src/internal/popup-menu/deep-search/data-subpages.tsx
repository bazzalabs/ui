'use client'

import * as React from 'react'
import { GraftPointContext } from '../contexts/graft-point-context.js'
import type { PopupMenuNode } from '../menu-tree/types.js'
import { useAsyncMenuCoordinator } from './async-coordinator.js'
import { useDataPopupContext } from './context.js'
import type {
  AsyncRenderState,
  BreadcrumbNode,
  DataSubpagesChildrenState,
  DataSubpagesProps,
  DisplaySubpageNode,
  GroupRenderContext,
  NodeDef,
  QueryDependentLoaderConfig,
  RadioGroupDef,
  ResolvedMenuNode,
  ResolvedMenuNodeOf,
  RowNodeDef,
  RowRenderContext,
  SubmenuDef,
  SubpageDef,
} from './types.js'
import {
  getAsyncLoaderIdForBranch,
  getSubpagePageId,
  selectResolvedChildren,
} from './utils.js'

interface QueryExecutionState {
  effectiveQuery: string
  enabled: boolean
  isBelowMinLength: boolean
}

function resolveInitialQueryBehavior(config: QueryDependentLoaderConfig):
  | {
      value: string
      loadWhen: 'needed' | 'parent-open'
    }
  | false {
  if (config.initialQueryBehavior !== undefined) {
    if (config.initialQueryBehavior === false) {
      return false
    }
    return {
      value: config.initialQueryBehavior.value ?? '',
      loadWhen: config.initialQueryBehavior.loadWhen ?? 'needed',
    }
  }

  if (config.initialQuery !== undefined) {
    return { value: config.initialQuery, loadWhen: 'needed' }
  }

  return { value: '', loadWhen: 'needed' }
}

function resolveQueryExecutionState(
  config: QueryDependentLoaderConfig,
  query: string,
): QueryExecutionState {
  const minLength = config.minQueryLength ?? 1
  const initialQueryBehavior = resolveInitialQueryBehavior(config)

  if (query.length >= minLength) {
    return {
      effectiveQuery: query,
      enabled: true,
      isBelowMinLength: false,
    }
  }

  if (initialQueryBehavior !== false) {
    return {
      effectiveQuery: initialQueryBehavior.value,
      enabled: true,
      isBelowMinLength: false,
    }
  }

  return {
    effectiveQuery: '',
    enabled: false,
    isBelowMinLength: true,
  }
}

function getBranchAsyncState(
  node: SubmenuDef | SubpageDef,
  breadcrumbs: BreadcrumbNode[],
  searchQuery: string,
  coordinator: ReturnType<typeof useAsyncMenuCoordinator>,
): AsyncRenderState | undefined {
  if (!node.asyncNodes || !coordinator) {
    return undefined
  }

  const asyncLoaderId = getAsyncLoaderIdForBranch(node, breadcrumbs)
  const asyncResult = coordinator.loaders.get(asyncLoaderId)

  if (!asyncResult) {
    return undefined
  }

  const isBelowMinLength =
    node.asyncNodes.type === 'query'
      ? resolveQueryExecutionState(node.asyncNodes, searchQuery)
          .isBelowMinLength
      : false

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

function resolvedChildren(node: PopupMenuNode): ResolvedMenuNode[] {
  return node.children as ResolvedMenuNode[]
}

function isResolvedNodeOfKind<K extends NodeDef['kind']>(
  node: ResolvedMenuNode,
  kind: K,
): node is Extract<ResolvedMenuNode, { kind: K }> {
  return node.kind === kind
}

function isResolvedRowNode(
  node: ResolvedMenuNode,
): node is Extract<ResolvedMenuNode, { kind: RowNodeDef['kind'] }> {
  return (
    node.kind === 'item' ||
    node.kind === 'radio-item' ||
    node.kind === 'checkbox-item' ||
    node.kind === 'submenu' ||
    node.kind === 'subpage' ||
    node.kind === 'tree-item'
  )
}

function collectDisplaySubpages(
  nodes: readonly ResolvedMenuNode[],
  breadcrumbs: BreadcrumbNode[] = [],
  group: { id: string; label?: string } | null = null,
): DisplaySubpageNode[] {
  const result: DisplaySubpageNode[] = []

  for (const resolved of nodes) {
    const node = resolved.def
    if (node.kind === 'separator') {
      continue
    }

    if (node.kind === 'group') {
      result.push(
        ...collectDisplaySubpages(resolvedChildren(resolved), breadcrumbs, {
          id: node.id,
          label: node.label,
        }),
      )
      continue
    }

    if (node.kind === 'radio-group') {
      if (node.hidden) continue
      result.push(
        ...collectDisplaySubpages(
          resolvedChildren(resolved),
          breadcrumbs,
          null,
        ),
      )
      continue
    }

    if ('hidden' in node && node.hidden) {
      continue
    }

    if (node.kind === 'submenu' || node.kind === 'subpage') {
      if (node.kind === 'subpage') {
        const subpageNode = resolved as PopupMenuNode<SubpageDef>
        result.push({
          node: subpageNode,
          pageId: getSubpagePageId(subpageNode.def, breadcrumbs),
          context: {
            search: null,
            breadcrumbs,
            isDeepSearchResult: false,
            highlighted: false,
            disabled: node.disabled ?? false,
            group,
            tree: null,
          },
        })
      }

      const breadcrumb: BreadcrumbNode = {
        node,
        value: node.value,
        id: node.id,
      }

      result.push(
        ...collectDisplaySubpages(
          resolvedChildren(resolved),
          [...breadcrumbs, breadcrumb],
          null,
        ),
      )
    }
  }

  return result
}

export interface DataSubpagesContentProps extends DataSubpagesProps {}

/**
 * DataSubpages renders subpage content alongside the root Surface inside Popup.
 *
 * Place it as a sibling to DataSurface within Popup:
 *
 * ```tsx
 * <Popup>
 *   <DataSurface ...>
 *     ...
 *   </DataSurface>
 *   <DataSubpages />
 * </Popup>
 * ```
 */
export function DataSubpagesContent(props: DataSubpagesContentProps) {
  const { children } = props

  const coordinator = useAsyncMenuCoordinator()
  const searchQuery = coordinator?.searchQuery ?? ''

  const { resolvedNodes } = useDataPopupContext()

  const subpages = React.useMemo(
    () => (resolvedNodes ? collectDisplaySubpages(resolvedNodes) : []),
    [resolvedNodes],
  )

  const renderSubpageContent = React.useCallback(
    (displaySubpage: DisplaySubpageNode): React.ReactNode => {
      const { node: resolved, context, pageId } = displaySubpage
      const node = resolved.def

      const renderRowNode = (
        resolvedRowNode: ResolvedMenuNode,
        rowContext: RowRenderContext,
      ): React.ReactNode => {
        const rowNode = resolvedRowNode.def
        const rowId = resolvedRowNode.id

        if (rowNode.kind === 'item') {
          return (
            <React.Fragment key={rowId}>
              {rowNode.render({
                node: resolvedRowNode,
                props: {
                  id: rowId,
                  value: rowNode.value,
                  disabled: rowNode.disabled ?? false,
                  closeOnClick: rowNode.closeOnClick,
                  onSelect: rowNode.onSelect,
                  shortcut: rowNode.shortcut,
                },
                context: {
                  ...rowContext,
                  value: rowNode.value,
                  disabled: rowNode.disabled ?? false,
                },
              })}
            </React.Fragment>
          )
        }

        if (rowNode.kind === 'checkbox-item') {
          return (
            <React.Fragment key={rowId}>
              {rowNode.render({
                node: resolvedRowNode,
                props: {
                  id: rowId,
                  value: rowNode.value,
                  checked: rowNode.checked,
                  onCheckedChange: rowNode.onCheckedChange,
                  disabled: rowNode.disabled ?? false,
                  closeOnClick: rowNode.closeOnClick,
                },
                context: {
                  ...rowContext,
                  value: rowNode.value,
                  checked: rowNode.checked,
                  disabled: rowNode.disabled ?? false,
                },
              })}
            </React.Fragment>
          )
        }

        if (rowNode.kind === 'radio-item') {
          return (
            <React.Fragment key={rowId}>
              {rowNode.render({
                node: resolvedRowNode,
                props: {
                  id: rowId,
                  value: rowNode.value,
                  disabled: rowNode.disabled ?? false,
                  closeOnClick: rowNode.closeOnClick,
                  onSelect: rowNode.onSelect,
                  shortcut: rowNode.shortcut,
                },
                context: {
                  ...rowContext,
                  value: rowNode.value,
                  disabled: rowNode.disabled ?? false,
                },
              })}
            </React.Fragment>
          )
        }

        if (rowNode.kind === 'submenu') {
          const submenuAsyncState = getBranchAsyncState(
            rowNode,
            rowContext.breadcrumbs,
            searchQuery,
            coordinator,
          )
          const staticNodes = isResolvedNodeOfKind(resolvedRowNode, 'submenu')
            ? selectResolvedChildren(resolvedRowNode, rowNode.nodes ?? [])
            : []
          const submenuBreadcrumb: BreadcrumbNode = {
            node: rowNode,
            value: rowNode.value,
            id: rowNode.id,
          }

          const submenuRenderNode = (arg: PopupMenuNode) => {
            const resolvedArg = arg as ResolvedMenuNode
            const childNode = resolvedArg.def
            if (childNode.kind === 'separator') {
              return null
            }

            if (childNode.kind === 'group') {
              const groupItems = resolvedChildren(resolvedArg).filter(
                (
                  n,
                ): n is Extract<
                  ResolvedMenuNode,
                  { kind: RowNodeDef['kind'] }
                > =>
                  isResolvedRowNode(n) &&
                  n.kind !== 'radio-item' &&
                  n.kind !== 'tree-item' &&
                  !n.def.hidden,
              )

              if (groupItems.length === 0) {
                return null
              }

              const groupChildren = groupItems.map((item) =>
                renderRowNode(item, {
                  search: null,
                  breadcrumbs: [...rowContext.breadcrumbs, submenuBreadcrumb],
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
                  breadcrumbs: [...rowContext.breadcrumbs, submenuBreadcrumb],
                  isDeepSearchResult: false,
                }

                return (
                  <React.Fragment key={childNode.id}>
                    {childNode.render({
                      node: resolvedArg,
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
                // biome-ignore lint/a11y/useSemanticElements: ignore for now
                <div
                  key={childNode.id}
                  role="group"
                  aria-label={childNode.label}
                >
                  {groupChildren}
                </div>
              )
            }

            if (
              childNode.kind === 'radio-group' &&
              isResolvedNodeOfKind(resolvedArg, 'radio-group')
            ) {
              return renderRadioGroup(resolvedArg, [
                ...rowContext.breadcrumbs,
                submenuBreadcrumb,
              ])
            }

            if (
              !isResolvedRowNode(resolvedArg) ||
              (resolvedArg.kind !== 'item' &&
                resolvedArg.kind !== 'checkbox-item' &&
                resolvedArg.kind !== 'submenu' &&
                resolvedArg.kind !== 'subpage')
            ) {
              return null
            }

            return renderRowNode(resolvedArg, {
              search: null,
              breadcrumbs: [...rowContext.breadcrumbs, submenuBreadcrumb],
              isDeepSearchResult: false,
              highlighted: false,
              disabled: childNode.disabled ?? false,
              group: null,
              tree: null,
            })
          }

          return (
            <React.Fragment key={rowId}>
              <GraftPointContext.Provider value={resolvedRowNode}>
                {rowNode.render({
                  node: resolvedRowNode,
                  props: {
                    id: rowId,
                    value: rowNode.value,
                    disabled: rowNode.disabled ?? false,
                  },
                  context: {
                    ...rowContext,
                    value: rowNode.value,
                    disabled: rowNode.disabled ?? false,
                    async: submenuAsyncState,
                  },
                  nodes: staticNodes,
                  asyncContent: rowNode.asyncNodes,
                  renderNode: submenuRenderNode,
                })}
              </GraftPointContext.Provider>
            </React.Fragment>
          )
        }

        if (!isResolvedNodeOfKind(resolvedRowNode, 'subpage')) {
          return null
        }
        const subpageNode = resolvedRowNode.def
        const subpageAsyncState = getBranchAsyncState(
          subpageNode,
          rowContext.breadcrumbs,
          searchQuery,
          coordinator,
        )
        const targetPageId = getSubpagePageId(
          subpageNode,
          rowContext.breadcrumbs,
        )

        return (
          <React.Fragment key={targetPageId}>
            {subpageNode.renderTrigger({
              node: resolvedRowNode,
              props: {
                id: rowId,
                value: subpageNode.value,
                disabled: subpageNode.disabled ?? false,
                targetPageId,
              },
              context: {
                ...rowContext,
                value: subpageNode.value,
                disabled: subpageNode.disabled ?? false,
                async: subpageAsyncState,
              },
            })}
          </React.Fragment>
        )
      }

      const renderRadioGroup = (
        radioGroupNode: ResolvedMenuNodeOf<RadioGroupDef>,
        breadcrumbs: BreadcrumbNode[] = [],
      ): React.ReactNode => {
        const radioGroup = radioGroupNode.def
        const isDeepSearchResult = breadcrumbs.length > 0

        const groupContext: GroupRenderContext = {
          search: null,
          matchCount: radioGroup.nodes.length,
          breadcrumbs,
          isDeepSearchResult,
        }

        const childElements = resolvedChildren(radioGroupNode).map((item) => {
          if (!isResolvedRowNode(item) || item.def.hidden) return null

          return renderRowNode(item, {
            search: null,
            breadcrumbs,
            isDeepSearchResult,
            highlighted: false,
            disabled: item.def.disabled ?? false,
            group: null,
            tree: null,
          })
        })

        if (radioGroup.render) {
          return (
            <React.Fragment key={radioGroup.id}>
              {radioGroup.render({
                node: radioGroupNode,
                props: {
                  value: radioGroup.value,
                  onValueChange: radioGroup.onValueChange,
                  disabled: radioGroup.disabled ?? false,
                },
                context: {
                  ...groupContext,
                  label: radioGroup.label,
                  value: radioGroup.value,
                  disabled: radioGroup.disabled ?? false,
                },
                children: <>{childElements}</>,
              })}
            </React.Fragment>
          )
        }

        return (
          <div
            key={radioGroup.id}
            role="radiogroup"
            aria-label={radioGroup.label}
          >
            {childElements}
          </div>
        )
      }

      return (
        <React.Fragment key={pageId}>
          <GraftPointContext.Provider value={resolved}>
            {node.renderContent({
              node: resolved,
              pageId,
              context: {
                ...context,
                value: node.value,
                disabled: node.disabled ?? false,
                async: getBranchAsyncState(
                  node,
                  context.breadcrumbs,
                  searchQuery,
                  coordinator,
                ),
              },
              nodes: selectResolvedChildren(resolved, node.nodes ?? []),
              asyncContent: node.asyncNodes,
              renderNode: (arg) => {
                const resolvedArg = arg as ResolvedMenuNode
                const childNode = resolvedArg.def
                if (childNode.kind === 'separator') {
                  return null
                }

                if (childNode.kind === 'group') {
                  const groupItems = resolvedChildren(resolvedArg).filter(
                    (
                      n,
                    ): n is Extract<
                      ResolvedMenuNode,
                      { kind: RowNodeDef['kind'] }
                    > =>
                      isResolvedRowNode(n) &&
                      n.kind !== 'radio-item' &&
                      n.kind !== 'tree-item' &&
                      !n.def.hidden,
                  )

                  if (groupItems.length === 0) {
                    return null
                  }

                  const groupChildren = groupItems.map((item) =>
                    renderRowNode(item, {
                      search: null,
                      breadcrumbs: [
                        ...context.breadcrumbs,
                        {
                          node,
                          value: node.value,
                          id: node.id,
                        },
                      ],
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
                      breadcrumbs: [
                        ...context.breadcrumbs,
                        {
                          node,
                          value: node.value,
                          id: node.id,
                        },
                      ],
                      isDeepSearchResult: false,
                    }

                    return (
                      <React.Fragment key={childNode.id}>
                        {childNode.render({
                          node: arg,
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
                    // biome-ignore lint/a11y/useSemanticElements: ignore for now
                    <div
                      key={childNode.id}
                      role="group"
                      aria-label={childNode.label}
                    >
                      {groupChildren}
                    </div>
                  )
                }

                if (
                  childNode.kind === 'radio-group' &&
                  isResolvedNodeOfKind(resolvedArg, 'radio-group')
                ) {
                  return renderRadioGroup(resolvedArg, [
                    ...context.breadcrumbs,
                    {
                      node,
                      value: node.value,
                      id: node.id,
                    },
                  ])
                }

                if (
                  !isResolvedRowNode(resolvedArg) ||
                  (resolvedArg.kind !== 'item' &&
                    resolvedArg.kind !== 'checkbox-item' &&
                    resolvedArg.kind !== 'submenu' &&
                    resolvedArg.kind !== 'subpage')
                ) {
                  return null
                }

                return renderRowNode(resolvedArg, {
                  search: null,
                  breadcrumbs: [
                    ...context.breadcrumbs,
                    {
                      node,
                      value: node.value,
                      id: node.id,
                    },
                  ],
                  isDeepSearchResult: false,
                  highlighted: false,
                  disabled: childNode.disabled ?? false,
                  group: null,
                  tree: null,
                })
              },
            })}
          </GraftPointContext.Provider>
        </React.Fragment>
      )
    },
    [coordinator, searchQuery],
  )

  const childrenState: DataSubpagesChildrenState = {
    subpages,
    renderSubpageContent,
  }

  if (children) {
    return <>{children(childrenState)}</>
  }

  return <>{subpages.map(renderSubpageContent)}</>
}
