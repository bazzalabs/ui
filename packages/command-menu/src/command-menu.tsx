import type * as React from 'react'
import { CommandMenuBreadcrumbs } from './components/breadcrumbs.js'
import { CommandMenuContent } from './components/content.js'
import { CommandMenuInput } from './components/input.js'
import { CommandMenuList } from './components/list.js'
import { CommandMenuRoot } from './components/root.js'
import { CommandMenuTrigger } from './components/trigger.js'
import type { CommandMenuProps } from './types.js'

export interface CommandMenuOptions<T = unknown> extends CommandMenuProps<T> {
  /** Keyboard shortcut to open the command menu */
  shortcut?: string | string[]
  /** Placeholder text for the search input */
  placeholder?: string
  /** Optional trigger button to render */
  trigger?: React.ReactNode
}

/**
 * Complete command menu component with all pieces integrated.
 * This is a convenience component that combines Root, Trigger, and Content.
 */
export function CommandMenu<T = unknown>({
  shortcut = 'cmd+k',
  placeholder = 'Type a command or search...',
  trigger,
  ...rootProps
}: CommandMenuOptions<T>) {
  return (
    <CommandMenuRoot {...rootProps}>
      <CommandMenuTrigger shortcut={shortcut}>{trigger}</CommandMenuTrigger>
      <CommandMenuContent placeholder={placeholder} />
    </CommandMenuRoot>
  )
}

// Compound component pattern exports
CommandMenu.Root = CommandMenuRoot
CommandMenu.Trigger = CommandMenuTrigger
CommandMenu.Content = CommandMenuContent
CommandMenu.Input = CommandMenuInput
CommandMenu.List = CommandMenuList
CommandMenu.Breadcrumbs = CommandMenuBreadcrumbs
