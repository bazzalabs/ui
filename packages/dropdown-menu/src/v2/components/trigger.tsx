import * as React from 'react'
import { Popover } from '@base-ui-components/react/popover'
import { useMenu } from '../contexts/menu-context.js'
import { InteractionGuard } from './interaction-guard.js'

// ============================================================================
// Types
// ============================================================================

export interface TriggerProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof Popover.Trigger>,
    'render'
  > {
  /** Custom render function for composition */
  render?: React.ComponentPropsWithoutRef<typeof Popover.Trigger>['render']
}

// ============================================================================
// Component
// ============================================================================

/**
 * Button that opens the dropdown menu.
 * Wraps Base UI's Popover.Trigger with menu-specific attributes.
 *
 * @example
 * ```tsx
 * <Menu.Trigger className="btn">
 *   Open Menu
 * </Menu.Trigger>
 * ```
 */
export const MenuTrigger = React.forwardRef<HTMLButtonElement, TriggerProps>(
  function Trigger({ children, ...props }, forwardedRef) {
    const { triggerRef, menuId, scopeId } = useMenu()

    // Compose refs
    const composedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        // Update forwarded ref
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
        // Update internal trigger ref
        triggerRef.current = node
      },
      [forwardedRef, triggerRef],
    )

    return (
      <InteractionGuard.Branch asChild scopeId={scopeId}>
        <Popover.Trigger
          ref={composedRef}
          aria-haspopup="menu"
          aria-controls={menuId}
          {...props}
        >
          {children}
        </Popover.Trigger>
      </InteractionGuard.Branch>
    )
  },
) as MenuTrigger

MenuTrigger.displayName = 'Menu.Trigger'

// ============================================================================
// Namespace
// ============================================================================

export interface MenuTrigger {
  (
    props: TriggerProps & React.RefAttributes<HTMLButtonElement>,
  ): React.JSX.Element
  displayName?: string
}

export namespace MenuTrigger {
  export type Props = TriggerProps
}
