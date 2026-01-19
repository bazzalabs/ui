import type {
  Column,
  DataTableFilterActions,
  DurationUnit,
  NumberFilterOperator,
} from '@bazza-ui/filters'
import { parseNumberInput } from '@bazza-ui/filters'
import type { ItemDef } from '@bazza-ui/react'
import { createNumberItemRenderer } from './number-item'

/**
 * Data structure for number filter menu items.
 * Used to display operator and value(s) in the NumberItem component.
 */
export interface NumberFilterItemData {
  operator: NumberFilterOperator
  values: number[]
  /** Whether this is a range filter (is between / is not between) */
  isRange: boolean
  /** The unit to display with the values (e.g., 'hours', 'minutes') */
  displayUnit?: DurationUnit
}

/**
 * Single-value number operators (not range-based).
 */
const SINGLE_VALUE_OPERATORS: NumberFilterOperator[] = [
  'is',
  'is not',
  'is greater than',
  'is greater than or equal to',
  'is less than',
  'is less than or equal to',
]

/**
 * Range-based number operators.
 */
const RANGE_OPERATORS: NumberFilterOperator[] = ['is between', 'is not between']

/**
 * Creates number filter items based on the current search query.
 * This is called dynamically when the search changes.
 *
 * Supports:
 * - Plain numbers: "42", "3.14"
 * - Duration units: "1hr", "30min", "2d" (converted to column's base unit)
 * - Range syntax: "5-10", "5..10", "5 to 10"
 */
export function createNumberFilterItems<TData>({
  query,
  column,
  actions,
  baseUnit = 'ms',
}: {
  query: string
  column: Column<TData, 'number'>
  actions: DataTableFilterActions
  /** The base unit the column stores values in. Defaults to 'ms'. */
  baseUnit?: DurationUnit
}): ItemDef[] {
  // Only show items when there's a query
  if (!query?.trim()) {
    return []
  }

  // Parse the input with unit conversion
  const parsed = parseNumberInput(query, baseUnit)
  if (!parsed) {
    return []
  }

  const changeNumber = (values: number[], operator: NumberFilterOperator) => {
    actions.batch((tx) => {
      tx.setFilterValue(column, values)
      tx.setFilterOperator(column.id, operator)
    })
  }

  // Determine the display unit - only show if baseUnit is set and not 'ms'
  const displayUnit = baseUnit && baseUnit !== 'ms' ? baseUnit : undefined

  // If it's a range, show range operators
  if (parsed.isRange && parsed.rangeValues) {
    const [min, max] = parsed.rangeValues

    return RANGE_OPERATORS.map((operator) => {
      const itemData: NumberFilterItemData = {
        operator,
        values: [min, max],
        isRange: true,
        displayUnit,
      }

      return {
        kind: 'item' as const,
        id: `${column.id}-number-${operator.replace(/\s+/g, '-')}-${min}-${max}`,
        label: `${operator} ${min} and ${max}`,
        keywords: [query, String(min), String(max)],
        onSelect: () => {
          changeNumber([min, max], operator)
        },
        render: createNumberItemRenderer(itemData),
      } satisfies ItemDef
    })
  }

  // Single value - show all single-value operators
  const value = parsed.value

  return SINGLE_VALUE_OPERATORS.map((operator) => {
    const itemData: NumberFilterItemData = {
      operator,
      values: [value],
      isRange: false,
      displayUnit,
    }

    return {
      kind: 'item' as const,
      id: `${column.id}-number-${operator.replace(/\s+/g, '-')}-${value}`,
      label: `${operator} ${value}`,
      keywords: [query, String(value)],
      onSelect: () => {
        changeNumber([value], operator)
      },
      render: createNumberItemRenderer(itemData),
    } satisfies ItemDef
  })
}
