'use client'

import type { DurationUnit } from '@bazza-ui/filters'
import type { ItemRenderParams } from '@bazza-ui/react'
import type * as React from 'react'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import type { NumberFilterItemData } from './number-menu'

/**
 * Singular unit names for display in filter items.
 */
const UNIT_SINGULAR: Record<DurationUnit, string> = {
  ms: 'millisecond',
  milliseconds: 'millisecond',
  seconds: 'second',
  minutes: 'minute',
  hours: 'hour',
  days: 'day',
}

/**
 * Plural unit names for display in filter items.
 */
const UNIT_PLURAL: Record<DurationUnit, string> = {
  ms: 'milliseconds',
  milliseconds: 'milliseconds',
  seconds: 'seconds',
  minutes: 'minutes',
  hours: 'hours',
  days: 'days',
}

/**
 * Formats a number value with optional unit name (singular/plural).
 */
function formatValueWithUnit(value: number, unit?: DurationUnit): string {
  // Round to reasonable precision to avoid floating point noise
  const roundedValue = Math.round(value * 1000) / 1000

  if (!unit) {
    return String(roundedValue)
  }

  // Use singular for 1, plural for everything else
  const unitName = roundedValue === 1 ? UNIT_SINGULAR[unit] : UNIT_PLURAL[unit]
  return `${roundedValue} ${unitName}`
}

/**
 * Renders a number filter item showing the operator and value.
 * Used as a render function in ItemDef.
 */
export function renderNumberItem(
  data: NumberFilterItemData,
  params: ItemRenderParams,
): React.ReactNode {
  const { props } = params

  // Format the display value based on whether it's a range or single value
  const [firstValue, secondValue] = data.values
  const displayValue = data.isRange
    ? `${formatValueWithUnit(firstValue ?? 0, data.displayUnit)} and ${formatValueWithUnit(secondValue ?? 0, data.displayUnit)}`
    : formatValueWithUnit(firstValue ?? 0, data.displayUnit)

  return (
    <DropdownMenu.Item {...props} className={'group/row gap-1'}>
      <span className="text-muted-foreground shrink-0">{data.operator}</span>
      <span className="truncate">{displayValue}</span>
    </DropdownMenu.Item>
  )
}

/**
 * Creates a render function for a number filter item.
 * This is used when building ItemDef nodes for number filters.
 */
export function createNumberItemRenderer(data: NumberFilterItemData) {
  return (params: ItemRenderParams): React.ReactNode => {
    return renderNumberItem(data, params)
  }
}
