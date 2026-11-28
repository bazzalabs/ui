'use client'

import * as React from 'react'
import { PopupMenuCheckboxGroupValue } from '../components/checkbox-group/checkbox-group-value.js'
import {
  GraftPointContext,
  useGraftPoint,
} from '../contexts/graft-point-context.js'
import { useMenuTree } from '../contexts/menu-tree-context.js'
import { usePopupSurfaceId } from '../contexts/popup-surface-id-context.js'
import { useMaybeMenuSurfaceTier } from '../contexts/surface-tier-context.js'
import { staticChildrenOf } from '../menu-tree/resolve.js'
import type { PopupMenuNode } from '../menu-tree/types.js'
import { useAsyncMenuCoordinator } from './async-coordinator.js'
import {
  DataPopupContext,
  type DataPopupContextValue,
  ENGINE_SETTERS,
  type ResolvedNodesSlot,
} from './context.js'
import {
  getBranchAsyncState,
  renderBranchChild,
  renderSelectionContainer,
} from './data-list.js'
import { isRowMenuNode } from './type-guards.js'
import type {
  BreadcrumbNode,
  CheckboxGroupDef,
  DataSubpagesChildrenState,
  DataSubpagesProps,
  DisplaySubpageNode,
  RadioGroupDef,
  RowNodeDef,
  RowRenderContext,
  SubmenuDef,
  SubpageDef,
} from './types.js'

function collectDisplaySubpages(
  nodes: readonly PopupMenuNode[],
  breadcrumbs: BreadcrumbNode[] = [],
  group: { id: string; label?: string } | null = null,
): DisplaySubpageNode[] {
  const result: DisplaySubpageNode[] = []

  for (const node of nodes) {
    const def = node.def
    if (def.kind === 'separator') {
      continue
    }

    if (def.kind === 'group') {
      result.push(
        ...collectDisplaySubpages(node.children, breadcrumbs, {
          id: def.id,
          label: def.label,
        }),
      )
      continue
    }

    if (def.kind === 'radio-group') {
      if (def.hidden) continue
      result.push(...collectDisplaySubpages(node.children, breadcrumbs, null))
      continue
    }

    if (def.kind === 'checkbox-group') {
      if (def.hidden) continue
      result.push(...collectDisplaySubpages(node.children, breadcrumbs, null))
      continue
    }

    if (def.hidden) {
      continue
    }

    if (def.kind === 'submenu' || def.kind === 'subpage') {
      if (def.kind === 'subpage') {
        result.push({
          node: node as PopupMenuNode<SubpageDef>,
          pageId: node.id,
          context: {
            search: null,
            breadcrumbs,
            isDeepSearchResult: false,
            highlighted: false,
            disabled: def.disabled ?? false,
            group,
            tree: null,
          },
        })
      }

      if (node.children.length) {
        const breadcrumb: BreadcrumbNode = {
          node: def,
          menuNode: node as PopupMenuNode<SubmenuDef | SubpageDef>,
          value: def.value,
          id: def.id,
        }

        result.push(
          ...collectDisplaySubpages(
            node.children,
            [...breadcrumbs, breadcrumb],
            null,
          ),
        )
      }
    }
  }

  return result
}

/**
 * Reads the Menu Nodes a popup's root list renders from the menu tree: the
 * root's nodes, or its graft point's children in a submenu popup.
 */
function usePopupNodes(): () => readonly PopupMenuNode[] {
  const tree = useMenuTree()
  const graftPoint = useGraftPoint()
  const depth = useMaybeMenuSurfaceTier()?.depth ?? 0
  return React.useCallback(
    () =>
      graftPoint
        ? graftPoint.children
        : depth === 0
          ? tree.resolver.rootNodes
          : EMPTY_NODES,
    [tree, graftPoint, depth],
  )
}

const EMPTY_NODES: readonly PopupMenuNode[] = []

/**
 * Provides `DataPopupContext` for a popup, derived from the menu tree: the
 * popup's root data surface, and a slot of the nodes its root list resolved
 * (kept while the list is unmounted), or the slot a consumer set, until the
 * root list republishes (after every content change and every graft).
 */
