import * as React from 'react'
import { Popover } from '@base-ui-components/react/popover'
import { useMenu, useMenuInternal } from '../contexts/menu-context.js'
import {
  useCollection,
  SubmenuPathProvider,
} from '../contexts/collection-context.js'
import { useFocusOwner } from '../contexts/focus-owner-context.js'
import { useSubmenu } from '../contexts/submenu-context.js'
import { SurfaceProvider, useSurface } from '../contexts/surface-context.js'
import { useHighlightedRow } from '../hooks/use-highlighted-row.js'
import { isInBounds } from '../utils/dom.js'
import { InteractionGuard } from './interaction-guard.js'

// ============================================================================
// Types
// ============================================================================

export interface SurfaceProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Children */
  children?: React.ReactNode
  /** Whether to loop keyboard navigation at ends */
  loop?: boolean
}

// ============================================================================
// Inner Component
// ============================================================================

interface SurfaceInnerProps extends SurfaceProps {
  forwardedRef: React.ForwardedRef<HTMLDivElement>
}

/**
 * Inner component that has access to SurfaceContext.
 * This separation allows useHighlightedRow to access surface-local search state.
 */
function SurfaceInner({
  children,
  loop = true,
  forwardedRef,
  ...props
}: SurfaceInnerProps) {
  const { state, actions, contentRef, menuId, scopeId, openSubmenusOnHover } =
    useMenu()
  const { setGetNavigableIds } = useMenuInternal()
  const { actions: collectionActions } = useCollection()
  const {
    searchState,
    highlightState,
    highlightActions,
    focusActions,
    surfaceId,
  } = useSurface()
  const submenu = useSubmenu()

  // Derive open state (needed before useHighlightedRow for auto-highlight)
  const isSubmenu = !!submenu
  const isOpen = submenu ? submenu.state.open : state.open

  // Use centralized highlight management with surface-local state
  const {
    highlightedId,
    moveHighlight,
    setHighlightedId,
    getVisibleNavigableIds,
  } = useHighlightedRow({
    loop,
    searchState,
    highlightState,
    highlightActions,
    isOpen,
    surfaceId,
  })

  // Focus owner context - tracks which surface owns DOM focus across the menu tree
  const { ownerId, setOwnerId } = useFocusOwner()
  const isOwner = ownerId === surfaceId

  // Reset focus owner when root menu closes
  React.useEffect(() => {
    if (!isOpen && !isSubmenu) {
      setOwnerId(null)
    }
  }, [isOpen, isSubmenu, setOwnerId])

  // Claim focus ownership on initial open (when ownerId is null)
  React.useEffect(() => {
    if (!isOpen) return

    if (ownerId === null) {
      setOwnerId(surfaceId)
      focusActions.focusSurface()
    }
  }, [isOpen, ownerId, surfaceId, setOwnerId, focusActions])

  // Focus surface when becoming the owner
  React.useEffect(() => {
    if (!isOpen || !isOwner) return
    focusActions.focusSurface()
  }, [isOpen, isOwner, focusActions])

  // Handler to claim focus ownership on pointer move
  // Only claims ownership if the pointer is within THIS surface's bounds
  // This prevents parent surfaces from stealing focus when pointer is over a submenu
  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.stopPropagation()

      if (ownerId !== surfaceId) {
        setOwnerId(surfaceId)
      }
    },
    [ownerId, surfaceId, setOwnerId],
  )

  // Handler to close submenu when pointer leaves (if openSubmenusOnHover is enabled)
  const handlePointerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isSubmenu || !openSubmenusOnHover || !submenu) return

      // Check if we're moving back to the trigger
      const relatedTarget = event.relatedTarget as HTMLElement | null
      const triggerElement = submenu.triggerRef.current

      // Don't close if moving back to the trigger
      if (
        triggerElement &&
        relatedTarget &&
        triggerElement.contains(relatedTarget)
      ) {
        return
      }

      submenu.actions.setOpen(false)
    },
    [isSubmenu, openSubmenusOnHover, submenu],
  )

  // Compose refs
  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
      contentRef.current = node
      // Also set submenu's contentRef for hover detection
      if (submenu) {
        submenu.contentRef.current = node
      }
    },
    [forwardedRef, contentRef, submenu],
  )

  // Register getNavigableIds with menu context
  React.useEffect(() => {
    setGetNavigableIds(() => collectionActions.getNavigableIds())
  }, [setGetNavigableIds, collectionActions])

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return

      const navigableIds = getVisibleNavigableIds()
      if (navigableIds.length === 0) return

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault()
          moveHighlight('next')
          break
        }

        case 'ArrowUp': {
          event.preventDefault()
          moveHighlight('prev')
          break
        }

        case 'Home': {
          event.preventDefault()
          moveHighlight('first')
          break
        }

        case 'End': {
          event.preventDefault()
          moveHighlight('last')
          break
        }

        case 'ArrowRight': {
          // For submenus: open if on a submenu trigger
          if (highlightedId) {
            const node = collectionActions.getNode(highlightedId)
            if (node?.kind === 'submenu-trigger') {
              event.preventDefault()
              actions.openSubmenu(highlightedId, 'keyboard')
            }
          }
          break
        }

        case 'ArrowLeft': {
          // For submenus: close current submenu and return focus to parent
          if (submenu) {
            event.preventDefault()
            submenu.actions.setOpen(false)
            // Focus the trigger in the parent surface
            // Use requestAnimationFrame to ensure the submenu has closed
            requestAnimationFrame(() => {
              submenu.triggerRef.current?.focus()
            })
          }
          break
        }

        case 'Escape': {
          event.preventDefault()
          if (submenu) {
            submenu.actions.setOpen(false)
            // Focus the trigger in the parent surface
            requestAnimationFrame(() => {
              submenu.triggerRef.current?.focus()
            })
          } else {
            actions.setOpen(false)
          }
          break
        }

        case 'Enter':
        case ' ': {
          // Selection is handled by the Item component
          break
        }

        default: {
          // Typeahead: single character search
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
            // Simple typeahead - find next item starting with this character
            const char = event.key.toLowerCase()
            const currentIndex = highlightedId
              ? navigableIds.indexOf(highlightedId)
              : -1

            // Search from current position
            for (let i = 1; i <= navigableIds.length; i++) {
              const index = (currentIndex + i) % navigableIds.length
              const id = navigableIds[index]
              if (id) {
                const node = collectionActions.getNode(id)
                if (node?.textValue.toLowerCase().startsWith(char)) {
                  setHighlightedId(id, 'keyboard')
                  break
                }
              }
            }
          }
          break
        }
      }
    },
    [
      getVisibleNavigableIds,
      moveHighlight,
      highlightedId,
      collectionActions,
      actions,
      submenu,
      setHighlightedId,
    ],
  )

  // Only render InteractionGuard for root menu, not submenus
  // Submenus are handled by their parent's InteractionGuard scope
  const isRootMenu = !submenu

  const content = (
    <Popover.Popup
      ref={composedRef}
      role="menu"
      id={menuId}
      aria-orientation="vertical"
      data-highlighted-id={highlightedId ?? undefined}
      data-menu-surface=""
      data-surface-id={surfaceId}
      data-search-mode={searchState.searchMode || undefined}
      data-focus-owner={isOwner || undefined}
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={isSubmenu ? handlePointerLeave : undefined}
      // Disable Base UI's auto-focus for submenus - we manage focus manually
      // Submenus should only receive focus when pointer moves inside them
      initialFocus={isSubmenu ? false : undefined}
      {...props}
    >
      {children}
    </Popover.Popup>
  )

  // Wrap root menu surface with InteractionGuard for outside click handling
  if (isRootMenu) {
    return (
      <InteractionGuard.Root
        asChild
        scopeId={scopeId}
        surfaceSelector="[data-menu-surface]"
        disableOutsidePointerEvents={state.modal}
        onDismiss={() => actions.setOpen(false)}
      >
        {content}
      </InteractionGuard.Root>
    )
  }

  // Submenu surfaces are marked as branches of the root's interaction scope
  return (
    <InteractionGuard.Branch asChild scopeId={scopeId}>
      {content}
    </InteractionGuard.Branch>
  )
}

