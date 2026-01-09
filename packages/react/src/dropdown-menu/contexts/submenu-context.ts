'use client'

import * as React from 'react'

export interface SubmenuContextValue {
  /** Whether the submenu is open */
  open: boolean
  /** Set the submenu open state */
  setOpen: (open: boolean) => void
  /** Reference to the trigger element */
  triggerRef: React.RefObject<HTMLElement | null>
  /** Reference to the submenu content element (for aim guard rect calculations) */
  contentRef: React.RefObject<HTMLElement | null>
}

const SubmenuContext = React.createContext<SubmenuContextValue | null>(null)

export function useSubmenuContext(): SubmenuContextValue {
  const context = React.useContext(SubmenuContext)
  if (!context) {
    throw new Error(
      'DropdownMenu.SubmenuTrigger must be used within DropdownMenu.Submenu',
    )
  }
  return context
}

export function useMaybeSubmenuContext(): SubmenuContextValue | null {
  return React.useContext(SubmenuContext)
}

export { SubmenuContext }
