'use client'

import { Popover, type PopoverBackdropProps } from '@base-ui/react/popover'
import * as React from 'react'
import { useFocusOwner } from '../contexts/focus-owner-context.js'
import { useOpenChain } from '../contexts/open-chain-context.js'
import { useMaybeSubmenuContext } from '../contexts/submenu-context.js'

export interface DropdownMenuBackdropProps extends PopoverBackdropProps {
  /**
   * Controls when the backdrop becomes visible for submenus.
   * - `"focus"`: Show when the submenu becomes the focus owner (prevents flicker on hover).
   *   If a deeper submenu is open, the backdrop remains visible.
   * - `"open"`: Show as soon as the submenu opens, regardless of focus.
   *
   * @default "focus" for submenus, "open" for root menu
   */
  showOn?: 'focus' | 'open'
}

/**
 * An overlay displayed beneath the dropdown menu popup.
 *
 * For submenus with `showOn="focus"` (default), the backdrop visibility follows these rules:
 * - If this submenu is at the end of the open chain (deepest), it must be
 *   the focus owner to show the backdrop (prevents flicker on hover)
 * - If this submenu is in the chain but not at the end (has a deeper submenu open),
 *   the backdrop remains visible
 *
 * With `showOn="open"`, the backdrop shows as soon as the submenu opens.
 *
 * Renders a `<div>` element with `pointer-events: none`.
 */
export const DropdownMenuBackdrop = React.forwardRef<
  HTMLDivElement,
  DropdownMenuBackdropProps
>(function DropdownMenuBackdrop(props, forwardedRef) {
  const { showOn: showOnProp, ...rest } = props

  const submenuContext = useMaybeSubmenuContext()
  const openChainStore = useOpenChain()
  const focusOwnerStore = useFocusOwner()

  const isSubmenu = submenuContext !== null
  const surfaceId = submenuContext?.childSurfaceId ?? ''

  // Default: "focus" for submenus, "open" for root
  const showOn = showOnProp ?? (isSubmenu ? 'focus' : 'open')

  // Check if this surface is in the open chain
  const isInOpenChain = openChainStore.useState('isOpen', surfaceId)

  // Check if this surface is the last (deepest) in the chain
  const isLastInChain = openChainStore.useState('isLast', surfaceId)

  // Check if this surface is the focus owner
  const isFocusOwner = focusOwnerStore.useState('isOwner', surfaceId)

  // Determine visibility
  let shouldShow = true
  if (isSubmenu) {
    if (showOn === 'open') {
      // Show as soon as submenu is open
      shouldShow = isInOpenChain
    } else {
      // showOn === 'focus'
      if (isLastInChain) {
        // Deepest submenu: only show if we're the focus owner
        shouldShow = isFocusOwner
      } else {
        // Not the deepest: show if we're in the chain (a deeper submenu is open)
        shouldShow = isInOpenChain
      }
    }
  }

  if (!shouldShow) {
    return null
  }

  // Merge pointer-events: none into style to prevent backdrop from
  // intercepting pointer events meant for the menu
  const style: React.CSSProperties = {
    pointerEvents: 'none',
    ...rest.style,
  }

  return <Popover.Backdrop ref={forwardedRef} {...rest} style={style} />
})

export namespace DropdownMenuBackdrop {
  export type Props = DropdownMenuBackdropProps
  export type State = Popover.Backdrop.State
}
