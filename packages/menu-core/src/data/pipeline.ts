// ============================================================================
// Full Pipeline
// ============================================================================

import type { FilterFn } from '../text/filter.js'
import type { IncludeInDeepSearch } from '../tree/branch-config.js'
import { type ContainerSelection, selectionOf } from '../tree/container.js'
import type { AnyMenuNode } from '../tree/menu-node.js'
import { getBrowseNodesPreserve } from './browse.js'
import {
  type ContainerSearchBehaviors,
  membershipOf,
  rowContainerOf,
} from './container.js'
import {
  buildDisplayContainerNode,
  buildDisplayRowNode,
  buildDisplayRowNodes,
} from './display.js'
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
  ContainerMenuNode,
  DisabledBranchBehavior,
  FlattenedNode,
  GroupBehavior,
  PipelineDisplayNode,
  PipelineDisplayRowNode,
  PipelineDisplayTypes,
  PipelineMenuNode,
  RadioGroupBehavior,
  ScoredNode,
} from './types.js'

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

/** What a Container collects during a search. */
interface ContainerMatches<N extends PipelineMenuNode<N>> {
  menuNode: ContainerMenuNode<N>
  /** The rows that matched the query. */
  matching: ScoredNode<PipelineDisplayTypes<N>>[]
  breadcrumbs: BreadcrumbNode<PipelineDisplayTypes<N>>[]
}

/**
 * Display order of Containers with equal sort keys, and with `sortGroups`
 * off: groups, then radio groups, then checkbox groups, each in the order
 * their first row was found.
 */
const selectionRank: Readonly<Record<ContainerSelection, number>> = {
  none: 0,
  single: 1,
  multiple: 2,
}

/**
 * Keys a Container's rows. Containers of different selection modes that
 * share an id stay apart; two of the same mode that share an id (from
 * different branches during deep search) are shown as one.
 */
function containerKey<N extends PipelineMenuNode<N>>(
  menuNode: ContainerMenuNode<N>,
): string {
  return `${selectionOf(menuNode.def.kind)}:${menuNode.def.id}`
}

/**
 * Filters nodes for a search. Each Container's rows either stay in their
 * Container or join the loose rows, by the search behavior of its selection
 * mode: `groupSearchBehavior` for groups, `radioGroupSearchBehavior` for
 * radio groups, `checkboxGroupSearchBehavior` for checkbox groups.
 *
 * - `groupSearchBehavior: 'flatten'`: loose rows are sorted by score, items
 *   before branches, and deduplicated; they come before the Containers, and
 *   everything is sorted by forced order, kind, then score.
 * - `groupSearchBehavior: 'preserve'`: Containers come before loose rows, and
 *   everything is sorted the same way when `sortGroups` is on.
 */
