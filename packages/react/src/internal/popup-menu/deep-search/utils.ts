import { commandScore } from '../../listbox/utils/command-score.js'
import type {
  CheckboxItemDef,
  DisplayGroupNode,
  DisplayNode,
  DisplayRadioGroupNode,
  DisplayRowNode,
  GroupBehavior,
  GroupDef,
  GroupRenderContext,
  ItemDef,
  NodeDef,
  RadioGroupBehavior,
  RadioGroupDef,
  RowRenderContext,
  ScoredNode,
  SeparatorDef,
  SubmenuDef,
} from './types.js'
import {
  isDisplayGroupNode,
  isDisplayRadioGroupNode,
  isDisplaySeparatorNode,
} from './types.js'

// ============================================================================
// Type Guards
// ============================================================================

export function isItemDef(node: NodeDef): node is ItemDef {
  return node.kind === 'item'
}

export function isCheckboxItemDef(node: NodeDef): node is CheckboxItemDef {
  return node.kind === 'checkbox-item'
}

export function isSubmenuDef(node: NodeDef): node is SubmenuDef {
  return node.kind === 'submenu'
}

export function isGroupDef(node: NodeDef): node is GroupDef {
  return node.kind === 'group'
}

export function isRadioGroupDef(node: NodeDef): node is RadioGroupDef {
  return node.kind === 'radio-group'
}

export function isSeparatorDef(
  node: NodeDef,
): node is { kind: 'separator'; id?: string } {
  return node.kind === 'separator'
}

// ============================================================================
// Flatten Nodes for Search
// ============================================================================

interface FlattenOptions {
  /** Whether to include children of submenus (deep search) */
  deep?: boolean
  /** Parent breadcrumb titles */
  breadcrumbs?: string[]
  /** Parent breadcrumb IDs */
  breadcrumbIds?: string[]
  /** Current group context (nested groups not supported) */
  group?: { id: string; label?: string; groupDef: GroupDef } | null
  /** Current radio group context */
  radioGroup?: {
    id: string
    label?: string
    radioGroupDef: RadioGroupDef
  } | null
}

interface FlattenedNode {
  node: ItemDef | CheckboxItemDef | SubmenuDef
  breadcrumbs: string[]
  breadcrumbIds: string[]
  /** The group this node belongs to, if any */
  group: { id: string; label?: string; groupDef: GroupDef } | null
  /** The radio group this node belongs to, if any */
  radioGroup: {
    id: string
    label?: string
    radioGroupDef: RadioGroupDef
  } | null
}

/**
 * Flattens a tree of node definitions into a flat array.
 * When deep=true, includes children of submenus with their breadcrumb paths.
 * Tracks group and radio group membership for each node.
 */
export function flattenNodes(
  nodes: NodeDef[],
  options: FlattenOptions = {},
): FlattenedNode[] {
  const {
    deep = false,
    breadcrumbs = [],
    breadcrumbIds = [],
    group = null,
    radioGroup = null,
  } = options
  const result: FlattenedNode[] = []

  for (const node of nodes) {
    if (node.kind === 'separator') {
      // Skip separators during search
      continue
    }

    if (node.kind === 'group') {
      // Groups are containers - recurse into their children with group context
      // Note: Nested groups are not supported, so we pass this group directly
      const groupInfo = { id: node.id, label: node.label, groupDef: node }
      result.push(
        ...flattenNodes(node.nodes, {
          deep,
          breadcrumbs,
          breadcrumbIds,
          group: groupInfo,
          radioGroup: null, // Reset radio group when entering a regular group
        }),
      )
      continue
    }

    if (node.kind === 'radio-group') {
      // Radio groups are containers - recurse into their children with radio group context
      if (node.hidden) continue

      const radioGroupInfo = {
        id: node.id,
        label: node.label,
        radioGroupDef: node,
      }
      result.push(
        ...flattenNodes(node.nodes, {
          deep,
          breadcrumbs,
          breadcrumbIds,
          group: null, // Reset regular group when entering a radio group
          radioGroup: radioGroupInfo,
        }),
      )
      continue
    }

    if (node.hidden) {
      continue
    }

    if (node.kind === 'item' || node.kind === 'checkbox-item') {
      result.push({
        node,
        breadcrumbs,
        breadcrumbIds,
        group,
        radioGroup,
      })
      continue
    }

    if (node.kind === 'submenu') {
      // Always include the submenu trigger itself
      result.push({
        node,
        breadcrumbs,
        breadcrumbIds,
        group,
        radioGroup,
      })

      // If deep search enabled and submenu allows it, include children
      if (deep && node.deepSearch !== false && node.nodes) {
        const childBreadcrumbs = [...breadcrumbs, node.title]
        const childBreadcrumbIds = [...breadcrumbIds, node.id]

        result.push(
          ...flattenNodes(node.nodes, {
            deep,
            breadcrumbs: childBreadcrumbs,
            breadcrumbIds: childBreadcrumbIds,
            // Reset group and radio group context when entering a submenu
            group: null,
            radioGroup: null,
          }),
        )
      }
    }
  }

  return result
}

