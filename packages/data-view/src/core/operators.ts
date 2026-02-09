// @bazza-ui/data-view — Operator Utilities
// getOperatorSet and determineNewOperator helpers.

import type { OperatorSet } from './operator-set.js'
import { defaultOperatorSets } from './operator-sets.js'
import type { Column, ColumnDataType } from './types.js'

/**
 * Returns the OperatorSet for a column.
 *
 * Resolution order:
 * 1. `column.operators` (per-column override via builder `.operators()`)
 * 2. `defaultOperatorSets[column.type]` (built-in default for the column's data type)
 *
 * Throws if the column type has no default operator set and no override is provided.
 */
export function getOperatorSet<TData>(
  column: Pick<Column<TData>, 'type'> & { operators?: OperatorSet },
): OperatorSet {
  if (column.operators) return column.operators

  const builtIn =
    defaultOperatorSets[column.type as keyof typeof defaultOperatorSets]
  if (builtIn) return builtIn

  throw new Error(
    `[data-view] No operator set found for column type "${column.type}". ` +
      'Provide an operator set via the column builder `.operators()` method or use a built-in column type.',
  )
}

/**
 * Determines the new operator when filter values transition between
 * single (≤1) and multiple (≥2) counts.
 *
 * Uses the `singular` / `plural` properties on OperatorDefinition
 * to auto-transition operators:
 * - 1 → 2+ values: reads `singular` from the current operator (points to the multi-value form)
 * - 2+ → 1 values: reads `plural` from the current operator (points to the single-value form)
 *
 * If no transition reference exists, the current operator is returned unchanged.
 */
export function determineNewOperator(
  operatorSet: OperatorSet,
  oldVals: unknown[],
  nextVals: unknown[],
  currentOperator: string,
): string {
  const a = oldVals.length
  const b = nextVals.length

  // No transition needed if:
  // - counts are the same
  // - both are in "multiple" territory (≥2)
  // - both are in "single" territory (≤1)
  if (a === b || (a >= 2 && b >= 2) || (a <= 1 && b <= 1)) {
    return currentOperator
  }

  // The operator may not exist in the set (e.g. custom operator string).
  // In that case, keep the current operator.
  if (!operatorSet.has(currentOperator)) {
    return currentOperator
  }

  const opDef = operatorSet.get(currentOperator)

  // Transition from single → multiple: use the `singular` pointer
  // (singular points to the multi-value counterpart, named after the old convention)
  if (a < b && b >= 2) {
    const target = opDef.singular
    if (target && operatorSet.has(target)) return target
    return currentOperator
  }

  // Transition from multiple → single: use the `plural` pointer
  // (plural points to the single-value counterpart, named after the old convention)
  if (a > b && b <= 1) {
    const target = opDef.plural
    if (target && operatorSet.has(target)) return target
    return currentOperator
  }

  return currentOperator
}
