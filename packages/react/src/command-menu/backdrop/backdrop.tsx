'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useMergedRefs } from '@base-ui/utils/useMergedRefs'
import * as React from 'react'
import {
  isLevelDisabled,
  useMaybeMenuSurfaceSettings,
  useMaybeMenuSurfaceTier,
  useMenuElement,
} from '../../internal/popup-menu/members.js'
import { REASONS } from '../../utils/events/index.js'
import { useComposedHandler } from '../../utils/use-part.js'

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
  const tier = useMaybeMenuSurfaceTier()
  const closeAll = useMaybeMenuSurfaceSettings()?.closeAll
  // A press here is the backdrop's to handle (it closes on pointerdown unless
  // the consumer prevents it), not an outside press.
  const backdropRef = useMergedRefs(forwardedRef, useMenuElement('backdrop'))

  // After the consumer's handler (`useComposedHandler`): its
  // `preventDefault()` or `preventBaseUIHandler()` keeps the menu open.
  const handleOwnPointerDown = React.useCallback<
    NonNullable<Dialog.Backdrop.Props['onPointerDown']>
  >(
    (event) => {
      if (event.defaultPrevented) {
        return
      }

      // Whether the menu is disabled as last committed (`isLevelDisabled`);
      // `closeAll` is the committed render's, as the handler is.
      if (tier && closeAll && !isLevelDisabled(tier)) {
        closeAll(REASONS.outsidePress, event.nativeEvent)
      }
    },
    [tier, closeAll],
  )
  const handlePointerDown = useComposedHandler(
    onPointerDown,
    handleOwnPointerDown,
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