// ============================================================================
// Score Nodes
// ============================================================================

/**
 * Scores nodes against a search query.
 * Returns only nodes with a score > 0.
 */
export function scoreNodes(
  flattenedNodes: FlattenedNode[],
  query: string,
): ScoredNode[] {
  if (!query) {
    // No query - return all nodes with score 1
    return flattenedNodes.map(
      ({
        node,
        breadcrumbs,
        breadcrumbIds,
        group,
        radioGroup,
      }): ScoredNode => ({
        node,
        score: 1,
        breadcrumbs,
        breadcrumbIds,
        group,
        radioGroup,
      }),
    )
  }

  const results: ScoredNode[] = []

  for (const {
    node,
    breadcrumbs,
    breadcrumbIds,
    group,
    radioGroup,
  } of flattenedNodes) {
    const label =
      node.kind === 'submenu' ? (node.label ?? node.title) : node.label
    const keywords = node.keywords

    const score = commandScore(label, query, keywords)

    if (score > 0) {
      results.push({
        node,
        score,
        breadcrumbs,
        breadcrumbIds,
        group,
        radioGroup,
      })
    }
  }

  return results
}

// ============================================================================
// Sort Nodes
// ============================================================================

/**
 * Sorts scored nodes by score (descending).
 */
export function sortByScore(nodes: ScoredNode[]): ScoredNode[] {
  return [...nodes].sort((a, b) => b.score - a.score)
}

/**
 * Partitions nodes: items first, then submenu triggers.
 * This ensures items appear before submenu triggers in search results.
 */
export function partitionByKind(nodes: ScoredNode[]): ScoredNode[] {
  const items = nodes.filter(
    (n) => n.node.kind === 'item' || n.node.kind === 'checkbox-item',
  )
  const submenus = nodes.filter((n) => n.node.kind === 'submenu')
  return [...items, ...submenus]
}

/**
 * Deduplicates nodes by their composite ID (breadcrumbIds + node.id).
 * This handles the case where the same node appears multiple times in the tree.
 */
export function deduplicateNodes(nodes: ScoredNode[]): ScoredNode[] {
  const seen = new Set<string>()
  const result: ScoredNode[] = []

  for (const scoredNode of nodes) {
    const compositeId = [...scoredNode.breadcrumbIds, scoredNode.node.id].join(
      '.',
    )
    if (!seen.has(compositeId)) {
      seen.add(compositeId)
      result.push(scoredNode)
    }
  }

  return result
}

// ============================================================================
// Build Display Nodes
// ============================================================================

/**
 * Converts scored nodes to display row nodes with render context.
 * Used for flatten mode where groups are invisible.
 */
export function buildDisplayRowNodes(
  scoredNodes: ScoredNode[],
  query: string,
  highlightedId: string | null,
): DisplayRowNode[] {
  return scoredNodes.map((scoredNode) => {
    const isDeepSearchResult = scoredNode.breadcrumbs.length > 0

    const context: RowRenderContext = {
      search: query
        ? {
            query,
            score: scoredNode.score,
          }
        : null,
      breadcrumbs: scoredNode.breadcrumbs,
      isDeepSearchResult,
      highlighted: scoredNode.node.id === highlightedId,
      disabled: scoredNode.node.disabled ?? false,
      group: scoredNode.group
        ? { id: scoredNode.group.id, label: scoredNode.group.label }
        : null,
    }

    return {
      node: scoredNode.node,
      context,
    }
  })
}

