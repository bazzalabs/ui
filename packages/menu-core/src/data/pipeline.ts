// ============================================================================
// Full Pipeline
// ============================================================================

import type { FilterFn } from '../text/filter.js'
import type { IncludeInDeepSearch } from '../tree/branch-config.js'
import type { AnyMenuNode, MenuNodeOfKind } from '../tree/menu-node.js'
import { getBrowseNodesPreserve } from './browse.js'
import { buildDisplayRowNode, buildDisplayRowNodes } from './display.js'
import { flattenNodes } from './flatten.js'
import { scoreNodes } from './score.js'
import {
  compareScoredNodesByForceOrderAndScore,
  deduplicateNodes,
  getDisplayRowForceOrder,
  getDisplayRowScore,
  getMinForceOrderFromDisplayRows,
  getRowKindSortRank,
  partitionByKind,
  sortByForceOrderThenKindThenScore,
  sortByScore,
} from './sort.js'
import type {
  BreadcrumbNode,
  CheckboxGroupBehavior,
  DisabledBranchBehavior,
  FlattenedNode,
  GroupBehavior,
  GroupRenderContext,
  PipelineDisplayCheckboxGroupNode,
  PipelineDisplayGroupNode,
  PipelineDisplayNode,
  PipelineDisplayRadioGroupNode,
  PipelineDisplayRowNode,
  PipelineDisplayTypes,
  PipelineMenuNode,
  RadioGroupBehavior,
  ScoredNode,
} from './types.js'

type GroupMenuNode<N extends PipelineMenuNode<N>> = MenuNodeOfKind<N, 'group'>
type RadioGroupMenuNode<N extends PipelineMenuNode<N>> = MenuNodeOfKind<
  N,
  'radio-group'
>
type CheckboxGroupMenuNode<N extends PipelineMenuNode<N>> = MenuNodeOfKind<
  N,
  'checkbox-group'
>

// Full Pipeline
// ============================================================================

export interface FilterNodesOptions<
  N extends PipelineMenuNode<N> = AnyMenuNode,
> {
  /** The search query, already normalized by the listbox store */
  query: string
  /** The node definitions to filter */
  nodes: readonly N[]
  /** Currently highlighted node ID */
  highlightedId: string | null
  /** Whether deep search is enabled */
  deepSearch?: boolean
  /** Default include mode for descendant submenus during deep search */
  includeInDeepSearch?: IncludeInDeepSearch
  /** How descendants of disabled branches participate in deep search */
  disabledBranchBehavior?: DisabledBranchBehavior
  /** Minimum query length for deep search */
  minLength?: number
  /** How groups behave during search (only applies when searching, not browse mode) */
  groupSearchBehavior?: GroupBehavior
  /** How radio groups behave during search */
  radioGroupSearchBehavior?: RadioGroupBehavior
  /** How checkbox groups behave during search */
  checkboxGroupSearchBehavior?: CheckboxGroupBehavior
  /** Whether to sort groups by best score */
  sortGroups?: boolean
  /**
   * Scores each node against the query (`commandScore` by default). `false`
   * turns filtering off: every node shows as it does with no query.
   */
  filter?: FilterFn | false
}

/** Options for a search that filters: `filter` is a function or the default. */
type SearchFilterNodesOptions<N extends PipelineMenuNode<N>> = Omit<
  FilterNodesOptions<N>,
  'filter'
> & {
  filter?: FilterFn
}

/** What `filterNodes` returns: the surface's Display Nodes. */
export interface FilterNodesResult<
  N extends PipelineMenuNode<N> = AnyMenuNode,
> {
  displayNodes: PipelineDisplayNode<N>[]
  isDeepSearching: boolean
}

/**
 * Filters nodes with 'flatten' group behavior.
 * Groups are invisible, items shown in flat list.
 * Radio group behavior is controlled by radioGroupSearchBehavior.
 * Checkbox group behavior is controlled by checkboxGroupSearchBehavior.
 */
