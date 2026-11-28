'use client'

import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect'
import { useStableCallback } from '@base-ui/utils/useStableCallback'
import {
  type AimGuardTrigger,
  SubmenuController,
  type SubmenuOpenChangeReason,
  type SubmenuSettings,
} from '@bazza-ui/menu-core'
import * as React from 'react'
import {
  isOpenPending,
  type ListboxStore,
} from '../../../listbox/store/ListboxStore.js'
import type { SubmenuHandle } from '../../contexts/submenu-context.js'
import { useMaybeMenuSurfaceTier } from '../../contexts/surface-tier-context.js'
import type { FocusOwnerStore } from '../../store/FocusOwnerStore.js'

/** The submenu the trigger opens, from its surface tier. */
function useSubmenuHandle(): SubmenuHandle {
  const handle = useMaybeMenuSurfaceTier()?.submenu
  if (!handle) {
    throw new Error('SubmenuTrigger must be used within a Submenu')
  }
  return handle
}

const selectOpen = (state: { open: boolean }) => state.open
const selectSuppression = (state: {
  suppression: { readonly suppress: boolean } | null
}) => state.suppression

export interface SubmenuControllerParams {
  settings: SubmenuSettings
  aimGuard: AimGuardTrigger
  /** The store of the menu the trigger is in. */
  parentStore: ListboxStore
  /** The trigger's id in `parentStore`. */
  storeId: string
  highlighted: boolean
  visible: boolean
  open: boolean
  contentRef: React.RefObject<HTMLElement | null>
  focusOwnerStore: FocusOwnerStore
  childSurfaceId: string
}

/**
 * A submenu trigger's `SubmenuController`, bound to its menus: it asks the
 * submenu to open and close, highlights the trigger and moves focus into the
 * submenu as the controller decides, and sends it what happens outside the
 * trigger's own pointer events (its highlight, its submenu store's open
 * state, the pointer over its popup, a key, an explicit close, a sibling's
 * highlight, its menu closing). The trigger sends its pointer events itself.
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
    contentRef,
    focusOwnerStore,
    childSurfaceId,
  } = params

  // Each decision goes to the submenu with its reason, past the close policy
  // and the consumer's `onOpenChange`; what became of it is the controller's
  // to read. Whether the submenu is open is its store's, which it hears below.
  const submenu = useSubmenuHandle()
  const submenuStore = submenu.store
  const onOpenChange = useStableCallback(
    (nextOpen: boolean, reason: SubmenuOpenChangeReason) =>
      submenu.request(nextOpen, reason),
  )
  const onHighlight = useStableCallback(() => {
    parentStore.setHighlightedId(storeId, 'pointer')
  })
  // A key asked to open the submenu, and it's open: move focus in
  const onFocus = useStableCallback(() => {
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

  const [controller] = React.useState(
    () =>
      new SubmenuController({
        settings,
        aimGuard,
        onOpenChange,
        isOpenPending: () => isOpenPending(submenuStore),
        onFocus,
        onHighlight,
      }),
  )

  useIsoLayoutEffect(() => {
    controller.configure(settings)
  }, [controller, settings])

  React.useEffect(() => () => controller.dispose(), [controller])

  // The submenu store's open state, as it changes (a request, Base UI, a
  // controlled `open` following), before React renders it
  useIsoLayoutEffect(
    () =>
      submenuStore.observe(selectOpen, (isOpen) =>
        controller.send({ type: 'open.change', open: isOpen }),
      ),
    [controller, submenuStore],
  )

  // An explicit close of the submenu (a key, Tab), from its root or
  // surface, or a write of its `suppressAutoOpenRef`: taken as it comes, or
  // when the trigger mounts if it came before
  useIsoLayoutEffect(
    () =>
      submenu.observe(selectSuppression, (suppression) => {
        if (!suppression) return
        controller.send({
          type: suppression.suppress ? 'close.explicit' : 'suppression.clear',
        })
        submenu.set('suppression', null)
      }),
    [controller, submenu],
  )

  // The controller's suppression, for the submenu's `suppressAutoOpenRef`
  useIsoLayoutEffect(() => {
    const mirror = () =>
      submenu.set('suppressed', controller.getSnapshot().suppressed)
    mirror()
    return controller.subscribe(mirror)
  }, [controller, submenu])

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

  // The pointer over the submenu's popup, as the popup reports it
  React.useEffect(
    () =>
      aimGuard.onPopupPointer(() =>
        controller.send({ type: 'pointer.enterPopup' }),
      ),
    [controller, aimGuard],
  )

  // ArrowRight / Ctrl+L on the trigger (the parent store calls this): open,
  // and move focus into the submenu once it is
  React.useEffect(() => {
    return parentStore.registerSubmenuOpen(storeId, () =>
      controller.send({ type: 'key' }),
    )
  }, [controller, storeId, parentStore])

  // Another row of the parent menu took the highlight
  React.useEffect(() => {
    return parentStore.registerSubmenuClose(storeId, () =>
      controller.send({ type: 'sibling.highlight' }),
    )
  }, [controller, storeId, parentStore])

  return controller
}
