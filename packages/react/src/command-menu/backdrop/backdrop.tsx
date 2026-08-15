'use client'

import { Dialog } from '@base-ui/react/dialog'
import * as React from 'react'

export interface CommandMenuBackdropProps extends Dialog.Backdrop.Props {}
export type CommandMenuBackdropState = Dialog.Backdrop.State

/**
 * An overlay displayed beneath the command menu popup.
 */
export const CommandMenuBackdrop = React.forwardRef<
  HTMLDivElement,
  CommandMenuBackdrop.Props
>(function CommandMenuBackdrop(props, forwardedRef) {
  return (
    <Dialog.Backdrop
      ref={forwardedRef}
      {...props}
      data-command-menu-backdrop=""
    />
  )
})

export namespace CommandMenuBackdrop {
  export interface Props extends CommandMenuBackdropProps {}
  export type State = CommandMenuBackdropState
}
