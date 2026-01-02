import * as React from 'react'

// ============================================================================
// Types
// ============================================================================

export interface SeparatorProps extends React.ComponentPropsWithoutRef<'div'> {}

// ============================================================================
// Component
// ============================================================================

/**
 * A visual separator between menu items.
 * Not focusable or selectable.
 *
 * @example
 * ```tsx
 * <Menu.Item>Copy</Menu.Item>
 * <Menu.Separator />
 * <Menu.Item>Delete</Menu.Item>
 * ```
 */
export const MenuSeparator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  function MenuSeparator(props, forwardedRef) {
    return (
      <div
        ref={forwardedRef}
        role="separator"
        aria-orientation="horizontal"
        {...props}
      />
    )
  },
) as MenuSeparator

MenuSeparator.displayName = 'Menu.Separator'

// ============================================================================
// Namespace
// ============================================================================

export interface MenuSeparator {
  (
    props: SeparatorProps & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element
  displayName?: string
}

export namespace MenuSeparator {
  export type Props = SeparatorProps
}
