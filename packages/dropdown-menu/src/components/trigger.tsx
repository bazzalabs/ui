import { Popover } from '@base-ui-components/react/popover'
import { InteractionGuard } from '@bazza-ui/popup-menu'
import { composeRefs } from '@radix-ui/react-compose-refs'
import type * as React from 'react'
import { useRootContext } from '../contexts/root-context.js'

export interface DropdownMenuTriggerProps {
  /** Trigger element - will open dropdown menu on click */
  children: React.ReactNode
  /** Whether to use child as trigger (for composition) */
  asChild?: boolean
  /** Whether the trigger is disabled */
  disabled?: boolean
}

/**
 * DropdownMenuTrigger - Click trigger that opens the dropdown menu
 */
export function DropdownMenuTrigger({
  children,
  asChild = false,
  disabled = false,
}: DropdownMenuTriggerProps) {
  const { triggerRef, scopeId } = useRootContext()

  if (asChild) {
    return (
      <InteractionGuard.Branch asChild scopeId={scopeId}>
        <Popover.Trigger
          render={children as any}
          ref={composeRefs(triggerRef as any)}
          disabled={disabled}
        />
      </InteractionGuard.Branch>
    )
  }

  return (
    <InteractionGuard.Branch asChild scopeId={scopeId}>
      <Popover.Trigger ref={composeRefs(triggerRef as any)} disabled={disabled}>
        {children}
      </Popover.Trigger>
    </InteractionGuard.Branch>
  )
}
