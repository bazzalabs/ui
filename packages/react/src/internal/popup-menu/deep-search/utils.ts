import { commandScore } from '../../listbox/utils/command-score.js'
import { normalizeValue, slugify } from '../../listbox/utils/normalize.js'
import type {
  AsyncNodesConfig,
  BreadcrumbNode,
  CheckboxItemDef,
  DisplayGroupNode,
  DisplayNode,
  DisplayRadioGroupNode,
  DisplayRowNode,
  GetQualifiedRowIdContext,
  GroupBehavior,
  GroupDef,
  GroupRenderContext,
  IncludeInDeepSearch,
  ItemDef,
  NodeDef,
  RadioGroupBehavior,
  RadioGroupDef,
  RadioItemDef,
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
// Default getQualifiedRowId Implementation
// ============================================================================

/**
 * Default function to generate qualified unique IDs for rows.
 *
 * Logic:
 * - If node.id is provided, use it as-is (treat as globally unique)
 * - Otherwise, when deep searching, qualify with breadcrumb path + value
 * - When not deep searching, just use the slugified value
 *
 * @example
 * // With explicit id:
 * // { id: 'my-unique-id', value: 'In Progress' }
 * // => 'my-unique-id'
 *
 * // Without id, deep searching in "Status" submenu:
 * // { value: 'In Progress' } in Status submenu
 * // => 'status.in-progress'
 *
 * // Without id, not deep searching:
 * // { value: 'In Progress' }
 * // => 'in-progress'
 */
export function defaultGetQualifiedRowId(
  ctx: GetQualifiedRowIdContext,
): string {
  // If explicit id is provided, use it as-is (treat as globally unique)
  if (ctx.id) {
    return ctx.id
  }

  // Otherwise, compute from breadcrumbs + value
  const slugValue = slugify(ctx.value)

  // Only qualify with breadcrumbs when deep searching
  if (ctx.isDeepSearching && ctx.breadcrumbs.length > 0) {
    const slugBreadcrumbs = ctx.breadcrumbs
      .map((b) => b.id ?? slugify(b.value))
      .filter(Boolean)
    if (slugBreadcrumbs.length > 0) {
      return [...slugBreadcrumbs, slugValue].join('.')
    }
  }

  return slugValue
}

// ============================================================================
// Type Guards
// ============================================================================

export function isItemDef(node: NodeDef): node is ItemDef {
  return node.kind === 'item'
}

export function isRadioItemDef(node: NodeDef): node is RadioItemDef {
  return node.kind === 'radio-item'
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
  /** Default include mode for descendant submenus */
  includeInDeepSearch?: IncludeInDeepSearch
  /** Whether ancestors allow this subtree to participate in deep search */
  descendantsIncluded?: boolean
  /** Parent breadcrumb nodes (submenu nodes from root to parent) */
  breadcrumbs?: BreadcrumbNode[]
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
  node: ItemDef | RadioItemDef | CheckboxItemDef | SubmenuDef
  /** Breadcrumb nodes (submenu nodes from root to parent) */
  breadcrumbs: BreadcrumbNode[]
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
    includeInDeepSearch = true,
    descendantsIncluded = true,
    breadcrumbs = [],
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
          includeInDeepSearch,
          descendantsIncluded,
          breadcrumbs,
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
          includeInDeepSearch,
          descendantsIncluded,
          breadcrumbs,
          group: null, // Reset regular group when entering a radio group
          radioGroup: radioGroupInfo,
        }),
      )
      continue
    }

    if (node.hidden) {
      continue
    }

    if (
      node.kind === 'item' ||
      node.kind === 'radio-item' ||
      node.kind === 'checkbox-item'
    ) {
      result.push({
        node,
        breadcrumbs,
        group,
        radioGroup,
      })
      continue
    }

    if (node.kind === 'submenu') {
      const submenuIncludeMode = node.includeInDeepSearch ?? includeInDeepSearch

      // includeInDeepSearch only affects deep search results.
      // In shallow mode, submenu triggers remain searchable as normal rows.
      const shouldIncludeSubmenuTrigger =
        !deep || (descendantsIncluded && submenuIncludeMode !== false)

      if (shouldIncludeSubmenuTrigger) {
        result.push({
          node,
          breadcrumbs,
          group,
          radioGroup,
        })
      }

      // If deep search enabled and submenu allows descendants, include children.
      const shouldIncludeSubmenuDescendants =
        deep &&
        descendantsIncluded &&
        submenuIncludeMode === true &&
        node.deepSearch !== false

      if (shouldIncludeSubmenuDescendants && node.nodes) {
        // Create breadcrumb node for this submenu
        const submenuBreadcrumb: BreadcrumbNode = {
          node,
          value: node.value,
          id: node.id,
        }
        const childBreadcrumbs: BreadcrumbNode[] = [
          ...breadcrumbs,
          submenuBreadcrumb,
        ]

        result.push(
          ...flattenNodes(node.nodes, {
            deep,
            includeInDeepSearch,
            descendantsIncluded: true,
            breadcrumbs: childBreadcrumbs,
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
      ({ node, breadcrumbs, group, radioGroup }): ScoredNode => ({
        node,
        score: 1,
        breadcrumbs,
        group,
        radioGroup,
      }),
    )
  }

  const results: ScoredNode[] = []

  for (const { node, breadcrumbs, group, radioGroup } of flattenedNodes) {
    // Normalize value and keywords to match cmdk's behavior
    const normalizedValue = normalizeValue(node.value)
    const normalizedKeywords = node.keywords
      ?.map((k) => normalizeValue(k))
      .filter(Boolean)

    const score = commandScore(normalizedValue, query, normalizedKeywords)

    if (score > 0) {
      results.push({
        node,
        score,
        breadcrumbs,
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
    (n) =>
      n.node.kind === 'item' ||
      n.node.kind === 'radio-item' ||
      n.node.kind === 'checkbox-item',
  )
  const submenus = nodes.filter((n) => n.node.kind === 'submenu')
  return [...items, ...submenus]
}

/**
 * Deduplicates nodes by their composite ID (breadcrumbs + node.value).
 * This handles the case where the same node appears multiple times in the tree.
 * Values are normalized (trimmed) for consistent deduplication.
 */
export function deduplicateNodes(nodes: ScoredNode[]): ScoredNode[] {
  const seen = new Set<string>()
  const result: ScoredNode[] = []

  for (const scoredNode of nodes) {
    // Normalize value for consistent deduplication
    // Note: breadcrumbs are already normalized in flattenNodes
    const compositeId = [
      ...scoredNode.breadcrumbs,
      normalizeValue(scoredNode.node.value),
    ].join('.')
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
      // breadcrumbs already set above
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
      radioGroup: scoredNode.radioGroup
        ? { id: scoredNode.radioGroup.id, label: scoredNode.radioGroup.label }
        : undefined,
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
    radioGroup: scoredNode.radioGroup
      ? { id: scoredNode.radioGroup.id, label: scoredNode.radioGroup.label }
      : undefined,
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

        radioItems.push({
          node: child,
          context: itemContext,
          radioGroup: { id: node.id, label: node.label },
        })
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
  /** Default include mode for descendant submenus during deep search */
  includeInDeepSearch?: IncludeInDeepSearch
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
    includeInDeepSearch = true,
    minLength = 0,
    radioGroupSearchBehavior = 'preserve',
  } = options

  // Determine if deep search should activate
  const shouldDeepSearch = deepSearch && query.length >= minLength

  // Flatten nodes
  const flattened = flattenNodes(nodes, {
    deep: shouldDeepSearch,
    includeInDeepSearch,
  })

  // For preserve-show-all, we need to track ALL radio group items before scoring
  // Maps radio group ID -> all flattened nodes for that group
  const allRadioGroupItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupDef
      items: FlattenedNode[]
      breadcrumbs: BreadcrumbNode[]
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
      breadcrumbs: BreadcrumbNode[]
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
    includeInDeepSearch = true,
    minLength = 0,
    sortGroups = true,
    radioGroupSearchBehavior = 'preserve',
  } = options

  // Determine if deep search should activate
  const shouldDeepSearch = deepSearch && query.length >= minLength

  // Flatten nodes (tracking group and radio group membership)
  const flattened = flattenNodes(nodes, {
    deep: shouldDeepSearch,
    includeInDeepSearch,
  })

  // For preserve-show-all, we need to track ALL radio group items before scoring
  const allRadioGroupItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupDef
      items: FlattenedNode[]
      breadcrumbs: BreadcrumbNode[]
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
    { groupDef: GroupDef; items: ScoredNode[]; breadcrumbs: BreadcrumbNode[] }
  >()
  const radioGroupedItems = new Map<
    string,
    {
      radioGroupDef: RadioGroupDef
      items: ScoredNode[]
      breadcrumbs: BreadcrumbNode[]
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
 *
 * Note: Uses `node.id ?? node.value` as the identifier. For proper ID handling
 * with custom getItemId functions, use `getOrderedItemIds` from DataList instead.
 */
export function getNavigableIds(displayNodes: DisplayNode[]): string[] {
  const ids: string[] = []

  for (const node of displayNodes) {
    if (isDisplayGroupNode(node)) {
      // Add IDs of items within the group
      for (const item of node.items) {
        if (!item.node.disabled) {
          ids.push(item.node.id ?? item.node.value)
        }
      }
    } else if (isDisplayRadioGroupNode(node)) {
      // Add IDs of items within the radio group
      for (const item of node.items) {
        if (!item.node.disabled) {
          ids.push(item.node.id ?? item.node.value)
        }
      }
    } else if (isDisplaySeparatorNode(node)) {
      // Separators are not navigable
    } else {
      // Row node (item, checkbox item, or submenu)
      if (!node.node.disabled) {
        ids.push(node.node.id ?? node.node.value)
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

// ============================================================================
// Async Node Collection & Merging
// ============================================================================

/**
 * Info about an async submenu for registration with coordinator.
 */
export interface AsyncSubmenuInfo {
  /** Unique identifier (uses node value and breadcrumbs) */
  id: string
  /** Breadcrumbs path to this submenu */
  breadcrumbs: string[]
  /** The submenu node definition */
  node: SubmenuDef
  /** The async configuration */
  config: AsyncNodesConfig
}

/**
 * Collects all async submenus from a node tree.
 * Recursively traverses groups and submenus to find all async configurations.
 */
export function collectAsyncSubmenus(
  nodes: NodeDef[],
  breadcrumbs: string[] = [],
  includeInDeepSearch: IncludeInDeepSearch = true,
  descendantsIncluded = true,
): AsyncSubmenuInfo[] {
  const result: AsyncSubmenuInfo[] = []

  for (const node of nodes) {
    if (node.kind === 'separator') {
      continue
    }

    if (node.kind === 'group') {
      // Recurse into groups
      result.push(
        ...collectAsyncSubmenus(
          node.nodes,
          breadcrumbs,
          includeInDeepSearch,
          descendantsIncluded,
        ),
      )
      continue
    }

    if (node.kind === 'radio-group') {
      if (node.hidden) continue
      // Recurse into radio groups
      result.push(
        ...collectAsyncSubmenus(
          node.nodes,
          breadcrumbs,
          includeInDeepSearch,
          descendantsIncluded,
        ),
      )
      continue
    }

    if (node.kind === 'submenu') {
      if (node.hidden) continue

      const submenuIncludeMode = node.includeInDeepSearch ?? includeInDeepSearch
      const shouldIncludeDescendants =
        descendantsIncluded &&
        submenuIncludeMode === true &&
        node.deepSearch !== false

      // If this submenu has async nodes, add it to the result
      if (node.asyncNodes && shouldIncludeDescendants) {
        const id = [...breadcrumbs, normalizeValue(node.value)].join('.')
        result.push({
          id,
          breadcrumbs,
          node,
          config: node.asyncNodes,
        })
      }

      // Recurse into submenu's static nodes
      if (node.nodes && shouldIncludeDescendants) {
        const childBreadcrumbs = [...breadcrumbs, normalizeValue(node.value)]
        result.push(
          ...collectAsyncSubmenus(
            node.nodes,
            childBreadcrumbs,
            includeInDeepSearch,
            true,
          ),
        )
      }
    }
  }

  return result
}

/**
 * Merges async nodes into a submenu's node list.
 * Static nodes come first, async nodes are appended.
 */
export function mergeSubmenuNodes(
  staticNodes: NodeDef[] | undefined,
  asyncNodes: NodeDef[] | undefined,
): NodeDef[] {
  const static_ = staticNodes ?? []
  const async_ = asyncNodes ?? []
  return [...static_, ...async_]
}

/**
 * Async data from the coordinator ready for merging.
 */
interface AsyncNodeData {
  id: string
  breadcrumbs: string[]
  nodes: NodeDef[]
}

/**
 * Creates a merged content tree with async nodes injected at their proper locations.
 * This function modifies the tree to include async nodes where they belong.
 */
export function mergeAsyncNodesIntoTree(
  staticContent: NodeDef[],
  asyncData: AsyncNodeData[],
): NodeDef[] {
  // If no async data, return static content as-is
  if (asyncData.length === 0) {
    return staticContent
  }

  // Build a map of async data by breadcrumb path
  const asyncMap = new Map<string, NodeDef[]>()
  for (const data of asyncData) {
    // The id is the full path including the submenu value
    // We need to find the parent path to inject into
    asyncMap.set(data.id, data.nodes)
  }

  // Recursively merge async nodes into the tree
  function mergeRecursive(
    nodes: NodeDef[],
    currentBreadcrumbs: string[],
  ): NodeDef[] {
    return nodes.map((node) => {
      if (node.kind === 'submenu') {
        const submenuPath = [
          ...currentBreadcrumbs,
          normalizeValue(node.value),
        ].join('.')
        const asyncNodes = asyncMap.get(submenuPath)

        // Get merged child nodes
        const mergedStaticChildren = node.nodes
          ? mergeRecursive(node.nodes, [
              ...currentBreadcrumbs,
              normalizeValue(node.value),
            ])
          : undefined

        // If there are async nodes for this submenu, merge them
        if (asyncNodes) {
          return {
            ...node,
            nodes: mergeSubmenuNodes(mergedStaticChildren, asyncNodes),
          }
        }

        // If children were modified, return updated node
        if (mergedStaticChildren !== node.nodes) {
          return { ...node, nodes: mergedStaticChildren }
        }
      }

      if (node.kind === 'group') {
        const mergedChildren = mergeRecursive(node.nodes, currentBreadcrumbs)
        if (mergedChildren !== node.nodes) {
          return { ...node, nodes: mergedChildren }
        }
      }

      // Radio groups contain static RadioItemDef[] and don't support async loading,
      // so we skip processing them in the async merge
      if (node.kind === 'radio-group') {
        return node
      }

      return node
    })
  }

  return mergeRecursive(staticContent, [])
}

/**
 * Checks if a submenu should appear in deep search results.
 * `trigger-only` still includes the submenu trigger row.
 */
export function shouldIncludeInDeepSearch(
  includeInDeepSearch: IncludeInDeepSearch | undefined,
): boolean {
  return includeInDeepSearch !== false
}

/**
 * Checks if submenu descendants (rows inside submenu) should be included.
 * `trigger-only` excludes descendants.
 */
export function shouldIncludeSubmenuRowsInDeepSearch(
  includeInDeepSearch: IncludeInDeepSearch | undefined,
): boolean {
  return includeInDeepSearch === true
}

/**
 * Checks if an async loader should be rendered eagerly.
 * Eager loaders mount when the root menu opens (before their submenu is opened).
 */
export function shouldLoadEagerly(config: AsyncNodesConfig): boolean {
  if (config.type === 'query') {
    const initialLoadWhen =
      config.initialQueryBehavior === false
        ? 'needed'
        : (config.initialQueryBehavior?.loadWhen ?? 'needed')

    if (initialLoadWhen === 'parent-open') {
      return true
    }
  }

  // Both static and query loaders can still opt into legacy eager strategy.
  return config.loadStrategy === 'eager'
}
