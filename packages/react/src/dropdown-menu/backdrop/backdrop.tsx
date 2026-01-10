'use client'

import { Popover, type PopoverBackdropProps } from '@base-ui/react/popover'
import * as React from 'react'
import { useFocusOwner } from '../contexts/focus-owner-context.js'
import { useOpenChain } from '../contexts/open-chain-context.js'
import { useMaybeSubmenuContext } from '../contexts/submenu-context.js'

export interface DropdownMenuBackdropProps extends PopoverBackdropProps {}

/**
 * An overlay displayed beneath the dropdown menu popup.
 *
 * For submenus, the backdrop visibility follows these rules:
 * - If this submenu is at the end of the open chain (deepest), it must be
 *   the focus owner to show the backdrop (prevents flicker on hover)
 * - If this submenu is in the chain but not at the end (has a deeper submenu open),
 *   the backdrop remains visible
 *
 * Renders a `<div>` element with `pointer-events: none`.
 */
export const DropdownMenuBackdrop = React.forwardRef<
  HTMLDivElement,
  DropdownMenuBackdropProps
>(function DropdownMenuBackdrop(props, forwardedRef) {
  const { ...rest } = props

  const submenuContext = useMaybeSubmenuContext()
  const openChainStore = useOpenChain()
  const focusOwnerStore = useFocusOwner()

  const isSubmenu = submenuContext !== null
  const surfaceId = submenuContext?.childSurfaceId ?? ''

  // Check if this surface is in the open chain
  const isInOpenChain = openChainStore.useState('isOpen', surfaceId)

  // Check if this surface is the last (deepest) in the chain
  const isLastInChain = openChainStore.useState('isLast', surfaceId)

  // Check if this surface is the focus owner
  const isFocusOwner = focusOwnerStore.useState('isOwner', surfaceId)

  // Determine visibility for submenus
  let shouldShow = true
  if (isSubmenu) {
    if (isLastInChain) {
      // Deepest submenu: only show if we're the focus owner
      shouldShow = isFocusOwner
    } else {
      // Not the deepest: show if we're in the chain (a deeper submenu is open)
      shouldShow = isInOpenChain
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
