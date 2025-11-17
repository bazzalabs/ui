import type { MenuDef, MenuNodeDefaults } from '@bazza-ui/menu'
import { PopupMenuContent, Positioner } from '@bazza-ui/popup-menu'
import * as React from 'react'
import { useRootContext } from '../contexts/root-context.js'

export interface ContextMenuContentProps<T = unknown> {
  /** Menu definition (optional if provided to Root) */
  menu?: MenuDef<T>
  /** Placeholder for search input */
  placeholder?: string
  /** Whether to show debug visuals */
  debug?: boolean
  /** Default configurations for menu behavior */
  defaults?: Partial<MenuNodeDefaults<T>>
}

/**
 * ContextMenuContent - Renders the popup menu content at cursor position
 * Uses popup-menu's Positioner for consistent theming integration
 */
export function ContextMenuContent<T = unknown>({
  menu: menuProp,
  placeholder = 'Search...',
  debug = false,
  defaults,
}: ContextMenuContentProps<T>) {
  const { open, closeAllSurfaces, anchorPoint } = useRootContext()
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Extract surface defaults for PopupMenuContent props
  const vimBindings = defaults?.surface?.vimBindings ?? true
  const dir = defaults?.surface?.dir ?? 'ltr'

  // Merge defaults with menu properties
  // menu properties take precedence over passed defaults
  const mergedMenu = React.useMemo<MenuDef<T> | undefined>(() => {
    if (!menuProp) return undefined

    // If there are no defaults, return menu as-is
    if (!defaults) return menuProp

    // Merge defaults into menu.defaults
    const mergedDefaults = defaults
      ? {
          surface: { ...defaults.surface, ...menuProp.defaults?.surface },
          item: { ...defaults.item, ...menuProp.defaults?.item },
          virtualization: {
            ...defaults.virtualization,
            ...menuProp.defaults?.virtualization,
          },
        }
      : menuProp.defaults

    // Merge virtualization config: defaults first, then menu overrides
    const mergedVirtualization = defaults.virtualization
      ? {
          ...defaults.virtualization,
          ...menuProp.virtualization,
        }
      : menuProp.virtualization

    return {
      ...menuProp,
      defaults: mergedDefaults,
      virtualization: mergedVirtualization,
    }
  }, [menuProp, defaults])

  // Keep the last valid anchor point for exit animations
  const lastAnchorPoint = React.useRef<{ x: number; y: number } | null>(null)
  if (anchorPoint) {
    lastAnchorPoint.current = anchorPoint
  }

  // Use current or last anchor point for positioning
  const activeAnchorPoint = anchorPoint ?? lastAnchorPoint.current

  // Create virtual anchor element for cursor position
  // Must be called unconditionally before early returns (Rules of Hooks)
  const virtualAnchor = React.useMemo(
    () =>
      activeAnchorPoint
        ? {
            getBoundingClientRect: () => ({
              x: activeAnchorPoint.x,
              y: activeAnchorPoint.y,
              width: 0,
              height: 0,
              top: activeAnchorPoint.y,
              left: activeAnchorPoint.x,
              right: activeAnchorPoint.x,
              bottom: activeAnchorPoint.y,
              toJSON: () => ({}),
            }),
          }
        : null,
    [activeAnchorPoint],
  )

  // Get menu from context (passed to Root) or props
  // For now, require it from Root via context
  // TODO: Add menu to root context if we want to support both patterns

  // Only return null if we've never had an anchor point
  if (!virtualAnchor) {
    return null
  }

  return (
    <>
      <Positioner
        side="bottom"
        align="start"
        sideOffset={4}
        anchor={virtualAnchor}
      >
        {(popupProps: React.HTMLAttributes<HTMLElement>) =>
          mergedMenu ? (
            <PopupMenuContent
              menu={mergedMenu}
              open={open}
              onClose={closeAllSurfaces}
              contentRef={contentRef as any}
              placeholder={placeholder}
              popupProps={popupProps}
              vimBindings={vimBindings}
              dir={dir}
            />
          ) : (
            <div {...popupProps} />
          )
        }
      </Positioner>

      {/* Debug visualization */}
      {debug && activeAnchorPoint && (
        <div
          style={{
            position: 'fixed',
            left: activeAnchorPoint.x,
            top: activeAnchorPoint.y,
            width: 8,
            height: 8,
            background: 'red',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}
    </>
  )
}
