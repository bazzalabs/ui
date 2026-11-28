'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useMergedRefs } from '@base-ui/utils/useMergedRefs'
import * as React from 'react'
import {
  useMaybeMenuSurfaceSettings,
  useMenuElement,
} from '../../internal/popup-menu/members.js'

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
  // The root level's `disabled`, rendered with the root.
  const menuDisabled = useMaybeMenuSurfaceSettings()?.disabled
  const isDisabled = disabled || menuDisabled || false
  const triggerRef = useMergedRefs(forwardedRef, useMenuElement('trigger'))

  return (
    <Dialog.Trigger
      ref={triggerRef}
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
