'use client'

import type { Column, DataTableFilterActions } from '@bazza-ui/filters'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import { createTextFilterItems } from '../text-menu'

export interface TextEditorContentProps<TData = unknown> {
  column: Column<TData, 'text'>
  actions: DataTableFilterActions
}

/**
 * Shared text editor content for both FilterValue and FilterMenu.
 * Provides a search input and dynamically generated filter options.
 */
export function TextEditorContent<TData>({
  column,
  actions,
}: TextEditorContentProps<TData>) {
  const [query, setQuery] = useState('')

  const nodes = useMemo(
    () => createTextFilterItems({ query, column, actions }),
    [query, column, actions],
  )

  return (
    <DropdownMenu.Surface content={nodes}>
      <DropdownMenu.Input
        placeholder="Type to filter..."
        value={query}
        onValueChange={setQuery}
      />
      <DropdownMenu.List className={cn(!query && 'hidden')}>
        <TextEditorItems query={query} />
      </DropdownMenu.List>
    </DropdownMenu.Surface>
  )
}

function TextEditorItems({ query }: { query: string }) {
  const { nodes: displayNodes, renderNode } = DropdownMenu.useDataList()

  if (displayNodes.length > 0) {
    return <>{displayNodes.map(renderNode)}</>
  }

  if (query.trim()) {
    return (
      <div className="flex items-center justify-center h-10 text-muted-foreground text-sm">
        Press enter to filter by "{query}"
      </div>
    )
  }

  return null
}
