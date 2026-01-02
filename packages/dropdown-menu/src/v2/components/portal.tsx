import * as React from 'react'
import { Popover } from '@base-ui-components/react/popover'

// ============================================================================
// Types
// ============================================================================

export interface PortalProps
  extends React.ComponentPropsWithoutRef<typeof Popover.Portal> {}

// ============================================================================
// Component
// ============================================================================

/**
 * Portal for rendering the menu content outside the DOM hierarchy.
 * Re-exports Base UI's Popover.Portal.
 *
 * @example
 * ```tsx
 * <Menu.Portal>
 *   <Menu.Positioner>
 *     <Menu.Surface>...</Menu.Surface>
 *   </Menu.Positioner>
 * </Menu.Portal>
 * ```
 */
export const MenuPortal = Popover.Portal as MenuPortal

// ============================================================================
// Namespace
// ============================================================================

export interface MenuPortal {
  (props: PortalProps): React.JSX.Element
}

export namespace MenuPortal {
  export type Props = PortalProps
}