// ============================================================================
// Component
// ============================================================================

/**
 * The menu surface that contains menu items.
 * Wraps Base UI's Popover.Popup with menu-specific behavior.
 *
 * Features:
 * - role="menu" for accessibility
 * - Keyboard navigation (arrow keys, home/end)
 * - Typeahead search
 * - Focus management
 *
 * @example
 * ```tsx
 * <Menu.Surface className="menu-content">
 *   <Menu.Item>Item 1</Menu.Item>
 *   <Menu.Item>Item 2</Menu.Item>
 * </Menu.Surface>
 * ```
 */
export const MenuSurface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  function MenuSurface({ children, loop = true, ...props }, forwardedRef) {
    const { state, menuId } = useMenu()
    const submenu = useSubmenu()

    // Determine if this surface is open (for SurfaceProvider to reset state on close)
    const isOpen = submenu ? submenu.state.open : state.open

    // Generate a stable surface ID
    const surfaceId = submenu ? submenu.state.submenuId : menuId

    // For submenu surfaces, wrap with SubmenuPathProvider so items register with correct parentPath
    const content = (
      <SurfaceProvider surfaceId={surfaceId} open={isOpen}>
        <SurfaceInner loop={loop} forwardedRef={forwardedRef} {...props}>
          {children}
        </SurfaceInner>
      </SurfaceProvider>
    )

    // Only wrap with SubmenuPathProvider for submenu surfaces
    if (submenu) {
      return (
        <SubmenuPathProvider submenuId={submenu.state.submenuId}>
          {content}
        </SubmenuPathProvider>
      )
    }

    return content
  },
) as MenuSurface

MenuSurface.displayName = 'Menu.Surface'

// ============================================================================
// Namespace
// ============================================================================

export interface MenuSurface {
  (props: SurfaceProps & React.RefAttributes<HTMLDivElement>): React.JSX.Element
  displayName?: string
}

export namespace MenuSurface {
  export type Props = SurfaceProps
}
