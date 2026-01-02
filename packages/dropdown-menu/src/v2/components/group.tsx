import * as React from 'react'
import { GroupProvider } from '../contexts/collection-context.js'

// ============================================================================
// Types
// ============================================================================

export interface GroupProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Unique identifier for this group */
  id?: string
}

// ============================================================================
// Component
// ============================================================================

/**
 * Groups related menu items together.
 * Provides semantic grouping for accessibility.
 *
 * @example
 * ```tsx
 * <Menu.Group>
 *   <Menu.Label>Actions</Menu.Label>
 *   <Menu.Item>Copy</Menu.Item>
 *   <Menu.Item>Paste</Menu.Item>
 * </Menu.Group>
 * ```
 */
export const MenuGroup = React.forwardRef<HTMLDivElement, GroupProps>(
  function MenuGroup({ id: providedId, children, ...props }, forwardedRef) {
    // Generate ID if not provided
    const generatedId = React.useId()
    const id = providedId ?? `group-${generatedId}`

    return (
      <GroupProvider groupId={id}>
        <div
          ref={forwardedRef}
          role="group"
          aria-labelledby={`${id}-label`}
          {...props}
        >
          {children}
        </div>
      </GroupProvider>
    )
  },
) as MenuGroup

MenuGroup.displayName = 'Menu.Group'

// ============================================================================
// Namespace
// ============================================================================

export interface MenuGroup {
  (props: GroupProps & React.RefAttributes<HTMLDivElement>): React.JSX.Element
  displayName?: string
}

export namespace MenuGroup {
  export type Props = GroupProps
}
