import * as Popper from '@radix-ui/react-popper'
import { Portal } from '@radix-ui/react-portal'
import { Presence } from '@radix-ui/react-presence'
import * as React from 'react'
import { useDisplayMode } from '../contexts/display-mode-context.js'
import { useRootCtx } from '../contexts/root-context.js'
import { useSubCtx } from '../contexts/submenu-context.js'
import { useScopedTheme } from '../contexts/theme-context.js'
import { INPUT_VISIBILITY_CHANGE_EVENT } from '../lib/events.js'
import type { ActionMenuPositionerProps, Children } from '../types.js'
import { IntentZone } from './intent-zone.js'
import { InteractionGuard } from './interaction-guard.js'

export const Positioner = ({ children }: Children) => {
  const theme = useScopedTheme()
  const sub = useSubCtx()
  const isSub = !!sub

  const positionerProps = React.useMemo(() => {
    const slotPropsConfig = theme.slotProps?.positioner
    if (!slotPropsConfig) return undefined

    // Check if it's conditional (has 'root' or 'sub' keys)
    if ('root' in slotPropsConfig || 'sub' in slotPropsConfig) {
      return isSub ? slotPropsConfig.sub : slotPropsConfig.root
    }

    // Flat config - apply to both
    return slotPropsConfig
  }, [theme.slotProps?.positioner, isSub])

  return <PositionerImpl {...positionerProps}>{children}</PositionerImpl>
}

export const PositionerImpl: React.FC<ActionMenuPositionerProps> = ({
  children,
  side,
  align,
  sideOffset = 8,
  alignOffset = 0,
  avoidCollisions = true,
  collisionPadding = 8,
}) => {
  const root = useRootCtx()
  const sub = useSubCtx()

  const isSub = !!sub
  const present = isSub ? sub!.open : root.open
  const defaultSide = isSub ? 'right' : 'bottom'
  const resolvedSide = side ?? defaultSide
  const defaultAlign = isSub ? 'list' : 'start'
  const resolvedAlign = align ?? defaultAlign
  const mode = useDisplayMode()

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
    if (!isSub || !present) {
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
    const inputEl = el.querySelector<HTMLElement>('[data-action-menu-input]')
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
      '[data-slot="action-menu-list"]',
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
  }, [resolvedAlign, isSub, present, resolvedSide, findContentEl, sub])

  React.useLayoutEffect(() => {
    if (!isSub) {
      return
    }
    if (!present) {
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
  }, [isSub, sub, present, resolvedAlign, measure])

  // When align is 'list', use computed offset + user's alignOffset
  // Otherwise, just use user's alignOffset
  const effectiveAlign = resolvedAlign === 'list' ? 'start' : resolvedAlign
  const effectiveAlignOffset =
    resolvedAlign === 'list' ? listTopOffset + alignOffset : alignOffset

  const popperContentProps: React.ComponentProps<typeof Popper.Content> =
    React.useMemo(
      () => ({
        asChild: true,
        side: resolvedSide,
        align: effectiveAlign,
        sideOffset: sideOffset,
        alignOffset: effectiveAlignOffset,
        avoidCollisions: avoidCollisions,
        collisionPadding: collisionPadding,
        style: {
          '--action-menu-available-height':
            'var(--radix-popper-available-height, 0px)',
          '--action-menu-available-width':
            'var(--radix-popper-available-width, 0px)',
        } as React.CSSProperties,
      }),
      [
        resolvedSide,
        effectiveAlign,
        sideOffset,
        effectiveAlignOffset,
        avoidCollisions,
        collisionPadding,
      ],
    )

  // NOTE: For the root surface in drawer mode, Positioner is a no-op pass-through.
  // For submenus, we always position with Popper (even in drawer mode).
  if (mode === 'drawer' && !isSub) {
    return <>{children}</>
  }

  const content = isSub ? (
    <Portal>
      <Presence present={present}>
        <InteractionGuard.Branch asChild scopeId={root.scopeId}>
          <Popper.Content {...popperContentProps}>{children}</Popper.Content>
        </InteractionGuard.Branch>
      </Presence>
    </Portal>
  ) : (
    <Portal>
      <Presence present={present}>
        <InteractionGuard.Root
          asChild
          scopeId={root.scopeId}
          disableOutsidePointerEvents={root.modal}
          onEscapeKeyDown={() => {
            root.closeAllSurfaces()
          }}
          onInteractOutside={(event) => {
            const target = event.target as HTMLElement | null
            if (target?.closest?.('[data-action-menu-surface]')) return
            event.preventDefault()
            root.closeAllSurfaces()
          }}
        >
          <Popper.Content {...popperContentProps}>{children}</Popper.Content>
        </InteractionGuard.Root>
      </Presence>
    </Portal>
  )

  return (
    <>
      {content}
      {isSub && present ? (
        <IntentZone
          parentRef={sub!.contentRef as React.RefObject<HTMLElement | null>}
          triggerRef={sub!.triggerRef as React.RefObject<HTMLElement | null>}
          visible={root.debug}
        />
      ) : null}
    </>
  )
}