function filterNodesFlatten<N extends PipelineMenuNode<N>>(
  options: SearchFilterNodesOptions<N>,
): FilterNodesResult<N> {
  const {
    query,
    nodes,
    highlightedId,
    deepSearch = true,
    includeInDeepSearch = true,
    disabledBranchBehavior = 'exclude',
    minLength = 0,
    radioGroupSearchBehavior = 'preserve',
    checkboxGroupSearchBehavior = 'preserve',
    filter,
  } = options

  // Determine if deep search should activate
  const shouldDeepSearch = deepSearch && query.length >= minLength

  // Flatten nodes
  const flattened = flattenNodes(nodes, {
    deep: shouldDeepSearch,
    includeInDeepSearch,
    disabledBranchBehavior,
  })

  // For preserve-show-all, we need to track ALL radio group items before scoring
  // Maps radio group ID -> all flattened nodes for that group
  const allRadioGroupItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupMenuNode<N>['def']
      menuNode: RadioGroupMenuNode<N>
      items: FlattenedNode<PipelineDisplayTypes<N>>[]
      breadcrumbs: BreadcrumbNode<PipelineDisplayTypes<N>>[]
    }
  >()

  if (radioGroupSearchBehavior === 'preserve-show-all') {
    for (const flatNode of flattened) {
      if (flatNode.radioGroup) {
        const existing = allRadioGroupItems.get(flatNode.radioGroup.id)
        if (existing) {
          existing.items.push(flatNode)
        } else {
          allRadioGroupItems.set(flatNode.radioGroup.id, {
            radioGroupDef: flatNode.radioGroup.radioGroupDef,
            menuNode: flatNode.radioGroup.menuNode,
            items: [flatNode],
            breadcrumbs: flatNode.breadcrumbs,
          })
        }
      }
    }
  }

  // For preserve-show-all, track ALL checkbox group items before scoring.
  const allCheckboxGroupItems = new Map<
    string,
    {
      checkboxGroupDef: CheckboxGroupMenuNode<N>['def']
      menuNode: CheckboxGroupMenuNode<N>
      items: FlattenedNode<PipelineDisplayTypes<N>>[]
      breadcrumbs: BreadcrumbNode<PipelineDisplayTypes<N>>[]
    }
  >()

  if (checkboxGroupSearchBehavior === 'preserve-show-all') {
    for (const flatNode of flattened) {
      if (flatNode.checkboxGroup) {
        const existing = allCheckboxGroupItems.get(flatNode.checkboxGroup.id)
        if (existing) {
          existing.items.push(flatNode)
        } else {
          allCheckboxGroupItems.set(flatNode.checkboxGroup.id, {
            checkboxGroupDef: flatNode.checkboxGroup.checkboxGroupDef,
            menuNode: flatNode.checkboxGroup.menuNode,
            items: [flatNode],
            breadcrumbs: flatNode.breadcrumbs,
          })
        }
      }
    }
  }

  // Score nodes
  const scored = scoreNodes(flattened, query, filter)

  // Separate radio group items from regular items
  const radioGroupItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupMenuNode<N>['def']
      menuNode: RadioGroupMenuNode<N>
      items: ScoredNode<PipelineDisplayTypes<N>>[]
      breadcrumbs: BreadcrumbNode<PipelineDisplayTypes<N>>[]
    }
  >()
  const checkboxGroupItems = new Map<
    string,
    {
      checkboxGroupDef: CheckboxGroupMenuNode<N>['def']
      menuNode: CheckboxGroupMenuNode<N>
      items: ScoredNode<PipelineDisplayTypes<N>>[]
      breadcrumbs: BreadcrumbNode<PipelineDisplayTypes<N>>[]
    }
  >()
  const regularItems: ScoredNode<PipelineDisplayTypes<N>>[] = []

  for (const scoredNode of scored) {
    if (scoredNode.radioGroup) {
      // For 'flatten' behavior, treat radio items as regular items
      if (radioGroupSearchBehavior === 'flatten') {
        regularItems.push(scoredNode)
      } else {
        // For 'preserve' and 'preserve-show-all', group them
        const existing = radioGroupItems.get(scoredNode.radioGroup.id)
        if (existing) {
          existing.items.push(scoredNode)
        } else {
          radioGroupItems.set(scoredNode.radioGroup.id, {
            radioGroupDef: scoredNode.radioGroup.radioGroupDef,
            menuNode: scoredNode.radioGroup.menuNode,
            items: [scoredNode],
            breadcrumbs: scoredNode.breadcrumbs,
          })
        }
      }
    } else if (scoredNode.checkboxGroup) {
      if (checkboxGroupSearchBehavior === 'flatten') {
        regularItems.push(scoredNode)
      } else {
        const existing = checkboxGroupItems.get(scoredNode.checkboxGroup.id)
        if (existing) {
          existing.items.push(scoredNode)
        } else {
          checkboxGroupItems.set(scoredNode.checkboxGroup.id, {
            checkboxGroupDef: scoredNode.checkboxGroup.checkboxGroupDef,
            menuNode: scoredNode.checkboxGroup.menuNode,
            items: [scoredNode],
            breadcrumbs: scoredNode.breadcrumbs,
          })
        }
      }
    } else {
      regularItems.push(scoredNode)
    }
  }

  // Sort regular items by score
  const sorted = sortByScore(regularItems)

  // Partition (items first, then submenus)
  const partitioned = partitionByKind(sorted)

  // Deduplicate
  const unique = deduplicateNodes(partitioned)

  // Build display nodes for regular items
  const regularDisplayNodes: PipelineDisplayRowNode<N>[] = buildDisplayRowNodes(
    unique,
    query,
    highlightedId,
  )

  // Build display nodes for radio groups
  const radioGroupDisplayNodes: PipelineDisplayRadioGroupNode<N>[] = []

  if (radioGroupSearchBehavior !== 'flatten') {
    for (const [
      radioGroupId,
      { items: matchingItems, breadcrumbs },
    ] of radioGroupItems) {
      let itemsToDisplay: ScoredNode<PipelineDisplayTypes<N>>[]

      if (radioGroupSearchBehavior === 'preserve-show-all') {
        // Include ALL items from this radio group, not just matching ones
        const allItems = allRadioGroupItems.get(radioGroupId)
        if (allItems) {
          // Create scored nodes for all items, using 0 for non-matching
          const matchingScores = new Map(
            matchingItems.map((item) => [item.node.id, item.score]),
          )

          itemsToDisplay = allItems.items.map((flatNode) => ({
            node: flatNode.node,
            score: matchingScores.get(flatNode.node.id) ?? 0,
            breadcrumbs: flatNode.breadcrumbs,
            group: flatNode.group,
            radioGroup: flatNode.radioGroup,
            checkboxGroup: flatNode.checkboxGroup,
          }))
        } else {
          itemsToDisplay = matchingItems
        }
      } else {
        // 'preserve' - only show matching items
        itemsToDisplay = matchingItems
      }

      // Sort items by forced order, then score.
      itemsToDisplay.sort(compareScoredNodesByForceOrderAndScore)

      const bestScore = Math.max(...itemsToDisplay.map((item) => item.score), 0)
      const isDeepSearchResult = breadcrumbs.length > 0

      const groupContext: GroupRenderContext<PipelineDisplayTypes<N>> = {
        search: query ? { query, bestScore } : null,
        matchCount: matchingItems.length,
        breadcrumbs,
        isDeepSearchResult,
      }

      radioGroupDisplayNodes.push({
        kind: 'radio-group',
        node: radioGroupItems.get(radioGroupId)!.menuNode,
        context: groupContext,
        items: itemsToDisplay.map((item) =>
          buildDisplayRowNode(item, query, highlightedId),
        ),
        bestScore,
      })
    }
  }

  const checkboxGroupDisplayNodes: PipelineDisplayCheckboxGroupNode<N>[] = []

  if (checkboxGroupSearchBehavior !== 'flatten') {
    for (const [
      checkboxGroupId,
      { items: matchingItems, breadcrumbs, menuNode },
    ] of checkboxGroupItems) {
      let itemsToDisplay: ScoredNode<PipelineDisplayTypes<N>>[]
      if (checkboxGroupSearchBehavior === 'preserve-show-all') {
        const allItems = allCheckboxGroupItems.get(checkboxGroupId)
        if (allItems) {
          const matchingScores = new Map(
            matchingItems.map((item) => [item.node.id, item.score]),
          )
          itemsToDisplay = allItems.items.map((flatNode) => ({
            node: flatNode.node,
            score: matchingScores.get(flatNode.node.id) ?? 0,
            breadcrumbs: flatNode.breadcrumbs,
            group: flatNode.group,
            radioGroup: flatNode.radioGroup,
            checkboxGroup: flatNode.checkboxGroup,
          }))
        } else {
          itemsToDisplay = matchingItems
        }
      } else {
        itemsToDisplay = matchingItems
      }
      itemsToDisplay.sort(compareScoredNodesByForceOrderAndScore)
      const bestScore = Math.max(...itemsToDisplay.map((item) => item.score), 0)
      const groupContext: GroupRenderContext<PipelineDisplayTypes<N>> = {
        search: query ? { query, bestScore } : null,
        matchCount: matchingItems.length,
        breadcrumbs,
        isDeepSearchResult: breadcrumbs.length > 0,
      }
      checkboxGroupDisplayNodes.push({
        kind: 'checkbox-group',
        node: menuNode,
        context: groupContext,
        items: itemsToDisplay.map((item) =>
          buildDisplayRowNode(item, query, highlightedId),
        ),
        bestScore,
      })
    }
  }

  // Merge regular items, radio groups, and checkbox groups, sorted by forced order then score.
  type SortableNode = {
    node: PipelineDisplayNode<N>
    score: number
    forceOrder: number
    kindRank: number
  }

  const allNodes: SortableNode[] = [
    ...regularDisplayNodes.map((r) => ({
      node: r as PipelineDisplayNode<N>,
      score: getDisplayRowScore(r),
      forceOrder: getDisplayRowForceOrder(r),
      kindRank: getRowKindSortRank(r.node.kind),
    })),
    ...radioGroupDisplayNodes.map((r) => ({
      node: r as PipelineDisplayNode<N>,
      score: r.bestScore,
      forceOrder: getMinForceOrderFromDisplayRows(r.items),
      kindRank: 0,
    })),
    ...checkboxGroupDisplayNodes.map((r) => ({
      node: r as PipelineDisplayNode<N>,
      score: r.bestScore,
      forceOrder: getMinForceOrderFromDisplayRows(r.items),
      kindRank: 0,
    })),
  ]

  allNodes.sort(sortByForceOrderThenKindThenScore)

  return {
    displayNodes: allNodes.map((n) => n.node),
    isDeepSearching: shouldDeepSearch,
  }
}

