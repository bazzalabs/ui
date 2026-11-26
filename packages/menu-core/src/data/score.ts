// ============================================================================
// Score Nodes
// ============================================================================

import { commandScore } from '../text/command-score.js'
import type { FilterFn } from '../text/filter.js'
import { normalizeValue } from '../text/normalize.js'
import type { AnyMenuNode } from '../tree/menu-node.js'
import type {
  FlattenedNode,
  PipelineDisplayTypes,
  PipelineMenuNode,
  ScoredNode,
} from './types.js'

// Score Nodes
// ============================================================================

/**
 * Scores nodes against a search query with `filter` (`commandScore` by
 * default). A node's `forceScore` replaces its computed score.
 * Returns only nodes with a score > 0.
 */
export function scoreNodes<N extends PipelineMenuNode<N> = AnyMenuNode>(
  flattenedNodes: FlattenedNode<PipelineDisplayTypes<N>>[],
  query: string,
  filter: FilterFn = commandScore,
): ScoredNode<PipelineDisplayTypes<N>>[] {
  if (!query) {
    // No query - return all nodes with score 1
    return flattenedNodes.map(
      ({
        node,
        breadcrumbs,
        group,
        radioGroup,
        checkboxGroup,
      }): ScoredNode<PipelineDisplayTypes<N>> => ({
        node,
        score: 1,
        breadcrumbs,
        group,
        radioGroup,
        checkboxGroup,
      }),
    )
  }

  const results: ScoredNode<PipelineDisplayTypes<N>>[] = []

  for (const {
    node,
    breadcrumbs,
    group,
    radioGroup,
    checkboxGroup,
    inheritedKeywords,
  } of flattenedNodes) {
    // Normalize value and keywords to match cmdk's behavior
    const normalizedValue = normalizeValue(node.def.value)
    const normalizedKeywords = [
      ...(node.def.keywords ?? []),
      ...inheritedKeywords,
    ]
      .map((k) => normalizeValue(k))
      .filter(Boolean)

    const fuzzyScore = filter(
      normalizedValue,
      query,
      normalizedKeywords.length > 0 ? normalizedKeywords : undefined,
    )
    const score = node.def.forceScore ?? fuzzyScore

    if (score > 0) {
      results.push({
        node,
        score,
        breadcrumbs,
        group,
        radioGroup,
        checkboxGroup,
      })
    }
  }

  return results
}

// ============================================================================
