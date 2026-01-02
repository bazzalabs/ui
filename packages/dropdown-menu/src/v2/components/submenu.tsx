import * as React from 'react'
import { Popover } from '@base-ui-components/react/popover'
import { SubmenuProvider, useSubmenu } from '../contexts/submenu-context.js'
import { useSurfaceOptional } from '../contexts/surface-context.js'
import {
  useRegisterNode,
  useRegisterSubmenuLabel,
} from '../contexts/collection-context.js'
import { useMenu } from '../contexts/menu-context.js'
import { useFocusOwner } from '../contexts/focus-owner-context.js'
import { extractTextContent, textToId } from '../utils/extract-text.js'
import type { Side, Align } from '../types.js'

// ============================================================================
// Submenu Root
// ============================================================================

export interface SubmenuProps {
  /** Unique identifier for this submenu */
  id?: string
  /** Controlled open state */
  open?: boolean
  /** Default open state */
  defaultOpen?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Preferred side for positioning */
  side?: Side
  /** Alignment for positioning */
  align?: Align
  /** Children */
  children: React.ReactNode
}

/**
 * A submenu that can be opened from a parent menu.
 * Wraps Base UI's Popover.Root with submenu-specific context.
 *
 * @example
 * ```tsx
 * <Menu.Submenu>
 *   <Menu.Submenu.Trigger>Share</Menu.Submenu.Trigger>
 *   <Menu.Portal>
 *     <Menu.Positioner>
 *       <Menu.Surface>
 *         <Menu.Item>Twitter</Menu.Item>
 *         <Menu.Item>Facebook</Menu.Item>
 *       </Menu.Surface>
 *     </Menu.Positioner>
 *   </Menu.Portal>
 * </Menu.Submenu>
 * ```
 */
/**
 * Inner component that uses submenu context for Popover.Root
 */
function SubmenuPopover({ children }: { children: React.ReactNode }) {
  const submenu = useSubmenu()
  if (!submenu) {
    throw new Error('SubmenuPopover must be used within SubmenuProvider')
  }

  return (
    <Popover.Root
      open={submenu.state.open}
      onOpenChange={(open) => submenu.actions.setOpen(open)}
    >
      {children}
    </Popover.Root>
  )
}

export function MenuSubmenuRoot({
  id: providedId,
  open,
  defaultOpen = false,
  onOpenChange,
  side = 'right',
  align = 'start',
  children,
}: SubmenuProps) {
  const generatedId = React.useId()
  const submenuId = providedId ?? `submenu-${generatedId}`

  return (
    <SubmenuProvider
      submenuId={submenuId}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      side={side}
      align={align}
    >
      <SubmenuPopover>{children}</SubmenuPopover>
    </SubmenuProvider>
  )
}

MenuSubmenuRoot.displayName = 'Menu.Submenu'

// ============================================================================
// Submenu Trigger
// ============================================================================

export interface SubmenuTriggerProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Unique identifier for this trigger */
  id?: string
  /** Text value for search (auto-derived from children if not provided) */
  textValue?: string
  /** Additional keywords for search */
  keywords?: string[]
  /** Whether the trigger is disabled */
  disabled?: boolean
  /** Children */
  children?: React.ReactNode
}

/**
 * A menu item that opens a submenu when hovered or activated.
 * Registers as a submenu-trigger node in the collection.
 *
 * @example
 * ```tsx
 * <Menu.Submenu.Trigger>
 *   Share
 *   <ChevronRightIcon />
 * </Menu.Submenu.Trigger>
 * ```
 */
export const MenuSubmenuTrigger = React.forwardRef<
  HTMLDivElement,
  SubmenuTriggerProps
