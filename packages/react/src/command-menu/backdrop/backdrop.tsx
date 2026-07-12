'use client'

import { Dialog } from '@base-ui/react/dialog'
import * as React from 'react'
import { useMaybePopupMenuContext } from '../../internal/popup-menu/contexts/popup-menu-context.js'
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
      ref={forwardedRef}
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
