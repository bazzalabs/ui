import { InteractionGuard } from '@bazza-ui/popup-menu'
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
  const { scopeId, onOpenChange, setAnchorPoint } = useRootContext()
  const triggerRef = React.useRef<HTMLDivElement>(null)

  // Handle right-click on trigger element
  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      // Update anchor point first (menu will reposition if already open)
      setAnchorPoint({ x: e.clientX, y: e.clientY })
      // Always call onOpenChange(true) - if already open, this is a no-op
      // This matches Base UI's approach and keeps the implementation simple
      onOpenChange(true)
    },
    [onOpenChange, setAnchorPoint],
  )

  // Prevent native context menu on trigger area
  // This ensures the browser's context menu never shows
  React.useEffect(() => {
    const handleDocumentContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target && triggerRef.current?.contains(target)) {
        e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', handleDocumentContextMenu)
    return () => {
      document.removeEventListener('contextmenu', handleDocumentContextMenu)
    }
  }, [])

  return (
    <InteractionGuard.Branch
      ref={triggerRef}
      scopeId={scopeId}
      onContextMenu={handleContextMenu}
    >
      {children}
    </InteractionGuard.Branch>
  )
}
