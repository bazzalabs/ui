import type { MenuDef } from '@bazza-ui/menu'
import { useInputActivation } from '@bazza-ui/menu'
import * as React from 'react'
import { useScopedTheme, ScopedThemeProvider } from '../contexts/theme-context.js'
import { PopupMenuList } from './list.js'
import { mergeProps } from '@bazza-ui/theming'
import type { ContentBindAPI } from '../types.js'

export interface PopupMenuContentProps<T = unknown> {
  /** Menu definition */
  menu: MenuDef<T>
  /** Whether the menu is open */
  open?: boolean
  /** Close callback */
  onClose?: () => void
  /** Vim bindings enabled */
  vimBindings?: boolean
  /** Text direction */
  dir?: 'ltr' | 'rtl'
  /** Content ref (for positioning) */
  contentRef?: React.RefObject<HTMLDivElement>
  /** Placeholder for input */
  placeholder?: string
}

/**
 * PopupMenuContent renders the menu content with optional input activation.
 * This component is used by both context-menu and dropdown-menu packages.
 */
export function PopupMenuContent<T = unknown>({
  menu,
  open = true,
  onClose,
  vimBindings = true,
  dir = 'ltr',
  contentRef,
  placeholder,
}: PopupMenuContentProps<T>) {
  const { slots, classNames, slotProps } = useScopedTheme()

  // Input activation hook
  const hideSearchUntilActive = menu.hideSearchUntilActive ?? false
  const { inputActive, query, setQuery, handleTypeStart } =
    useInputActivation(hideSearchUntilActive)

  // Keyboard handler to activate input on typing
  const handleListKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const activated = handleTypeStart(e)
      if (activated) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    [handleTypeStart],
  )

  // Create bind API for content
  const contentBind: ContentBindAPI = {
    getContentProps: (overrides) =>
      mergeProps(
        {
          ref: contentRef,
          role: 'menu' as const,
          tabIndex: -1,
          'data-slot': 'popup-menu-content',
          'data-popup-menu-surface': true,
          'data-root-menu': true,
          ...slotProps?.content,
          className: classNames?.content,
          onKeyDown: handleListKeyDown,
        },
        overrides,
      ) as any,
  }

  // Apply scoped theme from menu.ui
  const submenuTheme = React.useMemo(() => menu.ui as any, [menu.ui])

  return (
    <ScopedThemeProvider theme={submenuTheme}>
      {slots.Content({
        children: (
          <PopupMenuList
            menu={menu}
            query={query}
            onQueryChange={setQuery}
            placeholder={placeholder}
            showInput={inputActive}
            vimBindings={vimBindings}
            dir={dir}
            onClose={onClose}
            open={open}
          />
        ),
        bind: contentBind,
      })}
    </ScopedThemeProvider>
  )
}
