'use client'

import { Dialog } from '@base-ui/react/dialog'
import * as React from 'react'
import { useMaybePopupMenuContext } from '../../internal/popup-menu/contexts/popup-menu-context.js'

export interface CommandMenuTriggerProps extends Dialog.Trigger.Props {}
export type CommandMenuTriggerState = Dialog.Trigger.State

/**
 * A button that opens the command menu.
 */
export const CommandMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  CommandMenuTrigger.Props
>(function CommandMenuTrigger(props, forwardedRef) {
  const { disabled, ...rest } = props
  const popupMenuContext = useMaybePopupMenuContext()
  const isDisabled = disabled || popupMenuContext?.disabled || false

  return (
    <Dialog.Trigger
      ref={forwardedRef}
      {...rest}
      disabled={isDisabled}
      data-command-menu-trigger=""
    />
  )
})

export namespace CommandMenuTrigger {
  export interface Props extends CommandMenuTriggerProps {}
  export type State = CommandMenuTriggerState
}
