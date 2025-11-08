/** biome-ignore-all lint/a11y/useSemanticElements: This library renders ARIA-only primitives intentionally. */
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import { DisplayModeCtx } from '../contexts/display-mode-context.js'
import { FocusOwnerCtx } from '../contexts/focus-owner-context.js'
import { RootCtx } from '../contexts/root-context.js'
import { useMediaQuery } from '../hooks/use-media-query.js'
import { dispatch } from '../lib/events.js'
import type {
  ActionMenuClassNames,
  ActionMenuSlotProps,
  ActionMenuSlots,
  Children,
  MenuDef,
  MenuDisplayMode,
  ResponsiveConfig,
  RootContextValue,
} from '../types.js'
import { DrawerShell, DropdownShell } from './shell.js'

export interface ActionMenuRootProps<T = unknown> extends Children {
  menu: MenuDef<T>
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  responsive?: Partial<ResponsiveConfig>
  slots?: Partial<ActionMenuSlots>
  slotProps?: Partial<ActionMenuSlotProps>
  classNames?: Partial<ActionMenuClassNames>
  debug?: boolean
  onCloseAutoFocus?: (event: Event) => void
}

const CLOSE_MENU_EVENT = 'actionmenu-close' as const

/** Entry component: chooses the shell and provides root/display/focus contexts. */
export function Root<T>({
  menu,
  children,
  open: openProp,
  defaultOpen,
  onOpenChange,
  modal = true,
  responsive: responsiveProp,
  slotProps,
  classNames,
  debug = false,
  onCloseAutoFocus,
}: ActionMenuRootProps<T>) {
  const scopeId = React.useId()
  const [open, setOpen] = useControllableState({
    prop: openProp ?? menu.open?.value,
    defaultProp: defaultOpen ?? false,
    onChange: (value) => {
      if (!value) closeAllSurfaces()

      if (onOpenChange) onOpenChange?.(value)
      else if (menu.open?.onValueChange) menu.open?.onValueChange?.(value)
      else setOpen(value)
    },
  })
  const anchorRef = React.useRef<HTMLButtonElement | null>(null)
  const [ownerId, setOwnerId] = React.useState<string | null>(null)

  const responsive = React.useMemo(
    () => ({
      mode: responsiveProp?.mode ?? 'auto',
      query: responsiveProp?.query ?? '(max-width: 640px), (pointer: coarse)',
    }),
    [responsiveProp],
  )
  const { mode, query } = responsive
  const autoDrawer = useMediaQuery(query)
  const resolvedMode: MenuDisplayMode =
    mode === 'drawer' || mode === 'dropdown'
      ? mode
      : autoDrawer
        ? 'drawer'
        : 'dropdown'

  const openSurfaceIds = React.useRef<Map<string, number>>(new Map())

  const registerSurface = React.useCallback(
    (surfaceId: string, depth: number) => {
      openSurfaceIds.current.set(surfaceId, depth)
    },
    [],
  )

  const unregisterSurface = React.useCallback((surfaceId: string) => {
    openSurfaceIds.current.delete(surfaceId)
  }, [])

  const closeAllSurfaces = React.useCallback(() => {
    const ordered = [...openSurfaceIds.current.entries()].sort(
      (a, b) => b[1] - a[1],
    )

    for (const [surfaceId] of ordered) {
      const el = document.querySelector<HTMLElement>(
        `[data-surface-id="${surfaceId}"]`,
      )
      if (el) dispatch(el, CLOSE_MENU_EVENT)
    }
    setOpen(false)
  }, [setOpen])

  const onOpenToggle = React.useCallback(() => setOpen((v) => !v), [setOpen])

  // Handle focus return to trigger on close (dropdown mode only)
  const prevOpenRef = React.useRef(open)
  React.useEffect(() => {
    // Only run when transitioning from open to closed
    if (prevOpenRef.current && !open && resolvedMode === 'dropdown') {
      // Create a synthetic event for the callback
      const event = new Event('closeAutoFocus', { cancelable: true })

      if (onCloseAutoFocus) {
        onCloseAutoFocus(event)
      }

      // If not prevented, return focus to the trigger
      if (!event.defaultPrevented && anchorRef.current) {
        requestAnimationFrame(() => {
          anchorRef.current?.focus()
        })
      }
    }
    prevOpenRef.current = open
  }, [open, resolvedMode, onCloseAutoFocus])

  const rootCtxValue: RootContextValue = React.useMemo(
    () => ({
      scopeId,
      open,
      onOpenChange: (value) => setOpen(value),
      onOpenToggle,
      anchorRef,
      modal,
      debug,
      slotProps,
      classNames,
      responsive,
      openSurfaceIds,
      registerSurface,
      unregisterSurface,
      closeAllSurfaces,
      onCloseAutoFocus,
    }),
    [
      scopeId,
      open,
      setOpen,
      onOpenToggle,
      modal,
      debug,
      slotProps,
      classNames,
      responsive,
      registerSurface,
      unregisterSurface,
      closeAllSurfaces,
      onCloseAutoFocus,
    ],
  )

  const content =
    resolvedMode === 'dropdown' ? (
      <DropdownShell>{children}</DropdownShell>
    ) : (
      <DrawerShell>{children}</DrawerShell>
    )

  return (
    <RootCtx.Provider value={rootCtxValue}>
      <DisplayModeCtx.Provider value={resolvedMode}>
        <FocusOwnerCtx.Provider value={{ ownerId, setOwnerId }}>
          {content}
        </FocusOwnerCtx.Provider>
      </DisplayModeCtx.Provider>
    </RootCtx.Provider>
  )
}
