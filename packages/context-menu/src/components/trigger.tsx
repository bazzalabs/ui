import * as React from 'react'
import { useRootContext } from '../contexts/root-context.js'

export interface ContextMenuTriggerProps {
  /** Trigger element - will open context menu on right-click */
  children: React.ReactNode
}

/**
 * ContextMenuTrigger - Wrapper that captures right-click events
 */
export function ContextMenuTrigger({ children }: ContextMenuTriggerProps) {
  const { onOpenChange, setAnchorPoint } = useRootContext()

  // Handle right-click on trigger element
  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setAnchorPoint({ x: e.clientX, y: e.clientY })
      onOpenChange(true)
    },
    [onOpenChange, setAnchorPoint],
  )

  return <div onContextMenu={handleContextMenu}>{children}</div>
}
