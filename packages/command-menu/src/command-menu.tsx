import * as React from 'react'
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
 * This is a convenience component that combines Root, Trigger, Content, Input, List, and Breadcrumbs.
 */
export function CommandMenu<T = unknown>({
  shortcut = 'cmd+k',
  placeholder = 'Type a command or search...',
  trigger,
  ...rootProps
}: CommandMenuOptions<T>) {
  const [query, setQuery] = React.useState('')

  // Clear query when menu closes
  React.useEffect(() => {
    if (!rootProps.open && rootProps.onOpenChange) {
      setQuery('')
    }
  }, [rootProps.open, rootProps.onOpenChange])

  return (
    <CommandMenuRoot {...rootProps}>
      <CommandMenuTrigger shortcut={shortcut}>{trigger}</CommandMenuTrigger>
      <CommandMenuContent>
        <CommandMenuBreadcrumbs />
        <CommandMenuInput
          value={query}
          onValueChange={setQuery}
          placeholder={placeholder}
        />
        <CommandMenuList query={query} onQueryChange={setQuery} />
      </CommandMenuContent>
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