/**
 * Builds a single DisplayRowNode from a ScoredNode.
 * Helper function for building row nodes.
 */
function buildDisplayRowNode(
  scoredNode: ScoredNode,
  query: string,
  highlightedId: string | null,
): DisplayRowNode {
  const isDeepSearchResult = scoredNode.breadcrumbs.length > 0

  const context: RowRenderContext = {
    search: query
      ? {
          query,
          score: scoredNode.score,
        }
      : null,
    breadcrumbs: scoredNode.breadcrumbs,
    isDeepSearchResult,
    highlighted: scoredNode.node.id === highlightedId,
    disabled: scoredNode.node.disabled ?? false,
    group: scoredNode.group
      ? { id: scoredNode.group.id, label: scoredNode.group.label }
      : null,
  }

  return {
    node: scoredNode.node,
    context,
  }
}

// ============================================================================
// Browse Mode - Get Shallow Nodes
// ============================================================================

/**
 * Gets nodes for browse mode (no search) with flatten behavior.
 * Returns only top-level items and submenu triggers, flattening groups.
 */
export function getBrowseNodesFlatten(
  nodes: NodeDef[],
  highlightedId: string | null,
  group: { id: string; label?: string } | null = null,
): DisplayRowNode[] {
  const result: DisplayRowNode[] = []

  for (const node of nodes) {
    if (node.kind === 'separator') {
      // Skip separators - they're not focusable
      continue
    }

    if (node.kind === 'group') {
      // Recurse into groups, passing group context
      const groupInfo = { id: node.id, label: node.label }
      result.push(
        ...getBrowseNodesFlatten(node.nodes, highlightedId, groupInfo),
      )
      continue
    }

    if (node.kind === 'radio-group') {
      // Radio groups should not be flattened - skip in flatten mode
      // They will be handled by getBrowseNodesPreserve
      continue
    }

    if (node.hidden) {
      continue
    }

    const context: RowRenderContext = {
      search: null,
      breadcrumbs: [],
      isDeepSearchResult: false,
      highlighted: node.id === highlightedId,
      disabled: node.disabled ?? false,
      group,
    }

    result.push({ node, context })
  }

  return result
}

/**
 * Gets nodes for browse mode (no search) with preserve behavior.
 * Keeps group structure intact, showing group containers with their items.
 */
export function getBrowseNodesPreserve(
  nodes: NodeDef[],
  highlightedId: string | null,
): DisplayNode[] {
  const result: DisplayNode[] = []

  for (const node of nodes) {
    if (node.kind === 'separator') {
      // Include separators in browse mode for visual separation
      result.push({ kind: 'separator', separator: node })
      continue
    }

    if (node.kind === 'group') {
      // Build group items
      const groupItems: DisplayRowNode[] = []
      for (const child of node.nodes) {
        // Skip non-row nodes
        if (
          child.kind === 'separator' ||
          child.kind === 'group' ||
          child.kind === 'radio-group'
        ) {
          continue
        }
        if (child.hidden) continue

        const itemContext: RowRenderContext = {
          search: null,
          breadcrumbs: [],
          isDeepSearchResult: false,
          highlighted: child.id === highlightedId,
          disabled: child.disabled ?? false,
          group: { id: node.id, label: node.label },
        }

        groupItems.push({ node: child, context: itemContext })
      }

      // Only include group if it has items
      if (groupItems.length > 0) {
        const groupContext: GroupRenderContext = {
          search: null,
          matchCount: groupItems.length,
          breadcrumbs: [],
          isDeepSearchResult: false,
        }

        result.push({
          kind: 'group',
          group: node,
          context: groupContext,
          items: groupItems,
          bestScore: 1,
        })
      }
      continue
    }

    if (node.kind === 'radio-group') {
      if (node.hidden) continue

      // Build radio group items
      const radioItems: DisplayRowNode[] = []
      for (const child of node.nodes) {
        // RadioGroupDef.nodes only contains ItemDef | SubmenuDef | CheckboxItemDef
        if (child.hidden) continue

        const itemContext: RowRenderContext = {
          search: null,
          breadcrumbs: [],
          isDeepSearchResult: false,
          highlighted: child.id === highlightedId,
          disabled: child.disabled ?? false,
          group: null, // Radio items don't belong to a regular group
        }

        radioItems.push({ node: child, context: itemContext })
      }

      // Only include radio group if it has items
      if (radioItems.length > 0) {
        const groupContext: GroupRenderContext = {
          search: null,
          matchCount: radioItems.length,
          breadcrumbs: [],
          isDeepSearchResult: false,
        }

        result.push({
          kind: 'radio-group',
          radioGroup: node,
          context: groupContext,
          items: radioItems,
          bestScore: 1,
        })
      }
      continue
    }

    if (node.hidden) {
      continue
    }

    // Ungrouped item/submenu
    const context: RowRenderContext = {
      search: null,
      breadcrumbs: [],
      isDeepSearchResult: false,
      highlighted: node.id === highlightedId,
      disabled: node.disabled ?? false,
      group: null,
    }

    result.push({ node, context })
  }

  return result
}

