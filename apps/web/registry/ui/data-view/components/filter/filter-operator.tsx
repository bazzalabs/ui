'use client'

import {
  getOperatorSet,
  type OperatorDefinition,
} from '@bazza-ui/data-view/react'
import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/registry/ui/dropdown-menu'

import {
  useDataViewContext,
  useDataViewFilterItemContext,
} from '../provider/data-view-context'

// ---------------------------------------------------------------------------
// FilterOperator
// ---------------------------------------------------------------------------

export function FilterOperator({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  const ctx = useDataViewFilterItemContext()
  const { instance, layer } = useDataViewContext()
  if (!ctx) return null

  const { filter, column } = ctx

  // Resolve the operator set for this column
  let operatorSet: ReturnType<typeof getOperatorSet> | null = null
  try {
    operatorSet = getOperatorSet(column)
  } catch {
    // Column type has no operator set — render static text
  }

  if (!operatorSet) {
    return (
      <span
        className={cn('text-xs text-muted-foreground px-0.5', className)}
        {...props}
      >
        {filter.operator}
      </span>
    )
  }

  const operators = operatorSet.all()
  const targetLayer = layer === 'base' ? instance.baseView : instance.overrides

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          'text-xs text-muted-foreground hover:text-foreground px-1 cursor-pointer transition-colors',
          className,
        )}
        render={<span />}
        {...props}
      >
        {filter.operator}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Positioner>
          <DropdownMenu.Popup>
            <DropdownMenu.Surface>
              <DropdownMenu.RadioGroup value={filter.operator}>
                <DropdownMenu.List>
                  {operators.map((op: OperatorDefinition) => (
                    <DropdownMenu.RadioItem
                      key={op.id}
                      value={op.id}
                      onSelect={() => {
                        targetLayer.setFilterOperator(filter.columnId, op.id)
                      }}
                    >
                      {op.label}
                      <DropdownMenu.RadioItemIndicator />
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.List>
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Surface>
          </DropdownMenu.Popup>
        </DropdownMenu.Positioner>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
