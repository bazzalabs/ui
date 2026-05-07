'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'

// ============================================================================
// Portal Props
// ============================================================================

export interface PortalProps {
  children: React.ReactNode
  /**
   * Target container for the portal.
   * @default document.body
   */
  container?: Element | null
}

// ============================================================================
// Portal Component
// ============================================================================

export function Portal(props: PortalProps): React.ReactPortal | null {
  const { children, container } = props
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) {
    return null
  }

  const target =
    container ?? (typeof document !== 'undefined' ? document.body : null)

  if (!target) {
    return null
  }

  return createPortal(children, target)
}

// ============================================================================
// Namespace
// ============================================================================

export namespace Portal {
  export type Props = PortalProps
}
