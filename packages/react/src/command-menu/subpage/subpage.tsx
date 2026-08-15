'use client'

import {
  PopupMenuSubpage,
  type PopupMenuSubpageProps,
} from '../../internal/popup-menu/index.js'

export interface CommandMenuSubpageProps extends PopupMenuSubpageProps {}

/**
 * Groups all parts of a command menu subpage.
 */
export function CommandMenuSubpage(props: CommandMenuSubpage.Props) {
  const { closeRootOnEsc = true, children, ...rest } = props

  return (
    <PopupMenuSubpage closeRootOnEsc={closeRootOnEsc} {...rest}>
      {children}
    </PopupMenuSubpage>
  )
}

export namespace CommandMenuSubpage {
  export interface Props extends CommandMenuSubpageProps {}
}