/**
 * Filters nodes with 'preserve' group behavior.
 * Groups are shown as containers with their matching items.
 * Groups and ungrouped items are mixed by score.
 * Radio group behavior is controlled by radioGroupSearchBehavior.
 * Checkbox group behavior is controlled by checkboxGroupSearchBehavior.
 */
function filterNodesPreserve<N extends PipelineMenuNode<N>>(
  options: SearchFilterNodesOptions<N>,
): FilterNodesResult<N> {
  const {
    query,
    nodes,
    highlightedId,
    deepSearch = true,
    includeInDeepSearch = true,
    disabledBranchBehavior = 'exclude',
    minLength = 0,
    sortGroups = true,
    radioGroupSearchBehavior = 'preserve',
    checkboxGroupSearchBehavior = 'preserve',
    filter,
  } = options

  // Determine if deep search should activate
  const shouldDeepSearch = deepSearch && query.length >= minLength

  // Flatten nodes (tracking group, radio group, and checkbox group membership)
  const flattened = flattenNodes(nodes, {
    deep: shouldDeepSearch,
    includeInDeepSearch,
    disabledBranchBehavior,
  })

  // For preserve-show-all, we need to track ALL radio group items before scoring
  const allRadioGroupItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupMenuNode<N>['def']
      menuNode: RadioGroupMenuNode<N>
      items: FlattenedNode<PipelineDisplayTypes<N>>[]
      breadcrumbs: BreadcrumbNode<PipelineDisplayTypes<N>>[]
    }
  >()

  if (radioGroupSearchBehavior === 'preserve-show-all') {
    for (const flatNode of flattened) {
      if (flatNode.radioGroup) {
        const existing = allRadioGroupItems.get(flatNode.radioGroup.id)
        if (existing) {
          existing.items.push(flatNode)
        } else {
          allRadioGroupItems.set(flatNode.radioGroup.id, {
            radioGroupDef: flatNode.radioGroup.radioGroupDef,
            menuNode: flatNode.radioGroup.menuNode,
            items: [flatNode],
            breadcrumbs: flatNode.breadcrumbs,
          })
        }
      }
    }
  }

  const allCheckboxGroupItems = new Map<
    string,
    {
      checkboxGroupDef: CheckboxGroupMenuNode<N>['def']
      menuNode: CheckboxGroupMenuNode<N>
      items: FlattenedNode<PipelineDisplayTypes<N>>[]
      breadcrumbs: BreadcrumbNode<PipelineDisplayTypes<N>>[]
    }
  >()

  if (checkboxGroupSearchBehavior === 'preserve-show-all') {
    for (const flatNode of flattened) {
      if (flatNode.checkboxGroup) {
        const existing = allCheckboxGroupItems.get(flatNode.checkboxGroup.id)
        if (existing) {
          existing.items.push(flatNode)
        } else {
          allCheckboxGroupItems.set(flatNode.checkboxGroup.id, {
            checkboxGroupDef: flatNode.checkboxGroup.checkboxGroupDef,
            menuNode: flatNode.checkboxGroup.menuNode,
            items: [flatNode],
            breadcrumbs: flatNode.breadcrumbs,
          })
        }
      }
    }
  }

  // Score nodes
  const scored = scoreNodes(flattened, query, filter)

  // Partition into groups, radio groups, and ungrouped
  const groupedItems = new Map<
    string,
    {
      groupDef: GroupMenuNode<N>['def']
      menuNode: GroupMenuNode<N>
      items: ScoredNode<PipelineDisplayTypes<N>>[]
      breadcrumbs: BreadcrumbNode<PipelineDisplayTypes<N>>[]
    }
  >()
  const radioGroupedItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupMenuNode<N>['def']
      menuNode: RadioGroupMenuNode<N>
      items: ScoredNode<PipelineDisplayTypes<N>>[]
      breadcrumbs: BreadcrumbNode<PipelineDisplayTypes<N>>[]
    }
  >()
  const checkboxGroupedItems = new Map<
    string,
    {
      checkboxGroupDef: CheckboxGroupMenuNode<N>['def']
      menuNode: CheckboxGroupMenuNode<N>
      items: ScoredNode<PipelineDisplayTypes<N>>[]
      breadcrumbs: BreadcrumbNode<PipelineDisplayTypes<N>>[]
    }
  >()
  const ungroupedItems: ScoredNode<PipelineDisplayTypes<N>>[] = []

  for (const scoredNode of scored) {
    if (scoredNode.radioGroup) {
      // For 'flatten' behavior, treat radio items as ungrouped
      if (radioGroupSearchBehavior === 'flatten') {
        ungroupedItems.push(scoredNode)
      } else {
        const existing = radioGroupedItems.get(scoredNode.radioGroup.id)
        if (existing) {
          existing.items.push(scoredNode)
        } else {
          radioGroupedItems.set(scoredNode.radioGroup.id, {
            radioGroupDef: scoredNode.radioGroup.radioGroupDef,
            menuNode: scoredNode.radioGroup.menuNode,
            items: [scoredNode],
            breadcrumbs: scoredNode.breadcrumbs,
          })
        }
      }
    } else if (scoredNode.checkboxGroup) {
      if (checkboxGroupSearchBehavior === 'flatten') {
        ungroupedItems.push(scoredNode)
      } else {
        const existing = checkboxGroupedItems.get(scoredNode.checkboxGroup.id)
        if (existing) {
          existing.items.push(scoredNode)
        } else {
          checkboxGroupedItems.set(scoredNode.checkboxGroup.id, {
            checkboxGroupDef: scoredNode.checkboxGroup.checkboxGroupDef,
            menuNode: scoredNode.checkboxGroup.menuNode,
            items: [scoredNode],
            breadcrumbs: scoredNode.breadcrumbs,
          })
        }
      }
    } else if (scoredNode.group) {
      const existing = groupedItems.get(scoredNode.group.id)
      if (existing) {
        existing.items.push(scoredNode)
      } else {
        groupedItems.set(scoredNode.group.id, {
          groupDef: scoredNode.group.groupDef,
          menuNode: scoredNode.group.menuNode,
          items: [scoredNode],
          breadcrumbs: scoredNode.breadcrumbs,
        })
      }
    } else {
      ungroupedItems.push(scoredNode)
    }
  }

  // Build display nodes for groups (with items sorted by score)
  const groupDisplayNodes: PipelineDisplayGroupNode<N>[] = []
  for (const [_groupId, { items, breadcrumbs }] of groupedItems) {
    // Sort items within group by forced order, then score.
    items.sort(compareScoredNodesByForceOrderAndScore)

    const bestScore = Math.max(...items.map((item) => item.score), 0)
    const isDeepSearchResult = breadcrumbs.length > 0

    const groupContext: GroupRenderContext<PipelineDisplayTypes<N>> = {
      search: query ? { query, bestScore } : null,
      matchCount: items.length,
      breadcrumbs,
      isDeepSearchResult,
    }

    groupDisplayNodes.push({
      kind: 'group',
      node: groupedItems.get(_groupId)!.menuNode,
      context: groupContext,
      items: items.map((item) =>
        buildDisplayRowNode(item, query, highlightedId),
      ),
      bestScore,
    })
  }

  // Build display nodes for radio groups
  const radioGroupDisplayNodes: PipelineDisplayRadioGroupNode<N>[] = []

  if (radioGroupSearchBehavior !== 'flatten') {
    for (const [
      radioGroupId,
      { items: matchingItems, breadcrumbs },
    ] of radioGroupedItems) {
      let itemsToDisplay: ScoredNode<PipelineDisplayTypes<N>>[]

      if (radioGroupSearchBehavior === 'preserve-show-all') {
        // Include ALL items from this radio group, not just matching ones
        const allItems = allRadioGroupItems.get(radioGroupId)
        if (allItems) {
          // Create scored nodes for all items, using 0 for non-matching
          const matchingScores = new Map(
            matchingItems.map((item) => [item.node.id, item.score]),
          )

          itemsToDisplay = allItems.items.map((flatNode) => ({
            node: flatNode.node,
            score: matchingScores.get(flatNode.node.id) ?? 0,
            breadcrumbs: flatNode.breadcrumbs,
            group: flatNode.group,
            radioGroup: flatNode.radioGroup,
            checkboxGroup: flatNode.checkboxGroup,
          }))
        } else {
          itemsToDisplay = matchingItems
        }
      } else {
        // 'preserve' - only show matching items
        itemsToDisplay = matchingItems
      }

      // Sort items by forced order, then score.
      itemsToDisplay.sort(compareScoredNodesByForceOrderAndScore)

      const bestScore = Math.max(...itemsToDisplay.map((item) => item.score), 0)
      const isDeepSearchResult = breadcrumbs.length > 0

      const groupContext: GroupRenderContext<PipelineDisplayTypes<N>> = {
        search: query ? { query, bestScore } : null,
        matchCount: matchingItems.length,
        breadcrumbs,
        isDeepSearchResult,
      }

      radioGroupDisplayNodes.push({
        kind: 'radio-group',
        node: radioGroupedItems.get(radioGroupId)!.menuNode,
        context: groupContext,
        items: itemsToDisplay.map((item) =>
          buildDisplayRowNode(item, query, highlightedId),
        ),
        bestScore,
      })
    }
  }

  const checkboxGroupDisplayNodes: PipelineDisplayCheckboxGroupNode<N>[] = []
  if (checkboxGroupSearchBehavior !== 'flatten') {
    for (const [
      checkboxGroupId,
      { items: matchingItems, breadcrumbs, menuNode },
    ] of checkboxGroupedItems) {
      let itemsToDisplay: ScoredNode<PipelineDisplayTypes<N>>[]
      if (checkboxGroupSearchBehavior === 'preserve-show-all') {
        const allItems = allCheckboxGroupItems.get(checkboxGroupId)
        if (allItems) {
          const matchingScores = new Map(
            matchingItems.map((item) => [item.node.id, item.score]),
          )
          itemsToDisplay = allItems.items.map((flatNode) => ({
            node: flatNode.node,
            score: matchingScores.get(flatNode.node.id) ?? 0,
            breadcrumbs: flatNode.breadcrumbs,
            group: flatNode.group,
            radioGroup: flatNode.radioGroup,
            checkboxGroup: flatNode.checkboxGroup,
          }))
        } else {
          itemsToDisplay = matchingItems
        }
      } else {
        itemsToDisplay = matchingItems
      }
      itemsToDisplay.sort(compareScoredNodesByForceOrderAndScore)
      const bestScore = Math.max(...itemsToDisplay.map((item) => item.score), 0)
      const groupContext: GroupRenderContext<PipelineDisplayTypes<N>> = {
        search: query ? { query, bestScore } : null,
        matchCount: matchingItems.length,
        breadcrumbs,
        isDeepSearchResult: breadcrumbs.length > 0,
      }
      checkboxGroupDisplayNodes.push({
        kind: 'checkbox-group',
        node: menuNode,
        context: groupContext,
        items: itemsToDisplay.map((item) =>
          buildDisplayRowNode(item, query, highlightedId),
        ),
        bestScore,
      })
    }
  }

  // Build display nodes for ungrouped items
  const ungroupedDisplayNodes: PipelineDisplayRowNode<N>[] = ungroupedItems
    .sort(compareScoredNodesByForceOrderAndScore)
    .map((item) => buildDisplayRowNode(item, query, highlightedId))

  // Merge groups, radio groups, checkbox groups, and ungrouped items, sorted by forced order then score.
  type SortableNode = {
    node: PipelineDisplayNode<N>
    score: number
    forceOrder: number
    kindRank: number
  }

  const allNodes: SortableNode[] = [
    ...groupDisplayNodes.map((g) => ({
      node: g as PipelineDisplayNode<N>,
      score: g.bestScore,
      forceOrder: getMinForceOrderFromDisplayRows(g.items),
      kindRank: 0,
    })),
    ...radioGroupDisplayNodes.map((r) => ({
      node: r as PipelineDisplayNode<N>,
      score: r.bestScore,
      forceOrder: getMinForceOrderFromDisplayRows(r.items),
      kindRank: 0,
    })),
    ...checkboxGroupDisplayNodes.map((r) => ({
      node: r as PipelineDisplayNode<N>,
      score: r.bestScore,
      forceOrder: getMinForceOrderFromDisplayRows(r.items),
      kindRank: 0,
    })),
    ...ungroupedDisplayNodes.map((r) => ({
      node: r as PipelineDisplayNode<N>,
      score: getDisplayRowScore(r),
      forceOrder: getDisplayRowForceOrder(r),
      kindRank: getRowKindSortRank(r.node.kind),
    })),
  ]

  if (sortGroups) {
    allNodes.sort(sortByForceOrderThenKindThenScore)
  }

  return {
    displayNodes: allNodes.map((n) => n.node),
    isDeepSearching: shouldDeepSearch,
  }
}

/**
 * Main filtering pipeline.
 * Handles both browse mode and search mode (shallow and deep).
 * Respects groupSearchBehavior configuration (only applies during search).
 * Note: Radio groups are ALWAYS preserved regardless of groupSearchBehavior.
 * Radio group behavior is controlled by radioGroupSearchBehavior.
 * Checkbox group behavior is controlled by checkboxGroupSearchBehavior.
 */
export function filterNodes<N extends PipelineMenuNode<N> = AnyMenuNode>(
  options: FilterNodesOptions<N>,
): FilterNodesResult<N> {
  const {
    query,
    nodes,
    highlightedId,
    groupSearchBehavior = 'preserve',
    filter,
  } = options

  // Browse mode - no query, or filtering turned off
  // Always preserve groups in browse mode (groupSearchBehavior only affects search)
  if (!query || filter === false) {
    return {
      displayNodes: getBrowseNodesPreserve(nodes, highlightedId),
      isDeepSearching: false,
    }
  }

  // Search mode - dispatch based on group search behavior
  if (groupSearchBehavior === 'preserve') {
    return filterNodesPreserve({ ...options, filter })
  }

  return filterNodesFlatten({ ...options, filter })
}

// ============================================================================
