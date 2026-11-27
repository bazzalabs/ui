'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useMergedRefs } from '@base-ui/utils/useMergedRefs'
import * as React from 'react'
import { useMaybePopupMenuContext } from '../../internal/popup-menu/index.js'
import { useMenuElement } from '../../internal/popup-menu/members.js'
import { REASONS } from '../../utils/events/index.js'

export interface CommandMenuBackdropProps extends Dialog.Backdrop.Props {}
export type CommandMenuBackdropState = Dialog.Backdrop.State

/**
 * An overlay displayed beneath the command menu popup.
 *
 * Pressing down on the backdrop closes the menu immediately (pointerdown),
 * matching the outside-press behavior of the other menus, instead of waiting
 * for the Dialog's click-time dismissal. Consumers can opt out by calling
 * `event.preventDefault()` in their own `onPointerDown`.
 */
export const CommandMenuBackdrop = React.forwardRef<
  HTMLDivElement,
  CommandMenuBackdrop.Props
>(function CommandMenuBackdrop(props, forwardedRef) {
  const { onPointerDown, ...rest } = props
  const popupMenuContext = useMaybePopupMenuContext()
  // A press here is the backdrop's to handle (it closes on pointerdown unless
  // the consumer prevents it), not an outside press.
  const backdropRef = useMergedRefs(forwardedRef, useMenuElement('backdrop'))

  const handlePointerDown = React.useCallback<
    NonNullable<Dialog.Backdrop.Props['onPointerDown']>
  >(
    (event) => {
      onPointerDown?.(event)

      if (event.defaultPrevented) {
        return
      }

      if (popupMenuContext && !popupMenuContext.disabled) {
        popupMenuContext.closeAll(REASONS.outsidePress, event.nativeEvent)
      }
    },
    [onPointerDown, popupMenuContext],
  )

  return (
    <Dialog.Backdrop
      ref={backdropRef}
      {...rest}
      onPointerDown={handlePointerDown}
      data-command-menu-backdrop=""
    />
  )
})

export namespace CommandMenuBackdrop {
  export interface Props extends CommandMenuBackdropProps {}
  export type State = CommandMenuBackdropState
}
