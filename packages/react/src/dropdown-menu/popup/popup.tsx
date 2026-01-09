'use client'

import { Popover, type PopoverPopupProps } from '@base-ui/react/popover'
import * as React from 'react'
import { useAimGuard } from '../contexts/aim-guard-context.js'
import { useMaybeSubmenuContext } from '../contexts/submenu-context.js'

export interface DropdownMenuPopupProps extends PopoverPopupProps {}

/**
 * A container for the dropdown menu contents.
 * Renders a `<div>` element.
 */
export const DropdownMenuPopup = React.forwardRef<
  HTMLDivElement,
  DropdownMenuPopupProps
>(function DropdownMenuPopup(props, forwardedRef) {
  const { children, ...rest } = props

  // Get submenu context to set contentRef for aim guard
  const submenuContext = useMaybeSubmenuContext()

  // Get aim guard to clear it when pointer enters submenu
  const { clearAimGuard } = useAimGuard()

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
  // Using onPointerMove instead of onPointerEnter for reliability with fast mouse movements
  const handlePointerMove = React.useCallback(() => {
    // Only clear if this is a submenu popup (not the root popup)
    if (submenuContext) {
      clearAimGuard()
    }
  }, [submenuContext, clearAimGuard])

  return (
    <Popover.Popup
      ref={combinedRef}
      onPointerMove={(event) => {
        handlePointerMove()
        rest.onPointerMove?.(event)
      }}
      {...rest}
    >
      {children}
    </Popover.Popup>
  )
})

export namespace DropdownMenuPopup {
  export type Props = DropdownMenuPopupProps
  export type State = Popover.Popup.State
}
