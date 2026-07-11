'use client'

import { Dialog } from '@base-ui/react/dialog'

export interface CommandMenuPortalProps extends Dialog.Portal.Props {}
export type CommandMenuPortalState = Dialog.Portal.State

/**
 * A portal element that moves the command menu popup to a different part of the DOM.
 */
export const CommandMenuPortal = Dialog.Portal

export namespace CommandMenuPortal {
  export type Props = CommandMenuPortalProps
  export type State = CommandMenuPortalState
}
