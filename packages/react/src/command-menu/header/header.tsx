'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'

export interface CommandMenuHeaderState extends Record<string, unknown> {}
export interface CommandMenuHeaderProps
  extends ComponentProps<'div', CommandMenuHeaderState> {}

/**
 * Display-only contextual header for a command menu.
 * Non-interactive; interactive headers arrive with the separate focus-zones work.
 */
export const CommandMenuHeader = React.forwardRef<
  HTMLDivElement,
  CommandMenuHeader.Props
>(function CommandMenuHeader(props, forwardedRef) {
  const { render, className, style, children, ...rest } = props

  const state: CommandMenuHeaderState = React.useMemo(() => ({}), [])

  return useRender({
    render,
    ref: forwardedRef,
    state,
    props: {
      ...rest,
      'data-command-menu-header': '',
      className,
      style,
      children,
    },
    defaultTagName: 'div',
  })
})

export namespace CommandMenuHeader {
  export interface Props extends CommandMenuHeaderProps {}
  export type State = CommandMenuHeaderState
}
