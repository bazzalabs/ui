import { Popover } from '@base-ui-components/react/popover'
import { mergeProps } from '@bazza-ui/theming'
import * as React from 'react'
import { useRoot } from '../contexts/root-context.js'
import { useSub } from '../contexts/submenu-context.js'
import { useScopedTheme } from '../contexts/theme-context.js'
import { INPUT_VISIBILITY_CHANGE_EVENT } from '../lib/events.js'
import type { PopupMenuPositionerProps } from '../types.js'
import { InteractionGuard } from './interaction-guard.js'

export interface PositionerProps {
  side?: PopupMenuPositionerProps['side']
  align?: PopupMenuPositionerProps['align']
  sideOffset?: number
  alignOffset?: number
  /** Custom anchor for root menus (e.g., trigger ref or virtual cursor position) */
  anchor?: React.ComponentProps<typeof Popover.Positioner>['anchor']
  /** Render function that receives popup props to spread */
  children: (
    popupProps: React.HTMLAttributes<HTMLElement>,
  ) => React.ReactElement
}

/**
 * Positioner wraps submenu content and handles positioning with "list" alignment support.
 * Integrates with theming system to apply classNames and slotProps.
 */
export function Positioner({
  children,
  side,
  align,
  sideOffset = 8,
  alignOffset = 0,
  anchor,
}: PositionerProps) {
  const root = useRoot()
  const sub = useSub()
  const { classNames, slotProps } = useScopedTheme()

  const isSub = !!sub
  const defaultSide = isSub ? 'right' : 'bottom'
  const resolvedSide = side ?? defaultSide
  const defaultAlign = isSub ? 'list' : 'start'
  const resolvedAlign = align ?? defaultAlign

  const [listTopOffset, setListTopOffset] = React.useState(0)

  const findContentEl = React.useCallback((): HTMLElement | null => {
    if (!sub) return null
    const byRef = sub.contentRef.current
    if (byRef) return byRef
    try {
      return document.querySelector<HTMLElement>(
        `[data-surface-id="${sub.childSurfaceId}"]`,
      )
    } catch {
      return null
    }
  }, [sub])

  const measure = React.useCallback(() => {
    // Only measure when align is 'list'
    if (resolvedAlign !== 'list') {
      setListTopOffset(0)
      return
    }

    // Only applies to submenus
    if (!isSub || !sub?.open) {
      setListTopOffset(0)
      return
    }

    // Only applies to horizontal positioning
    if (!(resolvedSide === 'right' || resolvedSide === 'left')) {
      setListTopOffset(0)
      return
    }

    const el = findContentEl()
    if (!el) return

    const contentRect = el.getBoundingClientRect()

    // Check for input element (if it exists, align to bottom of input)
    const inputEl = el.querySelector<HTMLElement>('[data-popup-menu-input]')
    const hasVisibleInput = !!inputEl && inputEl.offsetParent !== null

    if (hasVisibleInput) {
      // Align to bottom of input
      const inputRect = inputEl.getBoundingClientRect()
      const computedOffset = -Math.round(inputRect.bottom - contentRect.top)
      setListTopOffset(computedOffset)
      return
    }

    // No input, check for list element
    const listEl = el.querySelector<HTMLElement>(
      '[data-slot="popup-menu-list"]',
    )

    if (listEl) {
      // Align to top of list (inside padding)
      const listRect = listEl.getBoundingClientRect()
      const listStyles = getComputedStyle(listEl)
      const listPaddingTop = Number.parseFloat(listStyles.paddingTop)
      const computedOffset = -Math.round(
        listRect.top + listPaddingTop - contentRect.top,
      )
      setListTopOffset(computedOffset)
      return
    }

    // Fallback: no offset
    setListTopOffset(0)
  }, [resolvedAlign, isSub, sub?.open, resolvedSide, findContentEl, sub])

  React.useLayoutEffect(() => {
    if (!isSub || !sub?.open || resolvedAlign !== 'list') {
      return
    }

    // Measure immediately on mount
    measure()

    // Re-measure on animation frame (after render)
    const rafId = requestAnimationFrame(measure)

    return () => cancelAnimationFrame(rafId)
  }, [isSub, sub?.open, resolvedAlign, measure])

  React.useLayoutEffect(() => {
    if (!isSub) {
      return
    }
    if (!sub?.open) {
      return
    }
    if (resolvedAlign !== 'list') {
      return
    }

    const handle = (e: Event) => {
      const customEvent = e as CustomEvent<{
        surfaceId?: string
        hideSearchUntilActive?: boolean
        inputActive?: boolean
      }>
      const target = e.target as HTMLElement | null
      const ok =
        customEvent.detail?.surfaceId === sub!.childSurfaceId ||
        target?.closest?.(`[data-surface-id="${sub!.childSurfaceId}"]`) !== null

      if (!ok) return

      // Skip measurement when hideSearchUntilActive is true
      // This prevents repositioning when the input appears/disappears during typing
      if (customEvent.detail?.hideSearchUntilActive) {
        return
      }

      // Measure immediately (input exists when event fires)
      measure()
    }
    document.addEventListener(INPUT_VISIBILITY_CHANGE_EVENT, handle, true)
    return () => {
      document.removeEventListener(INPUT_VISIBILITY_CHANGE_EVENT, handle, true)
    }
  }, [isSub, sub, sub?.open, resolvedAlign, measure])

  // Map 'list' to Base UI's 'start' for the actual positioning
  const baseUIAlign = resolvedAlign === 'list' ? 'start' : resolvedAlign

  // Determine if this is a submenu or root positioner
  // Handle both flat PositionerSlotProps and nested { root, sub } structure
  const positionerSlotProps = React.useMemo(() => {
    const props = slotProps?.positioner
    if (!props) return {}

    // Check if it has root/sub structure
    if ('root' in props || 'sub' in props) {
      return isSub ? (props.sub ?? {}) : (props.root ?? {})
    }

    // Otherwise it's a flat object to apply to all
    return props
  }, [slotProps?.positioner, isSub])

  // Merge positioner props with theme (without alignOffset - we'll calculate it separately)
  const basePropsWithoutAnchor = {
    side: resolvedSide,
    align: baseUIAlign,
    sideOffset,
    // Note: alignOffset is intentionally omitted here - calculated below
    sticky: true,
    positionMethod: 'fixed' as const,
    collisionPadding: 8,
    'data-slot': 'popup-menu-positioner',
    'data-positioner-type': isSub ? 'submenu' : 'root',
    className: classNames?.positioner,
  }

  const mergedProps = mergeProps(
    basePropsWithoutAnchor,
    positionerSlotProps,
  ) as any

  // Set this to a valid Base UI align value
  mergedProps.align = baseUIAlign

  // Extract the merged alignOffset (from theme or use prop default)
  const mergedAlignOffset = mergedProps.alignOffset ?? alignOffset

  // Calculate effective align offset: when using 'list' mode, ADD listTopOffset to user's alignOffset
  // This way, if user specifies alignOffset=10 and listTopOffset=-37, final = 10 + (-37) = -27
  const effectiveAlignOffset =
    resolvedAlign === 'list'
      ? mergedAlignOffset + listTopOffset
      : mergedAlignOffset

  // Override alignOffset with our calculated value
  mergedProps.alignOffset = effectiveAlignOffset

  // Add anchor AFTER merge to ensure it's not overwritten (for root menus)
  const positionerProps = anchor ? { ...mergedProps, anchor } : mergedProps

  // Render the popup content
  const popupContent = (
    <Popover.Popup
      initialFocus={false}
      render={(popupProps) => children(popupProps)}
    />
  )

  // Merge InteractionGuard options with defaults
  const guardOptions = root.interactionGuardOptions ?? {}
  const {
    scopeAttr = 'data-interaction-scope',
    disableOutsidePointerEvents = true,
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
    onDismiss,
    surfaceSelector = '[data-popup-menu-surface]',
    branchAttr = 'data-interaction-branch',
  } = guardOptions

  // Create default handlers that call closeAllSurfaces
  const handleEscapeKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      onEscapeKeyDown?.(event)
      if (!event.defaultPrevented) {
        root.closeAllSurfaces()
      }
    },
    [onEscapeKeyDown, root],
  )

  const handlePointerDownOutside = React.useCallback(
    (event: any) => {
      onPointerDownOutside?.(event)
      if (!event.defaultPrevented) {
        root.closeAllSurfaces()
      }
    },
    [onPointerDownOutside, root],
  )

  const handleFocusOutside = React.useCallback(
    (event: any) => {
      onFocusOutside?.(event)
    },
    [onFocusOutside],
  )

  const handleInteractOutside = React.useCallback(
    (event: any) => onInteractOutside?.(event),
    [onInteractOutside],
  )

  const handleDismiss = React.useCallback(() => {
    onDismiss?.()
    root.closeAllSurfaces()
  }, [onDismiss, root])

  // For root menus, wrap with InteractionGuard.Root
  // For submenus, wrap with InteractionGuard.Branch
  const wrappedContent = !isSub ? (
    <InteractionGuard.Root
      asChild
      scopeId={root.scopeId}
      scopeAttr={scopeAttr}
      surfaceSelector={surfaceSelector}
      branchAttr={branchAttr}
      disableOutsidePointerEvents={disableOutsidePointerEvents}
      onPointerDownOutside={handlePointerDownOutside}
      onEscapeKeyDown={handleEscapeKeyDown}
      onFocusOutside={handleFocusOutside}
      onInteractOutside={handleInteractOutside}
      onDismiss={handleDismiss}
    >
      <Popover.Positioner {...positionerProps}>
        {popupContent}
      </Popover.Positioner>
    </InteractionGuard.Root>
  ) : (
    <InteractionGuard.Branch
      asChild
      scopeId={root.scopeId}
      attrName={branchAttr}
    >
      <Popover.Positioner {...positionerProps}>
        {popupContent}
      </Popover.Positioner>
    </InteractionGuard.Branch>
  )

  return <Popover.Portal>{wrappedContent}</Popover.Portal>
}
