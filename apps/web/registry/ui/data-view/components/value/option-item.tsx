'use client'

import type { ColumnOptionExtended } from '@bazza-ui/data-view'
import type { CheckboxItemRenderParams } from '@bazza-ui/react'
import * as React from 'react'
import { isValidElement } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { DropdownMenu, LabelWithBreadcrumbs } from '@/registry/ui/dropdown-menu'

/**
 * Renders an option/checkbox item for option-based filter values.
 * Used as a render function in CheckboxItemDef.
 */
export function renderOptionItem(
  option: ColumnOptionExtended,
  params: CheckboxItemRenderParams,
): React.ReactNode {
  const { props, context } = params
  const { id, checked, onCheckedChange, disabled, closeOnClick } = props

  const Icon = option.icon as
    | React.ComponentType<{ className?: string }>
    | React.ReactElement
    | undefined
  const hasIcon = !!Icon

  return (
    <DropdownMenu.CheckboxItem
      key={id}
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      closeOnClick={closeOnClick ?? false}
      className={cn(
        'group/row justify-between gap-4 data-measuring:w-max not-data-measuring:w-[min(500px,max(var(--row-width),200px))]',
        hasIcon && 'gap-2',
      )}
    >
      <div className="flex items-center gap-2 group-data-measuring/row:w-max w-full min-w-0">
        <DropdownMenu.CheckboxItemIndicator
          keepMounted
          render={(indicatorProps, state) => (
            <Checkbox
              checked={state.checked}
              tabIndex={-1}
              className="opacity-0 data-[state=checked]:opacity-100 group-data-[highlighted]/row:opacity-100 dark:border-ring shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                state.toggle()
              }}
            />
          )}
        />
        {hasIcon && (
          <div className="size-4 min-h-4 min-w-4 flex items-center justify-center">
            {isValidElement(Icon) ? (
              Icon
            ) : (
              <DropdownMenu.Icon>
                {React.createElement(
                  Icon as React.ComponentType<{ className?: string }>,
                  {
                    className:
                      'size-4 shrink-0 text-muted-foreground group-data-[highlighted]/row:text-primary',
                  },
                )}
              </DropdownMenu.Icon>
            )}
          </div>
        )}
        <LabelWithBreadcrumbs
          label={option.label ?? ''}
          breadcrumbs={
            context.isDeepSearchResult ? context.breadcrumbs : undefined
          }
        />
      </div>
      {option.count !== undefined && option.count > 0 && (
        <span className="tabular-nums text-muted-foreground tracking-tight text-xs">
          {new Intl.NumberFormat().format(option.count)}
        </span>
      )}
    </DropdownMenu.CheckboxItem>
  )
}

/**
 * Creates a render function for an option item.
 * This is used when building CheckboxItemDef nodes.
 */
export function createOptionItemRenderer(option: ColumnOptionExtended) {
  return (params: CheckboxItemRenderParams): React.ReactNode => {
    return renderOptionItem(option, params)
  }
}
