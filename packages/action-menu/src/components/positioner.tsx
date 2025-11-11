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

  return (
    <PositionerImpl {...theme.slotProps?.positioner}>{children}</PositionerImpl>
  )
}

export const PositionerImpl: React.FC<ActionMenuPositionerProps> = ({
  children,
  side,
  align = 'start',
  sideOffset = 8,
  alignOffset = 0,
  avoidCollisions = true,
  collisionPadding = 8,
  alignToFirstItem = 'on-open',
}) => {
  const root = useRootCtx()
  const sub = useSubCtx()

  const isSub = !!sub
  const present = isSub ? sub!.open : root.open
  const defaultSide = isSub ? 'right' : 'bottom'
  const resolvedSide = side ?? defaultSide
  const mode = useDisplayMode()

  const [firstRowAlignOffset, setFirstRowAlignOffset] = React.useState(0)

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
    if (!isSub || !present || !alignToFirstItem) {
      setFirstRowAlignOffset(0)
      return
    }
    if (!(resolvedSide === 'right' || resolvedSide === 'left')) {
      setFirstRowAlignOffset(0)
      return
    }
    const el = findContentEl()
    console.log(`[${sub?.def.id}] el:`, el)

    if (!el) return

    const inputEl = el.querySelector<HTMLElement>('[data-action-menu-input]')
    const hasVisibleInput = !!inputEl && inputEl.offsetParent !== null

    if (!hasVisibleInput) {
      console.log(`[${sub?.def.id}] no visible input`)
      setFirstRowAlignOffset(0)
      return
    }

    // Check if there are any rows in the list
    const listEl = el.querySelector<HTMLElement>(
      '[data-slot="action-menu-list"]',
    )
    const hasRows = listEl?.querySelector('li') !== null

    if (!hasRows) {
      console.log(`[${sub?.def.id}] no rows - using normal alignment`)
      setFirstRowAlignOffset(0)
      return
    }

    // Calculate offset from input's bottom edge to content's top edge
    // This accounts for any padding/margin between input and list
    const contentRect = el.getBoundingClientRect()
    const inputRect = inputEl.getBoundingClientRect()
    const computedOffset = -Math.round(inputRect.bottom - contentRect.top)
    console.log(`[${sub?.def.id}] computedOffset:`, computedOffset)
    setFirstRowAlignOffset(computedOffset)
  }, [isSub, present, alignToFirstItem, resolvedSide, findContentEl, sub])

  React.useLayoutEffect(() => {
    if (!isSub) {
      return
    }
    if (!present) {
      return
    }
    if (!alignToFirstItem) {
      return
    }

    const handle = (e: Event) => {
      console.log(`[${sub?.def.id}] handle:`, e)
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
      if (
        alignToFirstItem === 'on-open' &&
        customEvent.detail?.hideSearchUntilActive &&
        customEvent.detail?.inputActive
      ) {
        return
      }

      // No need for requestAnimationFrame since we only measure the input element
      // which exists immediately when the surface is mounted
      measure()
    }
    document.addEventListener(INPUT_VISIBILITY_CHANGE_EVENT, handle, true)
    return () => {
      document.removeEventListener(INPUT_VISIBILITY_CHANGE_EVENT, handle, true)
    }
  }, [isSub, sub, present, alignToFirstItem, measure])

  const effectiveAlignOffset =
    isSub && alignToFirstItem ? firstRowAlignOffset : alignOffset

  const popperContentProps: React.ComponentProps<typeof Popper.Content> =
    React.useMemo(
      () => ({
        asChild: true,
        side: resolvedSide,
        align: align,
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
        align,
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
