'use client'

import { Popover, type PopoverPopupProps } from '@base-ui/react/popover'
import * as React from 'react'
import { useMaybeComboboxContext } from '../../../../combobox/contexts/combobox-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useMaybeSubmenuContext } from '../../contexts/submenu-context.js'
import { useAimGuard } from '../../hooks/use-aim-guard.js'

// ============================================================================
// Types
// ============================================================================

export interface PopupMenuPopupProps extends PopoverPopupProps {}

// ============================================================================
// Component
// ============================================================================

/**
 * A container for the popup menu contents.
 * Wraps Popover.Popup with:
 * - Aim guard clearing when pointer enters submenu
 * - Focus ownership transfer when pointer enters submenu
 * - Auto-focus disabled for submenus (focus managed by FocusOwner system)
 *
 * Renders a `<div>` element.
 */
export const PopupMenuPopup = React.forwardRef<
  HTMLDivElement,
  PopupMenuPopupProps
>(function PopupMenuPopup(props, forwardedRef) {
  const { children, ...rest } = props

  // Get submenu context to set contentRef for aim guard and get childSurfaceId for focus transfer
  const submenuContext = useMaybeSubmenuContext()

  // Get aim guard to clear it when pointer enters submenu
  const { clearAimGuard, aimGuardActiveRef } = useAimGuard()

  // Get focus owner store for transferring ownership
  const focusOwnerStore = useFocusOwner()

  // Get combobox context to detect if we're inside a combobox
  const comboboxContext = useMaybeComboboxContext()

  // Local ref for the popup element
  const popupRef = React.useRef<HTMLDivElement>(null)

  // Combine refs
  const combinedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      // Update local ref
      popupRef.current = node

      // Update forwarded ref
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }

      // Update submenu context contentRef for aim guard
      if (submenuContext?.contentRef) {
        ;(
          submenuContext.contentRef as React.MutableRefObject<HTMLElement | null>
        ).current = node
      }
    },
    [forwardedRef, submenuContext],
  )

  // Clear aim guard when pointer moves inside this submenu popup
  // Only clear if aim guard is actually active to avoid spam
  const handlePointerMove = React.useCallback(() => {
    // Only handle if this is a submenu popup (not the root popup) and aim guard is active
    if (submenuContext && aimGuardActiveRef.current) {
      clearAimGuard()
    }
  }, [submenuContext, aimGuardActiveRef, clearAimGuard])

  // Transfer focus ownership when pointer explicitly enters this submenu popup
  // Using onPointerEnter (not onPointerMove) to avoid transferring focus
  // when the popup appears near the cursor during open animation
  const handlePointerEnter = React.useCallback(() => {
    // Only transfer focus if this is a submenu popup (not the root popup)
    // Use childSurfaceId from SubmenuContext since Popup is outside Surface in the component tree
    if (submenuContext) {
      focusOwnerStore.setOwnerId(submenuContext.childSurfaceId)
    }
  }, [submenuContext, focusOwnerStore])

  // Disable Base UI's auto-focus behavior for:
  // - Submenus: Focus is managed by our FocusOwner system
  // - Combobox: Focus should stay on the input element (which is outside the popup)
  const initialFocus = submenuContext || comboboxContext ? false : undefined

  // Disable returning focus to trigger when popup closes for Combobox
  // When clicking outside, we want focus to go to whatever was clicked, not back to input
  const finalFocus = comboboxContext ? false : undefined

  return (
    <Popover.Popup
      ref={combinedRef}
      initialFocus={initialFocus}
      finalFocus={finalFocus}
      onPointerMove={(event) => {
        handlePointerMove()
        rest.onPointerMove?.(event)
      }}
      onPointerEnter={(event) => {
        handlePointerEnter()
        rest.onPointerEnter?.(event)
      }}
      {...rest}
    >
      {children}
    </Popover.Popup>
  )
})

export namespace PopupMenuPopup {
  export type Props = PopupMenuPopupProps
  export type State = Popover.Popup.State
}
