'use client'

import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect'
import { useStableCallback } from '@base-ui/utils/useStableCallback'
import {
  type SubmenuAimGuard,
  SubmenuController,
  type SubmenuSettings,
} from '@bazza-ui/menu-core'
import * as React from 'react'
import type { ListboxStore } from '../../../listbox/store/ListboxStore.js'
import { useMaybeMenuSurfaceTier } from '../../contexts/surface-tier-context.js'
import type { FocusOwnerStore } from '../../store/FocusOwnerStore.js'

/** The store of the submenu the trigger opens, from its surface tier. */
function useSubmenuStore(): ListboxStore {
  const store = useMaybeMenuSurfaceTier()?.submenu?.store
  if (!store) {
    throw new Error('SubmenuTrigger must be used within a Submenu')
  }
  return store
}

export interface SubmenuControllerParams {
  settings: SubmenuSettings
  aimGuard: SubmenuAimGuard
  /** The store of the menu the trigger is in. */
  parentStore: ListboxStore
  /** The trigger's id in `parentStore`. */
  storeId: string
  highlighted: boolean
  visible: boolean
  open: boolean
  setOpen: (open: boolean) => void
  suppressAutoOpenRef: { current: boolean }
  contentRef: React.RefObject<HTMLElement | null>
  focusOwnerStore: FocusOwnerStore
  childSurfaceId: string
}

/**
 * A submenu trigger's `SubmenuController`, bound to its menus: it opens and
 * closes the submenu and highlights the trigger as the controller decides,
 * and sends it what happens outside the trigger's own pointer events (its
 * highlight, its submenu's open state, its popup's pointer events, a key,
 * a sibling's highlight, its menu closing). The trigger sends its pointer
 * events itself.
 */
export function useSubmenuController(
  params: SubmenuControllerParams,
): SubmenuController {
  const {
    settings,
    aimGuard,
    parentStore,
    storeId,
    highlighted,
    visible,
    open,
    setOpen,
    suppressAutoOpenRef,
    contentRef,
    focusOwnerStore,
    childSurfaceId,
  } = params

  // The submenu's own store: what it says after `setOpen` is whether the
  // change took (a disabled or controlled submenu refuses it)
  const submenuStore = useSubmenuStore()
  const onOpenChange = useStableCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    return submenuStore.select('open')
  })
  const onHighlight = useStableCallback(() => {
    parentStore.setHighlightedId(storeId, 'pointer')
  })

  const [controller] = React.useState(
    () =>
      new SubmenuController({
        settings,
        aimGuard,
        suppressAutoOpen: suppressAutoOpenRef,
        onOpenChange,
        onHighlight,
      }),
  )

  useIsoLayoutEffect(() => {
    controller.configure(settings)
  }, [controller, settings])

  React.useEffect(() => () => controller.dispose(), [controller])

  useIsoLayoutEffect(() => {
    controller.send({ type: 'open.change', open })
  }, [controller, open])

  // A hidden trigger's popup would render without its anchor
  // biome-ignore lint/correctness/useExhaustiveDependencies(open): a submenu opened while its trigger is hidden closes again
  React.useEffect(() => {
    if (!visible) controller.send({ type: 'hide' })
  }, [controller, visible, open])

  React.useEffect(() => {
    controller.send({
      type: 'highlight',
      highlighted,
      keyboard: parentStore.state.highlightSource === 'keyboard',
    })
  }, [controller, highlighted, parentStore])

  // The trigger's menu closing (Escape, an outside press) cancels a pending
  // open, which would otherwise open the submenu as the menu animates out
  React.useEffect(
    () =>
      parentStore.observe('open', (parentOpen) => {
        if (!parentOpen) controller.send({ type: 'parent.close' })
      }),
    [controller, parentStore],
  )

  React.useEffect(() => {
    if (!open) return
    const contentEl = contentRef.current
    if (!contentEl) return

    const onPointer = () => controller.send({ type: 'pointer.enterPopup' })
    contentEl.addEventListener('pointerenter', onPointer)
    contentEl.addEventListener('pointermove', onPointer, { passive: true })
    return () => {
      contentEl.removeEventListener('pointerenter', onPointer)
      contentEl.removeEventListener('pointermove', onPointer)
    }
  }, [controller, open, contentRef])

  // ArrowRight / Ctrl+L on the trigger (the parent store calls this): open,
  // and move focus into the submenu
  React.useEffect(() => {
    return parentStore.registerSubmenuOpen(storeId, () => {
      controller.send({ type: 'key' })
      // A disabled or controlled submenu may stay closed
      if (!submenuStore.select('open')) return
      focusOwnerStore.setOwnerId(childSurfaceId)
      // Auto-focus after DOM is ready
      requestAnimationFrame(() => {
        const input = contentRef.current?.querySelector('input')
        const list = contentRef.current?.querySelector('[role="listbox"]')
        const focusTarget = input ?? list
        if (focusTarget && focusTarget instanceof HTMLElement) {
          focusTarget.focus()
        }
      })
    })
  }, [
    controller,
    storeId,
    parentStore,
    submenuStore,
    focusOwnerStore,
    childSurfaceId,
    contentRef,
  ])

  // Another row of the parent menu took the highlight
  React.useEffect(() => {
    return parentStore.registerSubmenuClose(storeId, () =>
      controller.send({ type: 'sibling.highlight' }),
    )
  }, [controller, storeId, parentStore])

  return controller
}