>(function MenuSubmenuTrigger(
  {
    id: providedId,
    textValue: providedTextValue,
    keywords,
    disabled = false,
    children,
    onPointerDown,
    onPointerEnter,
    onPointerLeave,
    onPointerMove,
    onKeyDown,
    onClick,
    ...props
  },
  forwardedRef,
) {
  const submenu = useSubmenu()
  const surface = useSurfaceOptional()
  const { openSubmenusOnHover } = useMenu()
  const elementRef = React.useRef<HTMLDivElement | null>(null)

  if (!submenu) {
    throw new Error('Menu.Submenu.Trigger must be used within Menu.Submenu')
  }

  // Derive text value from children if not provided
  const textValue = providedTextValue ?? extractTextContent(children)

  // Generate ID from text value if not provided
  const id = providedId ?? textToId(textValue) ?? React.useId()

  // Whether this item is highlighted (surface-local)
  const highlightState = surface?.highlightState
  const highlightActions = surface?.highlightActions
  const isHighlighted = highlightState?.highlightedId === id
  const isOpen = submenu.state.open

  // Whether this item should be visible (based on search in the containing surface)
  const searchState = surface?.searchState
  const isInSearchResults =
    !searchState?.searchMode ||
    searchState.searchResults.some((result) => result.node.id === id)

  // Compose refs
  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
      elementRef.current = node
      submenu.triggerRef.current = node
    },
    [forwardedRef, submenu.triggerRef],
  )

  // Register as submenu-trigger node
  useRegisterNode({
    id,
    kind: 'submenu-trigger',
    textValue,
    keywords,
    disabled,
    render: () => children,
    ref: elementRef,
  })

  // Register submenu label for breadcrumbs
  useRegisterSubmenuLabel(submenu.state.submenuId, textValue)

  // Scroll into view when highlighted via keyboard
  React.useEffect(() => {
    if (isHighlighted && highlightState?.activationCause === 'keyboard') {
      elementRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [isHighlighted, highlightState?.activationCause])

  // Prevent focus from being stolen from the input when clicking a submenu trigger
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(event)
      if (event.defaultPrevented) return
      event.preventDefault()
    },
    [onPointerDown],
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)
      if (event.defaultPrevented || disabled) return
      if (highlightState?.highlightedId === id) return

      // Highlight this item (surface-local)
      highlightActions?.setHighlightedId(id, 'pointer')
    },
    [onPointerMove, disabled, highlightState, highlightActions, id],
  )

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event)
      if (event.defaultPrevented || disabled) return

      if (
        event.key === 'ArrowRight' ||
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault()
        submenu.actions.setOpen(true, 'keyboard')
      }
    },
    [onKeyDown, disabled, submenu.actions],
  )

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(event)
      if (event.defaultPrevented || disabled) return
      // Always open on click (don't toggle) - submenus should stay open when clicked
      // This prevents the submenu from closing when it was already opened via hover
      if (!isOpen) {
        submenu.actions.setOpen(true, 'pointer')
      }
    },
    [onClick, disabled, submenu.actions, isOpen],
  )

  // Handle pointer enter - open submenu on hover if enabled
  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerEnter?.(event)
      if (event.defaultPrevented || disabled) return
      if (!openSubmenusOnHover) return

      submenu.actions.setOpen(true, 'pointer')
    },
    [onPointerEnter, disabled, openSubmenusOnHover, submenu.actions],
  )

  // Handle pointer leave - close submenu when leaving if opened via hover
  const handlePointerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(event)
      if (event.defaultPrevented || disabled) return
      if (!openSubmenusOnHover) return

      // Check if we're moving to the submenu content
      const relatedTarget = event.relatedTarget as HTMLElement | null
      const submenuContent = submenu.contentRef.current

      // Don't close if moving to the submenu content
      if (
        submenuContent &&
        relatedTarget &&
        submenuContent.contains(relatedTarget)
      ) {
        return
      }

      submenu.actions.setOpen(false)
    },
    [
      onPointerLeave,
      disabled,
      openSubmenusOnHover,
      submenu.actions,
      submenu.contentRef,
    ],
  )

  // Don't render if filtered out by search
  if (!isInSearchResults) {
    return null
  }

  return (
    <Popover.Trigger
      ref={composedRef}
      nativeButton={false}
      render={
        <div
          role="menuitem"
          id={id}
          tabIndex={disabled ? undefined : -1}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-disabled={disabled || undefined}
          data-highlighted={isHighlighted || undefined}
          data-disabled={disabled || undefined}
          data-open={isOpen || undefined}
          onPointerDown={handlePointerDown}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onPointerMove={handlePointerMove}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          {...props}
        />
      }
    >
      {children}
    </Popover.Trigger>
  )
}) as MenuSubmenuTrigger

MenuSubmenuTrigger.displayName = 'Menu.Submenu.Trigger'

// ============================================================================
// Namespace Types
// ============================================================================

export interface MenuSubmenuTrigger {
  (
    props: SubmenuTriggerProps & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element
  displayName?: string
}

export namespace MenuSubmenuTrigger {
  export type Props = SubmenuTriggerProps
}

// ============================================================================
// Exports
// ============================================================================

export interface MenuSubmenu {
  (props: SubmenuProps): React.JSX.Element
  displayName?: string
  Trigger: MenuSubmenuTrigger
}

export const MenuSubmenu: MenuSubmenu = Object.assign(MenuSubmenuRoot, {
  Trigger: MenuSubmenuTrigger,
})

export namespace MenuSubmenu {
  export type Props = SubmenuProps
  export namespace Trigger {
    export type Props = SubmenuTriggerProps
  }
}
