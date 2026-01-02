import * as React from 'react'
import { Popover } from '@base-ui-components/react/popover'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import { CollectionProvider } from '../contexts/collection-context.js'
import { FocusOwnerContext } from '../contexts/focus-owner-context.js'
import { MenuProvider } from '../contexts/menu-context.js'

import type { Direction, FocusOwnerContextValue } from '../types.js'

// ============================================================================
// Types
// ============================================================================

export interface RootProps {
  /** Controlled open state */
  open?: boolean
  /** Default open state for uncontrolled usage */
  defaultOpen?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Whether the menu is modal (blocks outside pointer events) */
  modal?: boolean
  /** Direction for RTL/LTR support */
  dir?: Direction
  /** Callback when an item is selected */
  onSelect?: (id: string) => void
  /**
   * Whether submenus open when hovering over their trigger.
   * When true, hovering opens the submenu and leaving closes it.
   * @default true
   */
  openSubmenusOnHover?: boolean
  /** Children */
  children: React.ReactNode
}

// ============================================================================
// Component
// ============================================================================

/**
 * Root component for the dropdown menu.
 * Wraps Base UI's Popover.Root and provides menu context.
 *
 * @example
 * ```tsx
 * <Menu.Root>
 *   <Menu.Trigger>Open Menu</Menu.Trigger>
 *   <Menu.Portal>
 *     <Menu.Positioner>
 *       <Menu.Surface>
 *         <Menu.Item>Item 1</Menu.Item>
 *         <Menu.Item>Item 2</Menu.Item>
 *       </Menu.Surface>
 *     </Menu.Positioner>
 *   </Menu.Portal>
 * </Menu.Root>
 * ```
 */
export function MenuRoot({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  modal = true,
  dir = 'ltr',
  onSelect,
  openSubmenusOnHover = true,
  children,
}: RootProps) {
  // Use Radix's controllable state hook for proper controlled/uncontrolled handling
  const [open = false, setOpen] = useControllableState({
    prop: controlledOpen,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  })

  // Focus owner state - tracks which surface currently owns DOM focus
  const [ownerId, setOwnerId] = React.useState<string | null>(null)

  const focusOwnerValue = React.useMemo<FocusOwnerContextValue>(
    () => ({ ownerId, setOwnerId }),
    [ownerId, setOwnerId],
  )

  return (
    <CollectionProvider>
      <MenuProvider
        open={open}
        onOpenChange={setOpen}
        modal={modal}
        dir={dir}
        onSelect={onSelect}
        openSubmenusOnHover={openSubmenusOnHover}
      >
        <FocusOwnerContext.Provider value={focusOwnerValue}>
          {/* Always non-modal for Base UI - we handle modal behavior via InteractionGuard */}
          <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
            {children}
          </Popover.Root>
        </FocusOwnerContext.Provider>
      </MenuProvider>
    </CollectionProvider>
  )
}

MenuRoot.displayName = 'Menu.Root'

// ============================================================================
// Namespace
// ============================================================================

export namespace MenuRoot {
  export type Props = RootProps
}