// ============================================================================
// Full Pipeline
// ============================================================================

export interface FilterNodesOptions {
  /** The search query */
  query: string
  /** The node definitions to filter */
  nodes: NodeDef[]
  /** Currently highlighted node ID */
  highlightedId: string | null
  /** Whether deep search is enabled */
  deepSearch?: boolean
  /** Minimum query length for deep search */
  minLength?: number
  /** How groups behave during search (only applies when searching, not browse mode) */
  groupSearchBehavior?: GroupBehavior
  /** How radio groups behave during search */
  radioGroupSearchBehavior?: RadioGroupBehavior
  /** Whether to sort groups by best score */
  sortGroups?: boolean
}

/**
 * Filters nodes with 'flatten' group behavior.
 * Groups are invisible, items shown in flat list.
 * Radio group behavior is controlled by radioGroupSearchBehavior.
 */
function filterNodesFlatten(options: FilterNodesOptions): {
  displayNodes: DisplayNode[]
  isDeepSearching: boolean
} {
  const {
    query,
    nodes,
    highlightedId,
    deepSearch = true,
    minLength = 0,
    radioGroupSearchBehavior = 'preserve',
  } = options

  // Determine if deep search should activate
  const shouldDeepSearch = deepSearch && query.length >= minLength

  // Flatten nodes
  const flattened = flattenNodes(nodes, { deep: shouldDeepSearch })

  // For preserve-show-all, we need to track ALL radio group items before scoring
  // Maps radio group ID -> all flattened nodes for that group
  const allRadioGroupItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupDef
      items: FlattenedNode[]
      breadcrumbs: string[]
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
            items: [flatNode],
            breadcrumbs: flatNode.breadcrumbs,
          })
        }
      }
    }
  }

  // Score nodes
  const scored = scoreNodes(flattened, query)

  // Separate radio group items from regular items
  const radioGroupItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupDef
      items: ScoredNode[]
      breadcrumbs: string[]
    }
  >()
  const regularItems: ScoredNode[] = []

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
  const regularDisplayNodes: DisplayRowNode[] = buildDisplayRowNodes(
    unique,
    query,
    highlightedId,
  )

  // Build display nodes for radio groups
  const radioGroupDisplayNodes: DisplayRadioGroupNode[] = []

  if (radioGroupSearchBehavior !== 'flatten') {
    for (const [
      radioGroupId,
      { radioGroupDef, items: matchingItems, breadcrumbs },
    ] of radioGroupItems) {
      let itemsToDisplay: ScoredNode[]

      if (radioGroupSearchBehavior === 'preserve-show-all') {
        // Include ALL items from this radio group, not just matching ones
        const allItems = allRadioGroupItems.get(radioGroupId)
        if (allItems) {
          // Create scored nodes for all items, using 0 for non-matching
          const matchingIds = new Set(matchingItems.map((item) => item.node.id))
          const matchingScores = new Map(
            matchingItems.map((item) => [item.node.id, item.score]),
          )

          itemsToDisplay = allItems.items.map((flatNode) => ({
            node: flatNode.node,
            score: matchingScores.get(flatNode.node.id) ?? 0,
            breadcrumbs: flatNode.breadcrumbs,
            breadcrumbIds: flatNode.breadcrumbIds,
            group: flatNode.group,
            radioGroup: flatNode.radioGroup,
          }))
        } else {
          itemsToDisplay = matchingItems
        }
      } else {
        // 'preserve' - only show matching items
        itemsToDisplay = matchingItems
      }

      // Sort items: matching items first (by score), then non-matching
      itemsToDisplay.sort((a, b) => b.score - a.score)

      const bestScore = Math.max(...itemsToDisplay.map((item) => item.score), 0)
      const isDeepSearchResult = breadcrumbs.length > 0

      const groupContext: GroupRenderContext = {
        search: query ? { query, bestScore } : null,
        matchCount: matchingItems.length,
        breadcrumbs,
        isDeepSearchResult,
      }

      radioGroupDisplayNodes.push({
        kind: 'radio-group',
        radioGroup: radioGroupDef,
        context: groupContext,
        items: itemsToDisplay.map((item) =>
          buildDisplayRowNode(item, query, highlightedId),
        ),
        bestScore,
      })
    }
  }

  // Merge regular items and radio groups, sorted by score
  type SortableNode = { node: DisplayNode; score: number }

  const allNodes: SortableNode[] = [
    ...regularDisplayNodes.map((r) => ({
      node: r as DisplayNode,
      score: r.context.search?.score ?? 0,
    })),
    ...radioGroupDisplayNodes.map((r) => ({
      node: r as DisplayNode,
      score: r.bestScore,
    })),
  ]

  allNodes.sort((a, b) => b.score - a.score)

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
 */
