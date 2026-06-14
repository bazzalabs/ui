'use client'

import type {
  Column,
  DataTableFilterActions,
  FilterModel,
  FilterStrategy,
  Locale,
} from '@bazza-ui/filters'
import { isMultiOptionColumn, isOptionColumn } from '@bazza-ui/filters'
import type {
  CheckboxItemDef,
  NodeDef,
  SeparatorDef,
  SeparatorRenderParams,
} from '@bazza-ui/react/dropdown-menu'
import { useMemo } from 'react'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import { createMultiOptionMenu, createOptionMenu } from '../selectable-menu'

export interface OptionEditorContentProps<TData = unknown> {
  column: Column<TData, 'option'> | Column<TData, 'multiOption'>
  actions: DataTableFilterActions
  filter?: FilterModel<'option'> | FilterModel<'multiOption'>
  locale: Locale
  strategy: FilterStrategy
  /**
   * Initial values used to determine the separator position.
   * Items matching these values appear above the separator.
   */
  initialValues?: (string | number | bigint | boolean | Date)[]
  /**
   * When true, shows a separator between selected and unselected items.
   * Used by FilterValue to maintain selection order visibility.
   */
  showSeparator?: boolean
}

/**
 * Helper function to partition nodes into selected and unselected.
 */
function partitionNodesBySelection<T extends { id?: string }>(
  nodes: T[],
  initialValues: string[],
): { selected: T[]; unselected: T[] } {
  const selected = nodes.filter(
    (node) => node.id != null && initialValues.includes(node.id),
  )
  const unselected = nodes.filter(
    (node) => node.id == null || !initialValues.includes(node.id),
  )
  return { selected, unselected }
}

/**
 * Helper function to create nodes with a separator between selected and unselected.
 */
function createNodesWithSeparator(
  nodes: CheckboxItemDef[],
  initialValues: (string | number | bigint | boolean | Date)[],
): NodeDef[] {
  const { selected, unselected } = partitionNodesBySelection(
    nodes,
    initialValues as string[],
  )

  const result: NodeDef[] = [...selected]

  if (selected.length > 0 && unselected.length > 0) {
    const separator: SeparatorDef = {
      kind: 'separator',
      id: 'selected-separator',
      render: ({ props }: SeparatorRenderParams) => (
        <DropdownMenu.Separator key={props.id} />
      ),
    }
    result.push(separator)
  }

  result.push(...unselected)
  return result
}

/**
 * Shared option/multiOption editor content for both FilterValue and FilterMenu.
 * Provides a searchable list of checkbox items.
 */
export function OptionEditorContent<TData>({
  column,
  actions,
  filter,
  locale,
  strategy,
  initialValues = [],
  showSeparator = false,
}: OptionEditorContentProps<TData>) {
  const nodes = useMemo(() => {
    let baseNodes: CheckboxItemDef[]

    if (isOptionColumn(column)) {
      const result = createOptionMenu({
        column,
        actions,
        filter: filter as FilterModel<'option'> | undefined,
        locale,
        strategy,
      })
      baseNodes = result.nodes
    } else if (isMultiOptionColumn(column)) {
      const result = createMultiOptionMenu({
        column,
        actions,
        filter: filter as FilterModel<'multiOption'> | undefined,
        locale,
        strategy,
      })
      baseNodes = result.nodes
    } else {
      baseNodes = []
    }

    if (showSeparator && initialValues.length > 0) {
      return createNodesWithSeparator(baseNodes, initialValues)
    }

    return baseNodes
  }, [column, actions, filter, locale, strategy, initialValues, showSeparator])

  return (
    <DropdownMenu.Surface content={nodes}>
      <DropdownMenu.Input
        placeholder={`Search ${column.displayName.toLowerCase()}...`}
      />
      <DropdownMenu.List virtualized maxHeight={300}>
        <DropdownMenu.Empty>No matching options.</DropdownMenu.Empty>
      </DropdownMenu.List>
    </DropdownMenu.Surface>
  )
}
