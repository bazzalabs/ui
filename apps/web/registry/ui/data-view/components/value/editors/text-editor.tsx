'use client'

import type {
  Column,
  DataViewInstance,
  ViewLayer,
} from '@bazza-ui/data-view/react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import { createTextFilterItems } from '../text-menu'

export interface TextEditorContentProps<TData = unknown> {
  column: Column<TData, 'text'>
  layer: ViewLayer<TData>
  instance?: DataViewInstance<TData, any, any>
}

/**
 * Shared text editor content for both FilterValue and FilterMenu.
 * Provides a search input and dynamically generated filter options.
 */
export function TextEditorContent<TData>({
  column,
  layer,
  instance,
}: TextEditorContentProps<TData>) {
  const [query, setQuery] = useState('')

  const nodes = useMemo(
    () => createTextFilterItems({ query, column, layer, instance }),
    [query, column, layer, instance],
  )

  return (
    <DropdownMenu.DataSurface content={nodes}>
      <DropdownMenu.DataInput
        placeholder="Type to filter..."
        value={query}
        onValueChange={setQuery}
      />
      <DropdownMenu.DataList className={cn(!query && 'hidden')}>
        {({ nodes: displayNodes, renderNode }) =>
          displayNodes.length > 0 ? (
            displayNodes.map(renderNode)
          ) : query.trim() ? (
            <div className="flex items-center justify-center h-10 text-muted-foreground text-sm">
              Press enter to filter by "{query}"
            </div>
          ) : null
        }
      </DropdownMenu.DataList>
    </DropdownMenu.DataSurface>
  )
}