function filterNodesPreserve(options: FilterNodesOptions): {
  displayNodes: DisplayNode[]
  isDeepSearching: boolean
} {
  const {
    query,
    nodes,
    highlightedId,
    deepSearch = true,
    minLength = 0,
    sortGroups = true,
    radioGroupSearchBehavior = 'preserve',
  } = options

  // Determine if deep search should activate
  const shouldDeepSearch = deepSearch && query.length >= minLength

  // Flatten nodes (tracking group and radio group membership)
  const flattened = flattenNodes(nodes, { deep: shouldDeepSearch })

  // For preserve-show-all, we need to track ALL radio group items before scoring
  const allRadioGroupItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupDef
      items: FlattenedNode[]
      breadcrumbs: string[]
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
            items: [flatNode],
            breadcrumbs: flatNode.breadcrumbs,
          })
        }
      }
    }
  }

  // Score nodes
  const scored = scoreNodes(flattened, query)

  // Partition into groups, radio groups, and ungrouped
  const groupedItems = new Map<
    string,
    { groupDef: GroupDef; items: ScoredNode[]; breadcrumbs: string[] }
  >()
  const radioGroupedItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupDef
      items: ScoredNode[]
      breadcrumbs: string[]
    }
  >()
  const ungroupedItems: ScoredNode[] = []

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
          items: [scoredNode],
          breadcrumbs: scoredNode.breadcrumbs,
        })
      }
    } else {
      ungroupedItems.push(scoredNode)
    }
  }

  // Build display nodes for groups (with items sorted by score)
  const groupDisplayNodes: DisplayGroupNode[] = []
  for (const [_groupId, { groupDef, items, breadcrumbs }] of groupedItems) {
    // Sort items within group by score
    items.sort((a, b) => b.score - a.score)

    const bestScore = items[0]?.score ?? 0
    const isDeepSearchResult = breadcrumbs.length > 0

    const groupContext: GroupRenderContext = {
      search: query ? { query, bestScore } : null,
      matchCount: items.length,
      breadcrumbs,
      isDeepSearchResult,
    }

    groupDisplayNodes.push({
      kind: 'group',
      group: groupDef,
      context: groupContext,
      items: items.map((item) =>
        buildDisplayRowNode(item, query, highlightedId),
      ),
      bestScore,
    })
  }

  // Build display nodes for radio groups
  const radioGroupDisplayNodes: DisplayRadioGroupNode[] = []

  if (radioGroupSearchBehavior !== 'flatten') {
    for (const [
      radioGroupId,
      { radioGroupDef, items: matchingItems, breadcrumbs },
    ] of radioGroupedItems) {
      let itemsToDisplay: ScoredNode[]

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
            breadcrumbIds: flatNode.breadcrumbIds,
            group: flatNode.group,
            radioGroup: flatNode.radioGroup,
          }))
        } else {
          itemsToDisplay = matchingItems
        }
      } else {
        // 'preserve' - only show matching items
        itemsToDisplay = matchingItems
      }

      // Sort items: matching items first (by score), then non-matching
      itemsToDisplay.sort((a, b) => b.score - a.score)

      const bestScore = Math.max(...itemsToDisplay.map((item) => item.score), 0)
      const isDeepSearchResult = breadcrumbs.length > 0

      const groupContext: GroupRenderContext = {
        search: query ? { query, bestScore } : null,
        matchCount: matchingItems.length,
        breadcrumbs,
        isDeepSearchResult,
      }

      radioGroupDisplayNodes.push({
        kind: 'radio-group',
        radioGroup: radioGroupDef,
        context: groupContext,
        items: itemsToDisplay.map((item) =>
          buildDisplayRowNode(item, query, highlightedId),
        ),
        bestScore,
      })
    }
  }

  // Build display nodes for ungrouped items
  const ungroupedDisplayNodes: DisplayRowNode[] = ungroupedItems
    .sort((a, b) => b.score - a.score)
    .map((item) => buildDisplayRowNode(item, query, highlightedId))

  // Merge groups, radio groups, and ungrouped items, sorted by best score
  type SortableNode = { node: DisplayNode; score: number }

  const allNodes: SortableNode[] = [
    ...groupDisplayNodes.map((g) => ({
      node: g as DisplayNode,
      score: g.bestScore,
    })),
    ...radioGroupDisplayNodes.map((r) => ({
      node: r as DisplayNode,
      score: r.bestScore,
    })),
    ...ungroupedDisplayNodes.map((r) => ({
      node: r as DisplayNode,
      score: r.context.search?.score ?? 0,
    })),
  ]

  if (sortGroups) {
    allNodes.sort((a, b) => b.score - a.score)
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
 */
export function filterNodes(options: FilterNodesOptions): {
  displayNodes: DisplayNode[]
  isDeepSearching: boolean
} {
  const {
    query,
    nodes,
    highlightedId,
    groupSearchBehavior = 'preserve',
  } = options

  // Browse mode - no query
  // Always preserve groups in browse mode (groupSearchBehavior only affects search)
  if (!query) {
    return {
      displayNodes: getBrowseNodesPreserve(nodes, highlightedId),
      isDeepSearching: false,
    }
  }

  // Search mode - dispatch based on group search behavior
  if (groupSearchBehavior === 'preserve') {
    return filterNodesPreserve(options)
  }

  return filterNodesFlatten(options)
}

// ============================================================================
// Get Navigable IDs
// ============================================================================

/**
 * Gets the IDs of all navigable (non-disabled) nodes.
 * Handles row nodes, group nodes, and radio group nodes (extracts item IDs).
 * Separators are skipped as they're not navigable.
 * Used for keyboard navigation.
 */
export function getNavigableIds(displayNodes: DisplayNode[]): string[] {
  const ids: string[] = []

  for (const node of displayNodes) {
    if (isDisplayGroupNode(node)) {
      // Add IDs of items within the group
      for (const item of node.items) {
        if (!item.node.disabled) {
          ids.push(item.node.id)
        }
      }
    } else if (isDisplayRadioGroupNode(node)) {
      // Add IDs of items within the radio group
      for (const item of node.items) {
        if (!item.node.disabled) {
          ids.push(item.node.id)
        }
      }
    } else if (isDisplaySeparatorNode(node)) {
    } else {
      // Row node (item, checkbox item, or submenu)
      if (!node.node.disabled) {
        ids.push(node.node.id)
      }
    }
  }

  return ids
}

/**
 * Gets the first navigable node ID.
 */
export function getFirstNavigableId(
  displayNodes: DisplayNode[],
): string | null {
  const ids = getNavigableIds(displayNodes)
  return ids[0] ?? null
}
