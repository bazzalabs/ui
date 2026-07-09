'use client'

import * as React from 'react'

export interface SubmenuContextValue {
  /** Whether the submenu is open */
  open: boolean
  /** Set the submenu open state */
  setOpen: (open: boolean) => void
  /**
   * Latch set by explicit close actions (keyboard ArrowLeft/Ctrl+H/Escape-in-submenu,
   * or clicking the open trigger). While set and the trigger remains highlighted,
   * pointer/keyboard auto-open is suppressed. Reset when highlight leaves the trigger.
   */
  suppressAutoOpenRef: React.MutableRefObject<boolean>
  /** Reference to the trigger element */
  triggerRef: React.RefObject<HTMLElement | null>
  /** Reference to the submenu content element (for aim guard rect calculations) */
  contentRef: React.RefObject<HTMLElement | null>
  /** Surface ID of the parent menu (for keyboard navigation back) */
  parentSurfaceId: string
  /** Surface ID of this submenu (for keyboard navigation into) */
  childSurfaceId: string
  /**
   * Whether pressing Escape in this submenu closes the entire menu from the root.
   * When true, Escape closes the entire menu tree.
   * When false, Escape only closes this submenu and moves focus to the parent.
   * @default true
   */
  closeRootOnEsc: boolean
}

const SubmenuContext = React.createContext<SubmenuContextValue | null>(null)

export function useSubmenuContext(): SubmenuContextValue {
  const context = React.useContext(SubmenuContext)
  if (!context) {
    throw new Error('SubmenuTrigger must be used within a Submenu')
  }
  return context
}

export function useMaybeSubmenuContext(): SubmenuContextValue | null {
  return React.useContext(SubmenuContext)
}

export { SubmenuContext }
