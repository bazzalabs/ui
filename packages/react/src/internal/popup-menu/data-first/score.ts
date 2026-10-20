// ============================================================================
// Score Nodes
// ============================================================================

import {
  commandScore,
  defaultFilter,
  splitSearchWords,
} from '../../listbox/utils/command-score.js'
import { normalizeValue } from '../../listbox/utils/normalize.js'
import type { FlattenedNode, ScoredNode } from './types.js'

function normalizeKeywords(keywords: readonly string[]): string[] {
  return keywords.map((k) => normalizeValue(k)).filter(Boolean)
}

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
        group,
        radioGroup,
        checkboxGroup,
      }): ScoredNode => ({
        node,
        score: 1,
        breadcrumbs,
        group,
        radioGroup,
        checkboxGroup,
      }),
    )
  }

  const results: ScoredNode[] = []
  const isMultiWord = splitSearchWords(query).length > 1

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
    const ownKeywords = normalizeKeywords(node.def.keywords ?? [])
    const ancestorValues = normalizeKeywords(inheritedKeywords)
    const normalizedKeywords = [...ownKeywords, ...ancestorValues]

    let fuzzyScore = defaultFilter(
      normalizedValue,
      query,
      normalizedKeywords.length > 0 ? normalizedKeywords : undefined,
    )
    // Tree rows read as "Ancestor › Row", so also match a multi-word query in
    // that order — only when the query reaches past the ancestors into the
    // row, so a query naming just an ancestor doesn't lift all its rows.
    if (
      ancestorValues.length > 0 &&
      isMultiWord &&
      defaultFilter(ancestorValues.join(' '), query) === 0
    ) {
      fuzzyScore = Math.max(
        fuzzyScore,
        commandScore(
          [...ancestorValues, normalizedValue].join(' '),
          query,
          ownKeywords.length > 0 ? ownKeywords : undefined,
        ),
      )
    }
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
