import * as React from 'react'
import { useSurface } from '../contexts/surface-context.js'

// ============================================================================
// Types
// ============================================================================

export interface ListProps extends React.ComponentPropsWithoutRef<'div'> {
  /**
   * Children to render inside the list.
   * Typically Menu.Item, Menu.Group, Menu.Separator, etc.
   */
  children?: React.ReactNode
}

// ============================================================================
// Component
// ============================================================================

/**
 * Container for menu items within a Surface.
 * Provides the scrollable area for menu content.
 *
 * This component is used to separate the menu items from other Surface content
 * like the search Input, allowing for proper scrolling behavior.
 *
 * @example
 * ```tsx
 * <Menu.Surface>
 *   <Menu.Input placeholder="Search..." />
 *   <Menu.List>
 *     <Menu.Item>Copy</Menu.Item>
 *     <Menu.Item>Paste</Menu.Item>
 *     <Menu.Group>
 *       <Menu.Label>More Actions</Menu.Label>
 *       <Menu.Item>Undo</Menu.Item>
 *       <Menu.Item>Redo</Menu.Item>
 *     </Menu.Group>
 *   </Menu.List>
 * </Menu.Surface>
 * ```
 */
export const MenuList = React.forwardRef<HTMLDivElement, ListProps>(
  function MenuList({ children, ...props }, forwardedRef) {
    const { searchState, focusActions } = useSurface()
    const listRef = React.useRef<HTMLDivElement | null>(null)

    // Register this list ref with the surface for focus management
    React.useEffect(() => {
      focusActions.registerList(listRef)
    }, [focusActions])

    // Compose refs
    const composedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
        listRef.current = node
      },
      [forwardedRef],
    )

    // In search mode, we might want to show a message when there are no results
    const hasSearchResults = searchState.searchResults.length > 0
    const showEmptyState = searchState.searchMode && !hasSearchResults

    return (
      <div
        ref={composedRef}
        role="presentation"
        tabIndex={-1}
        data-menu-list=""
        data-search-mode={searchState.searchMode || undefined}
        data-empty={showEmptyState || undefined}
        {...props}
      >
        {children}
      </div>
    )
  },
) as MenuList

MenuList.displayName = 'Menu.List'

// ============================================================================
// Namespace
// ============================================================================

export interface MenuList {
  (props: ListProps & React.RefAttributes<HTMLDivElement>): React.JSX.Element
  displayName?: string
}

export namespace MenuList {
  export type Props = ListProps
}
