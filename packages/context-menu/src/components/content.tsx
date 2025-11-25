import type { MenuNodeDefaults } from '@bazza-ui/menu'
import { type PopupMenuDef, Positioner, Surface } from '@bazza-ui/popup-menu'
import * as React from 'react'
import { useRootContext } from '../contexts/root-context.js'

export interface ContextMenuContentProps<T = unknown> {
  /** Menu definition (optional if provided to Root) */
  menu?: PopupMenuDef<T>
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
  placeholder,
  debug = false,
  defaults,
}: ContextMenuContentProps<T>) {
  const { open, closeAllSurfaces, anchorPoint, control } = useRootContext<T>()
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Extract surface defaults for Surface props
  const vimBindings = defaults?.surface?.vimBindings ?? true
  const dir = defaults?.surface?.dir ?? 'ltr'

  // No merging needed here - instantiateMenuFromDef will handle all defaults merging
  // Just pass menu as-is and defaults separately

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
  if (!virtualAnchor || !menuProp) {
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
        <Surface
          menu={menuProp}
          open={open}
          onClose={closeAllSurfaces}
          contentRef={contentRef}
          placeholder={placeholder}
          vimBindings={vimBindings}
          dir={dir}
          defaults={defaults as any}
          control={control}
        />
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
