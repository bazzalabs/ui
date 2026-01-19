'use client'

import type { ItemRenderParams } from '@bazza-ui/react'
import type * as React from 'react'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'
import type { TextFilterItemData } from './text-menu'

/**
 * Renders a text filter item showing the operator and value.
 * Used as a render function in ItemDef.
 */
export function renderTextItem(
  data: TextFilterItemData,
  params: ItemRenderParams,
): React.ReactNode {
  const { props } = params

  return (
    <DropdownMenu.Item {...props} className={'group/row gap-1'}>
      <span className="text-muted-foreground shrink-0">{data.operator}</span>
      <span className="truncate">{data.values[0]}</span>
    </DropdownMenu.Item>
  )
}

/**
 * Creates a render function for a text filter item.
 * This is used when building ItemDef nodes for text filters.
 */
export function createTextItemRenderer(data: TextFilterItemData) {
  return (params: ItemRenderParams): React.ReactNode => {
    return renderTextItem(data, params)
  }
}