export function DataPopupProvider({ children }: { children: React.ReactNode }) {
  const tree = useMenuTree()
  const popupId = usePopupSurfaceId() ?? ''
  const data = tree.useState('popup', popupId)
  const version = tree.useState('version')
  const getNodes = usePopupNodes()
  const nodes = getNodes()

  React.useLayoutEffect(
    () => () => tree.updatePopup(popupId, null),
    [tree, popupId],
  )
  const setters = React.useMemo(() => {
    // The slot as the tree has it now: the consumer's, or the one derived
    // from the content the root list resolved.
    const current = (): ResolvedNodesSlot | null => {
      const { slot, content } = tree.select('popup', popupId)
      if (slot !== undefined) return slot
      return content
        ? { nodes: getNodes(), graftVersion: tree.state.version, content }
        : null
    }
    const value: Pick<
      DataPopupContextValue,
      'setDataSurfaceContext' | 'setResolvedNodes'
    > = {
      setDataSurfaceContext: (action) =>
        tree.updatePopup(popupId, {
          surface:
            typeof action === 'function'
              ? action(tree.select('popup', popupId).surface ?? null)
              : action,
        }),
      setResolvedNodes: (action) =>
        tree.updatePopup(popupId, {
          slot: typeof action === 'function' ? action(current()) : action,
        }),
    }
    ENGINE_SETTERS.add(value.setResolvedNodes)
    return value
  }, [tree, popupId, getNodes])

  const value = React.useMemo(
    (): DataPopupContextValue => ({
      ...setters,
      dataSurfaceContext: data.surface ?? null,
      resolvedNodes:
        data.slot !== undefined
          ? data.slot
          : data.content
            ? { nodes, graftVersion: version, content: data.content }
            : null,
    }),
    [setters, data, nodes, version],
  )

  return (
    <DataPopupContext.Provider value={value}>
      {children}
    </DataPopupContext.Provider>
  )
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

  const dataPopup = React.useContext(DataPopupContext)
  const dataSurfaceContext = dataPopup?.dataSurfaceContext
  const resolvedNodes = dataPopup?.resolvedNodes
  const tree = useMenuTree()
  const popupId = usePopupSurfaceId() ?? ''
  const getNodes = usePopupNodes()
  // A retained slot is only valid while the root surface still supplies the
  // content it was published for (the root list unmounts while a subpage is
  // active, so it cannot resolve the new content on its own).
  const slot =
    resolvedNodes &&
    (!dataSurfaceContext ||
      resolvedNodes.content === dataSurfaceContext.content)
      ? resolvedNodes
      : null
  // A slot derived from the tree (no consumer set one) takes its nodes from
  // the tree as the outlet renders, after the root list resolved them in the
  // same render.
  const roots = slot
    ? tree.select('popup', popupId).slot === undefined
      ? getNodes()
      : slot.nodes
    : EMPTY_NODES
  const graftVersion = slot?.graftVersion ?? 0
  // biome-ignore lint/correctness/useExhaustiveDependencies: graftVersion changes with grafts under branch nodes, which do not change `roots` identity
  const subpages = React.useMemo(
    () => collectDisplaySubpages(roots),
    [roots, graftVersion],
  )

  const renderSubpageContent = React.useCallback(
    (displaySubpage: DisplaySubpageNode): React.ReactNode => {
      const { node: resolved, context, pageId } = displaySubpage
      const node = resolved.def
      const subpageBreadcrumb: BreadcrumbNode = {
        node,
        menuNode: resolved,
        value: node.value,
        id: node.id,
      }
      const renderRowNode = (
        rowMenuNode: PopupMenuNode<RowNodeDef>,
        rowContext: RowRenderContext,
        checkboxGroup?: { id: string; label?: string; def: CheckboxGroupDef },
      ): React.ReactNode => {
        const rowNode = rowMenuNode.def
        const rowId = rowMenuNode.id

        if (rowNode.kind === 'item') {
          return (
            <React.Fragment key={rowId}>
              {rowNode.render({
                node: rowMenuNode,
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

        if (rowNode.kind === 'link-item') {
          return (
            <React.Fragment key={rowId}>
              {rowNode.render({
                node: rowMenuNode,
                props: {
                  id: rowId,
                  value: rowNode.value,
                  href: rowNode.href,
                  disabled: rowNode.disabled ?? false,
                  closeOnClick: rowNode.closeOnClick,
                  onSelect: rowNode.onSelect,
                  shortcut: rowNode.shortcut,
                  forceOrder: rowNode.forceOrder,
                  forceScore: rowNode.forceScore,
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
          const rendered = rowNode.render({
            node: rowMenuNode,
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
              checked: checkboxGroup
                ? checkboxGroup.def.value.includes(rowNode.value)
                : rowNode.checked,
              disabled: rowNode.disabled ?? false,
            },
          })
          return (
            <React.Fragment key={rowId}>
              {checkboxGroup ? (
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
              )}
            </React.Fragment>
          )
        }

        if (rowNode.kind === 'radio-item') {
          return (
            <React.Fragment key={rowId}>
              {rowNode.render({
                node: rowMenuNode,
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
            rowMenuNode as PopupMenuNode<SubmenuDef>,
            searchQuery,
            coordinator,
          )
          const staticChildren = staticChildrenOf(rowMenuNode)
          const submenuBreadcrumb: BreadcrumbNode = {
            node: rowNode,
            menuNode: rowMenuNode as PopupMenuNode<SubmenuDef>,
            value: rowNode.value,
            id: rowNode.id,
          }

          const submenuRenderNode = (arg: PopupMenuNode) =>
            renderChildNode(arg, [...rowContext.breadcrumbs, submenuBreadcrumb])

          return (
            <React.Fragment key={rowId}>
              {rowNode.render({
                node: rowMenuNode,
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
                nodes: staticChildren,
                asyncContent: rowNode.asyncNodes,
                renderNode: submenuRenderNode,
              })}
            </React.Fragment>
          )
        }

        if (rowNode.kind !== 'subpage') return null

        const subpageAsyncState = getBranchAsyncState(
          rowMenuNode as PopupMenuNode<SubpageDef>,
          searchQuery,
          coordinator,
        )
        const targetPageId = rowMenuNode.id

        return (
          <React.Fragment key={targetPageId}>
            {rowNode.renderTrigger({
              node: rowMenuNode,
              props: {
                id: rowId,
                value: rowNode.value,
                disabled: rowNode.disabled ?? false,
                targetPageId,
              },
              context: {
                ...rowContext,
                value: rowNode.value,
                disabled: rowNode.disabled ?? false,
                async: subpageAsyncState,
              },
            })}
          </React.Fragment>
        )
      }

      const renderChildNode = (
        arg: PopupMenuNode,
        breadcrumbs: BreadcrumbNode[],
      ): React.ReactNode =>
        renderBranchChild(arg, breadcrumbs, renderRowNode, renderSelectionGroup)

      // A radio group or a checkbox group: the same params, and a checkbox
      // group's rows read its value.
      const renderSelectionGroup = (
        groupMenuNode: PopupMenuNode<RadioGroupDef | CheckboxGroupDef>,
        breadcrumbs: BreadcrumbNode[] = [],
      ): React.ReactNode => {
        const group = groupMenuNode.def
        const isDeepSearchResult = breadcrumbs.length > 0
        const childElements = groupMenuNode.children.map((item) => {
          if (!isRowMenuNode(item) || item.def.hidden) return null
          return renderRowNode(
            item,
            {
              search: null,
              breadcrumbs,
              isDeepSearchResult,
              highlighted: false,
              disabled: item.def.disabled ?? false,
              group: null,
              tree: null,
            },
            group.kind === 'checkbox-group'
              ? { id: group.id, label: group.label, def: group }
              : undefined,
          )
        })
        return renderSelectionContainer(
          groupMenuNode,
          {
            search: null,
            matchCount: group.nodes.length,
            breadcrumbs,
            isDeepSearchResult,
          },
          childElements,
          false,
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
                  resolved as PopupMenuNode<SubpageDef>,
                  searchQuery,
                  coordinator,
                ),
              },
              nodes: staticChildrenOf(resolved),
              asyncContent: node.asyncNodes,
              renderNode: (arg: PopupMenuNode) =>
                renderChildNode(arg, [
                  ...context.breadcrumbs,
                  subpageBreadcrumb,
                ]),
            })}
          </GraftPointContext.Provider>
        </React.Fragment>
      )
    },
    [coordinator, searchQuery],
  )

  if (!dataSurfaceContext) {
    return null
  }

  const childrenState: DataSubpagesChildrenState = {
    subpages,
    renderSubpageContent,
  }

  if (children) {
    return <>{children(childrenState)}</>
  }

  return <>{subpages.map(renderSubpageContent)}</>
}
