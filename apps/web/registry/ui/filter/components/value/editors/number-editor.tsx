'use client'

import type {
  Column,
  DataTableFilterActions,
  DurationUnit,
} from '@bazza-ui/filters'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import { createNumberFilterItems } from '../number-menu'

export interface NumberEditorContentProps<TData = unknown> {
  column: Column<TData, 'number'>
  actions: DataTableFilterActions
  /**
   * The base unit that the column stores values in.
   * When a user types duration values like "1hr" or "30min",
   * they will be converted to this unit.
   *
   * @default 'ms' (milliseconds)
   *
   * @example
   * // Column stores values in minutes
   * <NumberEditorContent column={column} actions={actions} baseUnit="minutes" />
   * // User types "1hr" → converts to 60 minutes
   */
  baseUnit?: DurationUnit
}

/**
 * Shared number editor content for both FilterValue and FilterMenu.
 * Provides a search input and dynamically generated filter options.
 *
 * Supports:
 * - Plain numbers: "42", "3.14"
 * - Duration units: "1hr", "30min", "2d", "5s" (converted to base unit)
 * - Range syntax: "5-10", "5..10", "5 to 10"
 */
export function NumberEditorContent<TData>({
  column,
  actions,
  baseUnit = 'ms',
}: NumberEditorContentProps<TData>) {
  const [query, setQuery] = useState('')

  const nodes = useMemo(
    () => createNumberFilterItems({ query, column, actions, baseUnit }),
    [query, column, actions, baseUnit],
  )

  // Build placeholder text based on whether units are enabled
  const placeholder =
    baseUnit && baseUnit !== 'ms'
      ? 'Type number or duration (e.g., 1hr, 30min)...'
      : 'Type a number...'

  return (
    <DropdownMenu.DataSurface content={nodes}>
      <DropdownMenu.DataInput
        placeholder={placeholder}
        value={query}
        onValueChange={setQuery}
      />
      <DropdownMenu.DataList className={cn(!query && 'hidden')}>
        {({ nodes: displayNodes, renderNode }) =>
          displayNodes.length > 0 ? (
            displayNodes.map(renderNode)
          ) : query.trim() ? (
            <div className="flex items-center justify-center h-10 text-muted-foreground text-sm">
              Enter a valid number
            </div>
          ) : null
        }
      </DropdownMenu.DataList>
    </DropdownMenu.DataSurface>
  )
}
