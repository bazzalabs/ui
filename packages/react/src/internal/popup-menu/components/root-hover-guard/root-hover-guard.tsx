import * as React from 'react'
import { useOpenChain } from '../../contexts/open-chain-context.js'
import { usePopupMenuContext } from '../../contexts/popup-menu-context.js'
import { usePopupMenuDebug } from '../../contexts/popup-menu-debug-context.js'
import { useAimMonitor } from '../../hooks/use-aim-monitor.js'
import { isMouseLikePointerType } from '../../utils/is-mouse-like-pointer.js'
import {
  PopupMenuSafeTriangleArea,
  type PopupMenuSafeTriangleTone,
} from '../debug/safe-triangle-area.js'

export function RootHoverGuard(props: {
  onClose: (event: MouseEvent) => void
}) {
  const { store } = usePopupMenuContext()
  const openChainStore = useOpenChain()
  const { showSafeTriangleArea } = usePopupMenuDebug()
  const open = store.useState('open')
  const hoverEnabled = store.useState('hoverTriggerEnabled')
  const openedByHover = store.useState('openedByHover')
  // The popup registers its element in an effect that runs after ours (it is
  // a later sibling in the tree), so re-run the listener effect once it has.
  const popupMountVersion = store.useState('popupMountVersion')
  const hasOpenSubmenu = openChainStore.useState('hasOpenSubmenu', 0)
  const lastLeaveEventRef = React.useRef<MouseEvent | null>(null)
  const lastPointerRef = React.useRef<{ x: number; y: number } | null>(null)
  const previousHasOpenSubmenuRef = React.useRef(hasOpenSubmenu)
  const onCloseRef = React.useRef(props.onClose)
  onCloseRef.current = props.onClose

  const monitor = useAimMonitor({
    getContentRect: () =>
      store.context.refs.popupRef.current?.getBoundingClientRect() ?? null,
    getAnchorRect: () =>
      store.context.refs.triggerRef.current?.getBoundingClientRect() ?? null,
    anchorMode: 'pointer',
    closeDelay: store.context.hoverTrigger?.closeDelay ?? 0,
    closeOnPointerLeave: true,
    onClose: () => {
      // A close timer can expire in the window between a non-hover close
      // (Escape, item select) committing and the passive open-change effect
      // cancelling the monitor; never emit a second close for a closed popup.
      if (!store.select('open')) return
      const event = lastLeaveEventRef.current
      if (event) onCloseRef.current(event)
    },
    logContext: () => ({ scope: 'root' }),
  })

  const enabled = open && hoverEnabled && openedByHover

  // Layout effect: the popup registers its element in a layout effect that
  // runs after ours (later sibling) and bumps `popupMountVersion`; the sync
  // re-render lets us attach before the browser paints the open popup.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `popupMountVersion` re-runs the effect once the popup element has registered
  React.useLayoutEffect(() => {
    if (!enabled) {
      monitor.cancel()
      return
    }

    let triggerEl: HTMLElement | null = null
    let popupEl: HTMLElement | null = null

    const isInsideOwnSubmenu = (element: Element) => {
      const submenu = element.closest('[data-submenu]')
      return (
        submenu !== null &&
        openChainStore.state.chain.includes(
          submenu.getAttribute('data-bazzaui-surface-id') ?? '',
        )
      )
    }

    const handleMouseEnter = () => monitor.cancel()
    const handleMouseLeave = (event: MouseEvent) => {
      const relatedTarget = event.relatedTarget
      if (!triggerEl || !popupEl) return
      if (
        relatedTarget instanceof Element &&
        (triggerEl.contains(relatedTarget) ||
          popupEl.contains(relatedTarget) ||
          isInsideOwnSubmenu(relatedTarget))
      ) {
        return
      }
      lastLeaveEventRef.current = event
      monitor.pointerLeft({
        clientX: event.clientX,
        clientY: event.clientY,
        pointerType: 'mouse',
      })
    }

    triggerEl = store.context.refs.triggerRef.current
    popupEl = store.context.refs.popupRef.current
    if (!triggerEl || !popupEl) return
    triggerEl.addEventListener('mouseenter', handleMouseEnter, {
      passive: true,
    })
    popupEl.addEventListener('mouseenter', handleMouseEnter, {
      passive: true,
    })
    triggerEl.addEventListener('mouseleave', handleMouseLeave, {
      passive: true,
    })
    popupEl.addEventListener('mouseleave', handleMouseLeave, {
      passive: true,
    })
    return () => {
      triggerEl?.removeEventListener('mouseenter', handleMouseEnter)
      popupEl?.removeEventListener('mouseenter', handleMouseEnter)
      triggerEl?.removeEventListener('mouseleave', handleMouseLeave)
      popupEl?.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [enabled, popupMountVersion, store, openChainStore, monitor])

  // Last real pointer position, used only by the submenu-close re-evaluation
  // below; only track it while a hover trigger is published.
  React.useEffect(() => {
    if (!hoverEnabled) return
    const handlePointerMove = (event: PointerEvent) => {
      if (isMouseLikePointerType(event.pointerType)) {
        lastPointerRef.current = { x: event.clientX, y: event.clientY }
      }
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [hoverEnabled])

  React.useEffect(() => {
    const wasOpen = previousHasOpenSubmenuRef.current
    previousHasOpenSubmenuRef.current = hasOpenSubmenu
    if (!enabled || !wasOpen || hasOpenSubmenu) return
    const last = lastPointerRef.current
    if (!last) return
    const popupRect =
      store.context.refs.popupRef.current?.getBoundingClientRect()
    const triggerRect =
      store.context.refs.triggerRef.current?.getBoundingClientRect()
    const inside = (rect: DOMRect | undefined) =>
      rect !== undefined &&
      last.x >= rect.left &&
      last.x <= rect.right &&
      last.y >= rect.top &&
      last.y <= rect.bottom
    if (inside(popupRect) || inside(triggerRect)) return
    lastLeaveEventRef.current = new MouseEvent('mouseleave', {
      clientX: last.x,
      clientY: last.y,
    })
    monitor.pointerLeft({
      clientX: last.x,
      clientY: last.y,
      pointerType: 'mouse',
      source: 'reevaluate',
    })
  }, [hasOpenSubmenu, enabled, store, monitor])

  // Any actual open-state change (either direction) cancels the monitor.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `open` is the trigger, not a read
  React.useEffect(() => {
    monitor.cancel()
    lastLeaveEventRef.current = null
  }, [open, monitor])

  React.useEffect(() => {
    store.setRootHoverGuardCancel(monitor.cancel)
    return () => store.setRootHoverGuardCancel(null)
  }, [store, monitor])

  React.useEffect(() => {
    if (!open) monitor.debug.reset()
  }, [open, monitor])

  const tone: PopupMenuSafeTriangleTone | null =
    monitor.debug.state === 'hover' ||
    monitor.debug.state === 'activated' ||
    monitor.debug.state === 'missed'
      ? monitor.debug.state
      : null

  if (!showSafeTriangleArea.enabled || tone === null) return null
  return (
    <PopupMenuSafeTriangleArea
      scope="root"
      config={showSafeTriangleArea}
      contentRef={store.context.refs.popupRef}
      anchorRef={store.context.refs.triggerRef}
      tone={tone}
      contentRectOverride={monitor.debug.snapshot?.contentRect}
      anchorRectOverride={monitor.debug.snapshot?.anchorRect}
      mousePointOverride={
        monitor.debug.snapshot
          ? [monitor.debug.snapshot.pointerX, monitor.debug.snapshot.pointerY]
          : null
      }
    />
  )
}
