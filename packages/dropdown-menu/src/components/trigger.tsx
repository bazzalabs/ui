import * as React from 'react'
import { useRootContext } from '../contexts/root-context.js'

export interface DropdownMenuTriggerProps {
  /** Trigger element - will open dropdown menu on click */
  children: React.ReactNode
}

/**
 * DropdownMenuTrigger - Wrapper that captures click events
 */
export function DropdownMenuTrigger({ children }: DropdownMenuTriggerProps) {
  const { open, onOpenChange, triggerRef } = useRootContext()

  // Handle click on trigger element - toggle open state
  const handleClick = React.useCallback(() => {
    onOpenChange(!open)
  }, [open, onOpenChange])

  return (
    <div ref={triggerRef} onClick={handleClick}>
      {children}
    </div>
  )
}
