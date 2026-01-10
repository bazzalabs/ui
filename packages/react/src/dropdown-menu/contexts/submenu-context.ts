'use client'

import * as React from 'react'

export interface SubmenuOpenDelay {
  /** Delay in ms before opening when hovering the trigger. @default 0 */
  pointer?: number
  /** Delay in ms before opening when navigating to the trigger via keyboard. @default 150 */
  keyboard?: number
}

export interface SubmenuContextValue {
  /** Whether the submenu is open */
  open: boolean
  /** Set the submenu open state */
  setOpen: (open: boolean) => void
  /** Reference to the trigger element */
  triggerRef: React.RefObject<HTMLElement | null>
  /** Reference to the submenu content element (for aim guard rect calculations) */
  contentRef: React.RefObject<HTMLElement | null>
  /** Surface ID of the parent menu (for keyboard navigation back) */
  parentSurfaceId: string
  /** Surface ID of this submenu (for keyboard navigation into) */
  childSurfaceId: string
  /** Delay before auto-opening the submenu based on input method */
  openDelay: Required<SubmenuOpenDelay>
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