function filterNodesSearch<N extends PipelineMenuNode<N>>(
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
    groupSearchBehavior = 'preserve',
    radioGroupSearchBehavior = 'preserve',
    checkboxGroupSearchBehavior = 'preserve',
    sortGroups = true,
    filter,
  } = options

  const behaviors: ContainerSearchBehaviors = {
    none: groupSearchBehavior,
    single: radioGroupSearchBehavior,
    multiple: checkboxGroupSearchBehavior,
  }
  const behaviorOf = (menuNode: ContainerMenuNode<N>) =>
    behaviors[selectionOf(menuNode.def.kind)]

  // Determine if deep search should activate
  const shouldDeepSearch = deepSearch && query.length >= minLength

  // Flatten nodes, tracking the Container each row is in
  const flattened = flattenNodes(nodes, {
    deep: shouldDeepSearch,
    includeInDeepSearch,
    disabledBranchBehavior,
  })

  // A 'preserve-show-all' Container shows every row once any row matches, so
  // collect all of its rows before scoring.
  const allContainerRows = new Map<
    string,
    FlattenedNode<PipelineDisplayTypes<N>>[]
  >()
  for (const flatNode of flattened) {
    const menuNode = rowContainerOf(flatNode)
    if (!menuNode || behaviorOf(menuNode) !== 'preserve-show-all') continue
    const key = containerKey(menuNode)
    const rows = allContainerRows.get(key)
    if (rows) rows.push(flatNode)
    else allContainerRows.set(key, [flatNode])
  }

  // Score nodes
  const scored = scoreNodes(flattened, query, filter)

  // Partition into Containers and loose rows
  const containers = new Map<string, ContainerMatches<N>>()
  const looseRows: ScoredNode<PipelineDisplayTypes<N>>[] = []
  for (const scoredNode of scored) {
    const menuNode = rowContainerOf(scoredNode)
    if (!menuNode || behaviorOf(menuNode) === 'flatten') {
      looseRows.push(scoredNode)
      continue
    }
    const key = containerKey(menuNode)
    const existing = containers.get(key)
    if (existing) {
      existing.matching.push(scoredNode)
    } else {
      containers.set(key, {
        menuNode,
        matching: [scoredNode],
        breadcrumbs: scoredNode.breadcrumbs,
      })
    }
  }

  // Build display nodes for Containers
  const containerDisplayNodes = [...containers.entries()]
    .sort(
      ([, a], [, b]) =>
        selectionRank[selectionOf(a.menuNode.def.kind)] -
        selectionRank[selectionOf(b.menuNode.def.kind)],
    )
    .map(([key, { menuNode, matching, breadcrumbs }]) => {
      let rows = matching
      const allRows =
        behaviorOf(menuNode) === 'preserve-show-all'
          ? allContainerRows.get(key)
          : undefined
      if (allRows) {
        // Include every row of the Container, scoring non-matching ones 0
        const matchingScores = new Map(
          matching.map((item) => [item.node.id, item.score]),
        )
        rows = allRows.map((flatNode) => ({
          node: flatNode.node,
          score: matchingScores.get(flatNode.node.id) ?? 0,
          breadcrumbs: flatNode.breadcrumbs,
          ...membershipOf(flatNode),
        }))
      }

      // Sort rows by forced order, then score.
      rows.sort(compareScoredNodesByForceOrderAndScore)

      const bestScore = Math.max(...rows.map((item) => item.score), 0)
      const items = rows.map((item) =>
        buildDisplayRowNode(item, query, highlightedId),
      )
      const node = buildDisplayContainerNode<N>(
        menuNode,
        {
          search: query ? { query, bestScore } : null,
          matchCount: matching.length,
          breadcrumbs,
          isDeepSearchResult: breadcrumbs.length > 0,
        },
        items,
        bestScore,
      )
      return {
        node,
        score: bestScore,
        forceOrder: getMinForceOrderFromDisplayRows(items),
        kindRank: 0,
      }
    })

  // Build display nodes for loose rows
  const looseDisplayNodes: PipelineDisplayRowNode<N>[] =
    groupSearchBehavior === 'flatten'
      ? buildDisplayRowNodes(
          deduplicateNodes(partitionByKind(sortByScore(looseRows))),
          query,
          highlightedId,
        )
      : looseRows
          .sort(compareScoredNodesByForceOrderAndScore)
          .map((item) => buildDisplayRowNode(item, query, highlightedId))
  const looseSortable = looseDisplayNodes.map((row) => ({
    node: row as PipelineDisplayNode<N>,
    score: getDisplayRowScore(row),
    forceOrder: getDisplayRowForceOrder(row),
    kindRank: getRowKindSortRank(row.node.kind),
  }))

  // Merge Containers and loose rows, sorted by forced order, kind, then score.
  const allNodes =
    groupSearchBehavior === 'flatten'
      ? [...looseSortable, ...containerDisplayNodes]
      : [...containerDisplayNodes, ...looseSortable]

  if (groupSearchBehavior === 'flatten' || sortGroups) {
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
 * Groups, radio groups, and checkbox groups are Containers; during a search,
 * each follows the search behavior of its selection mode
 * (`groupSearchBehavior`, `radioGroupSearchBehavior`,
 * `checkboxGroupSearchBehavior`). Browse mode always preserves them.
 */
export function filterNodes<N extends PipelineMenuNode<N> = AnyMenuNode>(
  options: FilterNodesOptions<N>,
): FilterNodesResult<N> {
  const { query, nodes, highlightedId, filter } = options

  // Browse mode - no query, or filtering turned off
  // Always preserve groups in browse mode (groupSearchBehavior only affects search)
  if (!query || filter === false) {
    return {
      displayNodes: getBrowseNodesPreserve(nodes, highlightedId),
      isDeepSearching: false,
    }
  }

  return filterNodesSearch({ ...options, filter })
}

// ============================================================================
