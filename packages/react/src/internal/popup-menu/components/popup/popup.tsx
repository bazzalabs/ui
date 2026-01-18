'use client'

import { Popover, type PopoverPopupProps } from '@base-ui/react/popover'
import * as React from 'react'
import { useMaybeComboboxContext } from '../../../../combobox/contexts/combobox-context.js'
import { POINTER_EVENT_DEBOUNCE_MS } from '../../constants.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useOpenChain } from '../../contexts/open-chain-context.js'
import { useMaybePopupMenuContext } from '../../contexts/popup-menu-context.js'
import { PopupSurfaceIdContext } from '../../contexts/popup-surface-id-context.js'
import { useMaybeSubmenuContext } from '../../contexts/submenu-context.js'
import { useAimGuard } from '../../hooks/use-aim-guard.js'
import { PopupMenuPopupDataAttributes } from './popup.data-attrs.js'

// ============================================================================
// Types
// ============================================================================

export interface PopupMenuPopupState extends Popover.Popup.State {
  /**
   * Whether this popup is a submenu (not the root menu).
   */
  isSubmenu: boolean
}

export interface PopupMenuPopupProps
  extends Omit<PopoverPopupProps, 'className'> {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component's state.
   */
  className?: string | ((state: PopupMenuPopupState) => string)
}

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
  const { children, className: classNameProp, ...rest } = props

  // Get submenu context to set contentRef for aim guard and get childSurfaceId for focus transfer
  const submenuContext = useMaybeSubmenuContext()

  // Get aim guard to clear it when pointer enters submenu
  const { clearAimGuard, aimGuardActiveRef } = useAimGuard()

  // Get focus owner store for transferring ownership
  const focusOwnerStore = useFocusOwner()

  // Get open chain store for tracking submenu chain
  const openChainStore = useOpenChain()

  // Get popup menu context for depth
  const popupMenuContext = useMaybePopupMenuContext()
  const depth = popupMenuContext?.depth ?? 0

  // Get combobox context to detect if we're inside a combobox and for layout
  const comboboxContext = useMaybeComboboxContext()

  // Generate surfaceId for root menus, use submenu context for submenus
  const generatedSurfaceId = React.useId()
  const surfaceId = submenuContext?.childSurfaceId ?? generatedSurfaceId

  // Track when popup opened to ignore initial pointer events
  // This prevents focus transfer when the popup appears under a stationary cursor
  const openTimeRef = React.useRef<number>(0)

  // Record open time when popup opens
  React.useEffect(() => {
    if (submenuContext?.open) {
      openTimeRef.current = Date.now()
    }
  }, [submenuContext?.open])

  // Subscribe to focus ownership for data-focused attribute
  const isFocused = focusOwnerStore.useState('isOwner', surfaceId)

  // Subscribe to open chain for data-has-open-submenu attribute
  const hasOpenSubmenu = openChainStore.useState('hasOpenSubmenu', depth)

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

  // Transfer focus ownership when pointer moves inside this submenu popup
  // We ignore events shortly after open to prevent focus transfer when
  // the popup appears under a stationary cursor
  const handleFocusTransferOnMove = React.useCallback(
    (event: React.PointerEvent) => {
      // Ignore pointer events briefly after popup opens
      // This prevents focus transfer when popup appears under stationary cursor
      const timeSinceOpen = Date.now() - openTimeRef.current
      if (timeSinceOpen < POINTER_EVENT_DEBOUNCE_MS) {
        return
      }

      // Only transfer focus if this is a submenu popup (not the root popup)
      // Use childSurfaceId from SubmenuContext since Popup is outside Surface in the component tree
      if (submenuContext) {
        focusOwnerStore.setOwnerId(submenuContext.childSurfaceId)
      }
    },
    [submenuContext, focusOwnerStore],
  )

  // Disable Base UI's auto-focus behavior for:
  // - Submenus: Focus is managed by our FocusOwner system
  // - Combobox: Focus should stay on the input element (which is outside the popup)
  const initialFocus = submenuContext || comboboxContext ? false : undefined

  // Disable returning focus to trigger when popup closes for:
  // - Submenus: Focus is managed by our FocusOwner system (we transfer to parent surface's input/list)
  // - Combobox: When clicking outside, we want focus to go to whatever was clicked, not back to input
  const finalFocus = submenuContext || comboboxContext ? false : undefined

  // Add data-input-embedded attribute when layout is input-embedded
  const isInputEmbedded = comboboxContext?.layout === 'input-embedded'

  // Determine if this popup is a submenu (not the root menu)
  const isSubmenu = !!submenuContext

  // Wrap className to include isSubmenu in the state
  const className = React.useMemo(() => {
    if (typeof classNameProp === 'function') {
      return (baseState: Popover.Popup.State) => {
        const extendedState: PopupMenuPopupState = { ...baseState, isSubmenu }
        return classNameProp(extendedState)
      }
    }
    return classNameProp
  }, [classNameProp, isSubmenu])

  return (
    <PopupSurfaceIdContext.Provider value={surfaceId}>
      <Popover.Popup
        ref={combinedRef}
        initialFocus={initialFocus}
        finalFocus={finalFocus}
        className={className}
        data-input-embedded={isInputEmbedded ? '' : undefined}
        {...{
          [PopupMenuPopupDataAttributes.focused]: isFocused ? '' : undefined,
          [PopupMenuPopupDataAttributes.hasOpenSubmenu]: hasOpenSubmenu
            ? ''
            : undefined,
          [PopupMenuPopupDataAttributes.submenu]: isSubmenu ? '' : undefined,
        }}
        onPointerMove={(event) => {
          handlePointerMove()
          handleFocusTransferOnMove(event)
          rest.onPointerMove?.(event)
        }}
        {...rest}
      >
        {children}
      </Popover.Popup>
    </PopupSurfaceIdContext.Provider>
  )
})

export namespace PopupMenuPopup {
  export type Props = PopupMenuPopupProps
  export type State = PopupMenuPopupState
}
