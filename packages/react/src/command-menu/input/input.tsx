'use client'

import * as React from 'react'
import {
  PopupMenuInput,
  type PopupMenuInputProps,
  type PopupMenuInputState,
} from '../../internal/popup-menu/index.js'

export interface CommandMenuInputProps extends PopupMenuInputProps {}
export type CommandMenuInputState = PopupMenuInputState

/**
 * Search input for filtering command menu items.
 */
export const CommandMenuInput = React.forwardRef<
  HTMLInputElement,
  CommandMenuInput.Props
>(function CommandMenuInput(props, forwardedRef) {
  const { backspaceGoesBack = true, ...rest } = props

  return (
    <PopupMenuInput
      ref={forwardedRef}
      backspaceGoesBack={backspaceGoesBack}
      {...rest}
    />
  )
})

export namespace CommandMenuInput {
  export interface Props extends CommandMenuInputProps {}
  export type State = CommandMenuInputState
}
