'use client'

import { Popover, type PopoverRootProps } from '@base-ui/react/popover'
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect'
import { useStableCallback } from '@base-ui/utils/useStableCallback'
import { decideOpenChange, type OpenRequestResult } from '@bazza-ui/menu-core'
import * as React from 'react'
import { REASONS } from '../../../../utils/events/index.js'
import {
  ListboxContextProvider,
  ListboxStore,
  useMaybeListboxContext,
  useSurfaceContext,
  type VirtualItem,
} from '../../../listbox/index.js'
import {
  getCloseCause,
  popupActionsOf,
  requestStoreOpen,
} from '../../../listbox/store/ListboxStore.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useMenuTree } from '../../contexts/menu-tree-context.js'
import { useOpenChain } from '../../contexts/open-chain-context.js'
import {
  PopupMenuContext,
  useMaybePopupMenuContext,
} from '../../contexts/popup-menu-context.js'
import {
  type SubmenuContextValue,
  SubmenuHandle,
} from '../../contexts/submenu-context.js'
import {
  MenuSurfaceTier,
  SurfaceTierContext,
  useMaybeMenuSurfaceTier,
} from '../../contexts/surface-tier-context.js'
import type {
  HighlightChangeEventDetails,
  PopupMenuHighlightChangeHandler,
  PopupMenuOpenChangeEventDetails,
  PopupMenuOpenChangeReason,
} from '../../events.js'
import type { PopupMenuRootActions } from '../../hooks/use-popup-menu-root.js'
import { mirrorToBaseUI } from '../../store/MenuTreeStore.js'

export interface PopupMenuSubmenuRootProps
  extends Omit<
    PopoverRootProps,
    'open' | 'onOpenChange' | 'defaultOpen' | 'actionsRef'
  > {
  /**
   * Whether the submenu is open.
   * Use for controlled mode.
   */
  open?: boolean

  /**
   * Callback when the open state changes, for every change: a hover or an aim
   * toward the popup (`trigger-hover`), a key (`list-navigation`,
   * `escape-key`), another row's highlight (`sibling-open`), the whole menu
   * closing, or a press on the trigger. The second parameter contains event
   * details including the reason; `eventDetails.cancel()` keeps the submenu
   * as it is. With `open` controlled, apply the change to open it.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: PopupMenuOpenChangeEventDetails,
  ) => void

  /**
   * Whether the submenu is initially open.
   * Use for uncontrolled mode.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Whether pressing Escape in this submenu closes the entire menu from the root.
   * When true (default), Escape closes the entire menu tree.
   * When false, Escape only closes this submenu and moves focus to the parent.
   * @default true
   */
  closeRootOnEsc?: boolean

  /**
   * Whether virtualization mode is enabled for this submenu.
   * When true, items should provide an explicit `index` prop and
   * the `items` prop should be provided for navigation to work correctly.
   * @default false
   */
  virtualized?: boolean

  /**
   * Pre-registered items for virtualization.
   * When provided with `virtualized={true}`, this allows navigation to work
   * for items that aren't currently mounted in the DOM.
   */
  items?: VirtualItem[]

  /**
   * Callback when the highlighted item changes. `id` is first; `node` is the
   * resolved menu node enrichment and may be null.
   * Useful for synchronizing with a virtualizer (e.g., scrollToIndex).
   */
  onHighlightChange?: PopupMenuHighlightChangeHandler<HighlightChangeEventDetails>

  /**
   * Event handler called after any open/close animations have completed.
   * When `clearSearchOnClose="after-exit"` is set on Surface, the search
   * will be cleared before this callback is invoked.
   */
  onOpenChangeComplete?: (open: boolean) => void

  /**
   * Whether this submenu should ignore user interaction.
   * Also inherits disabled state from its parent menu.
   * @default false
   */
  disabled?: boolean

  /**
   * A ref to imperative actions.
   * - `close`: closes the submenu imperatively.
   * - `unmount`: unmounts the popup imperatively (when keep-mounted mode is enabled).
   * - `setDisabled`: enables/disables the submenu imperatively.
   */
  actionsRef?: React.RefObject<PopupMenuSubmenuRoot.Actions | null>

  children: React.ReactNode
}

/**
 * Groups all parts of a submenu.
 * Manages open state and provides context to children.
 * Creates its own ListboxStore independent from the parent menu.
 * Doesn't render its own HTML element.
 */
export function PopupMenuSubmenuRoot(props: PopupMenuSubmenuRootProps) {
  const {
    open: openProp,
    onOpenChange,
    defaultOpen = false,
    closeRootOnEsc = true,
    virtualized = false,
    items: itemsProp,
    onHighlightChange,
    onOpenChangeComplete: onOpenChangeCompleteProp,
    disabled: disabledProp = false,
    actionsRef,
    children,
    ...rest
  } = props

  const parentListboxContext = useMaybeListboxContext()
  const parentPopupMenuContext = useMaybePopupMenuContext()
  const parentDepth = parentListboxContext?.depth ?? 0
  const parentCloseAll = parentListboxContext?.closeAll
  const parentRegisterSurface = parentListboxContext?.registerSurface
  const menuTree = useMenuTree()
  const menuTreeResolver = menuTree.resolver

  const handleHighlightChange = React.useCallback(
    (
      id: string | null,
      index: number,
      eventDetails: HighlightChangeEventDetails,
    ) => {
      onHighlightChange?.(
        id,
        id === null ? null : (menuTreeResolver.getNodeById(id) ?? null),
        index,
        eventDetails,
      )
    },
    [menuTreeResolver, onHighlightChange],
  )

  // Get parent surface ID for keyboard navigation back
  const { surfaceId: parentSurfaceId } = useSurfaceContext()

  // Generate unique surface ID for this submenu
  const childSurfaceId = React.useId()

  // The consumer hears every change the store is asked for, as a root's
  // does (`changeOpen`): a canceled change, or one to a controlled `open`,
  // leaves the store as it is.
  const notifyOpenChange = useStableCallback(
    (nextOpen: boolean, eventDetails: PopupMenuOpenChangeEventDetails) => {
      onOpenChange?.(nextOpen, eventDetails)
    },
  )

  // Create the store instance for this submenu
  const store = ListboxStore.useStore(
    undefined,
    { open: defaultOpen },
    { onOpenChange: notifyOpenChange },
  )

  const [imperativeDisabled, setImperativeDisabled] = React.useState(false)
  const disabled =
    (parentPopupMenuContext?.disabled ?? false) ||
    disabledProp ||
    imperativeDisabled

  const setDisabled = React.useCallback((nextDisabled: boolean) => {
    setImperativeDisabled(nextDisabled)
  }, [])

  // Every open change of the submenu: the close policy decides, then the
  // store takes it (and tells the consumer, unless there's nothing to
  // change). Returns what became of it. Stable, so the submenu's tier never
  // changes; it reads the latest `disabled`.
  const requestOpen = useStableCallback(
    (
      newOpen: boolean,
      reason: PopupMenuOpenChangeReason,
      event: Event | undefined,
      facts?: {
        outsideTree: boolean
        outsidePress: object | undefined
        exempt: boolean
      },
    ): OpenRequestResult => {
      const decision = decideOpenChange({
        open: newOpen,
        reason,
        event,
        level: 'submenu',
        disabled,
        // Escape is routed where the key is handled (the listbox): one that
        // reaches the submenu closes only it, whatever `closeRootOnEsc` says
        closeRootOnEsc: false,
        outsideTree: facts?.outsideTree,
        outsidePress: facts?.outsidePress,
        exempt: facts?.exempt,
      })
      if (decision.type !== 'allow') return 'refused'
      return requestStoreOpen(
        store,
        newOpen,
        decision.reason,
        decision.event as Event | undefined,
      )
    },
  )
  const setOpen = useStableCallback(
    (
      newOpen: boolean,
      reason: PopupMenuOpenChangeReason = REASONS.none,
      event?: Event,
    ) => {
      requestOpen(newOpen, reason, event)
    },
  )

  // Sync controlled open prop to store
  store.useControlledProp('openProp', openProp)

  // Get open chain store
  const openChainStore = useOpenChain()

  // Get open state from store for Popover
  const open = store.useState('open')

  // Track this submenu in the open chain
  React.useEffect(() => {
    if (open) {
      openChainStore.open(childSurfaceId)
    } else {
      openChainStore.close(childSurfaceId)
    }
  }, [open, childSurfaceId, openChainStore])

  // Base UI's own changes (a press on the trigger, its dismissal) go the same
  // way; a consumer's `cancel()` cancels Base UI's details too. Its
  // dismissal from outside the tree's popups is the root's to decide when
  // the root hears it too (an outside press, or the focus-out one causes):
  // when the root closes, so does the submenu.
  const elements = menuTree.elements
  const handlePopoverOpenChange = React.useCallback(
    (newOpen: boolean, eventDetails: Popover.Root.ChangeEventDetails) => {
      const { reason, event } = eventDetails
      const target =
        reason === REASONS.focusOut
          ? (event as FocusEvent | undefined)?.relatedTarget
          : reason === REASONS.outsidePress
            ? event?.target
            : undefined
      const outsideTree =
        (reason === REASONS.focusOut || reason === REASONS.outsidePress) &&
        !(
          target instanceof Node &&
          elements.owns(target) &&
          !elements.inBackdrop(target)
        )
      const result = requestOpen(newOpen, reason, event, {
        outsideTree,
        outsidePress: elements.outsidePressThisTask ?? undefined,
        // A press on, or focus moving to, an element the menu exempts
        exempt: target instanceof Node && elements.isExempt(target),
      })
      mirrorToBaseUI(result, eventDetails)
    },
    [requestOpen, elements],
  )

  // Handle animation complete - clear search and hide input if clearSearchOnClose is 'after-exit'
  const handleOpenChangeComplete = React.useCallback(
    (nextOpen: boolean) => {
      // Clear search and hide input after exit animation completes
      if (!nextOpen && store.context.clearSearchOnClose === 'after-exit') {
        store.clearSearch()
        store.setInputActive(false)
      }
      // Reset row width measurements after close animation completes
      if (!nextOpen) {
        store.clearHighlight()
        store.context.onCloseComplete?.()
        store.context.onPopupCloseComplete?.()
      }
      // Call user's callback
      onOpenChangeCompleteProp?.(nextOpen)
    },
    [store, onOpenChangeCompleteProp],
  )

  // This submenu's own submenus (and subpages), closed when it closes;
  // they register here, as the root's register with the root
  type SurfaceEntry = { setOpen: SubmenuContextValue['setOpen'] }
  const childSurfacesRef = React.useRef<Set<SurfaceEntry>>(new Set())
  const registerSurface = React.useCallback(
    (_depth: number, childSetOpen: SurfaceEntry['setOpen']) => {
      const entry: SurfaceEntry = { setOpen: childSetOpen }
      childSurfacesRef.current.add(entry)
      return () => {
        childSurfacesRef.current.delete(entry)
      }
    },
    [],
  )

  // Register this submenu with the root, or the submenu it's in, which
  // close it when they close, passing their cause. From a layout effect, so
  // a close a layout effect makes reaches it.
  const depth = parentDepth + 1
  useIsoLayoutEffect(() => {
    if (!parentRegisterSurface) return
    return parentRegisterSurface(depth, setOpen)
  }, [parentRegisterSurface, depth, setOpen])

  // The Base UI root's actions, which the popup also uses to complete a close
  // in the frame it closes when nothing animates (`useCloseInOneFrame`).
  const popoverActionsRef = popupActionsOf(store)

  React.useImperativeHandle(
    actionsRef,
    () => ({
      close: () => {
        popoverActionsRef.current?.close()
      },
      unmount: () => {
        popoverActionsRef.current?.unmount()
      },
      setDisabled,
    }),
    [setDisabled, popoverActionsRef],
  )

  // The submenu surface's tier, which its trigger, positioner, popup and
  // surface read the submenu from (`useSubmenuContext`).
  const parentTier = useMaybeMenuSurfaceTier()
  // biome-ignore lint/correctness/useExhaustiveDependencies(closeRootOnEsc): it seeds the handle; later values are synced into the handle's state below
  const submenu = React.useMemo(
    () =>
      new SubmenuHandle(
        store,
        setOpen,
        requestOpen,
        parentSurfaceId,
        childSurfaceId,
        closeRootOnEsc,
      ),
    [store, setOpen, requestOpen, parentSurfaceId, childSurfaceId],
  )
  submenu.useSyncedValue('closeRootOnEsc', closeRootOnEsc)

  // When this submenu's `open` goes false, whatever closed it (and whenever:
  // a controlled `open` may follow later), its own open submenus close with
  // the cause of the close (`getCloseCause`), as the root's do with the
  // root's; a close its consumer canceled leaves them. Then, if it owned
  // focus: a key that closed only this submenu (ArrowLeft, Ctrl+H, Escape)
  // hands focus back to the parent's list, which is still open, and the
  // trigger it stays on doesn't reopen it, unless focus already moved to an
  // element outside the tree. Any other close only drops its ownership.
  // Subscribed in a layout effect, before a close a layout effect makes.
  const focusOwnerStore = useFocusOwner()
  const parentStore = parentListboxContext?.store
  useIsoLayoutEffect(
    () =>
      store.observe('open', (isOpen, wasOpen) => {
        if (isOpen || !wasOpen) return
        const cause = getCloseCause(store)
        for (const child of [...childSurfacesRef.current]) {
          child.setOpen(false, cause?.reason ?? REASONS.none, cause?.event)
        }
        const active = document.activeElement
        const ownsFocus =
          focusOwnerStore.state.ownerId === childSurfaceId ||
          (active !== null && elements.surfaceFor(active) === childSurfaceId)
        if (!ownsFocus) return
        const keyboardClose =
          cause?.reason === REASONS.listNavigation ||
          cause?.reason === REASONS.escapeKey
        const focusStillInMenu =
          active === null ||
          active === active.ownerDocument.body ||
          elements.owns(active)
        if (keyboardClose && parentStore?.select('open') && focusStillInMenu) {
          submenu.closeExplicitly()
          focusOwnerStore.setOwnerId(parentSurfaceId)
        } else if (focusOwnerStore.state.ownerId === childSurfaceId) {
          focusOwnerStore.clearOwner()
        }
      }),
    [
      store,
      focusOwnerStore,
      childSurfaceId,
      parentSurfaceId,
      parentStore,
      elements,
      submenu,
    ],
  )

  const surfaceTier = React.useMemo(
    () => new MenuSurfaceTier(store, parentTier, submenu),
    [store, parentTier, submenu],
  )

  // Memoize listbox wiring config for this submenu
  const virtualization = React.useMemo(() => {
    if (!virtualized && !onHighlightChange) {
      return undefined
    }

    return {
      virtualized,
      items: itemsProp ?? [],
      onHighlightChange: handleHighlightChange,
    }
  }, [virtualized, itemsProp, handleHighlightChange, onHighlightChange])

  // Listbox context value with incremented depth
  // Pass parent's closeAll through unchanged; this submenu's own submenus
  // register with it
  const listboxContextValue = React.useMemo(
    () => ({
      store,
      depth,
      closeAll: parentCloseAll ?? (() => setOpen(false)),
      registerSurface,
      virtualization,
    }),
    [store, depth, parentCloseAll, setOpen, registerSurface, virtualization],
  )

  // PopupMenu context value with incremented depth
  // This is needed for PopupMenuPositioner to get the correct depth
  const popupMenuContextValue = React.useMemo(
    () => ({
      store,
      disabled,
      depth,
      closeAll: parentCloseAll ?? (() => setOpen(false)),
      explicitTabBehavior: parentPopupMenuContext?.explicitTabBehavior ?? false,
      tabWithoutZones: parentPopupMenuContext?.tabWithoutZones ?? 'close',
      externalFocus: parentPopupMenuContext?.externalFocus ?? false,
      inputEmbedded: parentPopupMenuContext?.inputEmbedded ?? false,
      registerSurface,
      virtualization,
      virtualAnchor: parentPopupMenuContext?.virtualAnchor,
      menuType: parentPopupMenuContext?.menuType ?? ('dropdown' as const),
      closeOnOutsidePress:
        parentPopupMenuContext?.closeOnOutsidePress ?? 'pointerdown',
      rangeSelection: parentPopupMenuContext?.rangeSelection ?? true,
      dragSelection: parentPopupMenuContext?.dragSelection ?? false,
      getAriaSelectionText: parentPopupMenuContext?.getAriaSelectionText,
    }),
    [
      store,
      disabled,
      depth,
      parentCloseAll,
      parentPopupMenuContext?.explicitTabBehavior,
      parentPopupMenuContext?.tabWithoutZones,
      parentPopupMenuContext?.externalFocus,
      parentPopupMenuContext?.inputEmbedded,
      registerSurface,
      setOpen,
      virtualization,
      parentPopupMenuContext?.virtualAnchor,
      parentPopupMenuContext?.menuType,
      parentPopupMenuContext?.closeOnOutsidePress,
      parentPopupMenuContext?.rangeSelection,
      parentPopupMenuContext?.dragSelection,
      parentPopupMenuContext?.getAriaSelectionText,
    ],
  )

  return (
    <SurfaceTierContext.Provider value={surfaceTier}>
      <PopupMenuContext.Provider value={popupMenuContextValue}>
        <ListboxContextProvider.Provider value={listboxContextValue}>
          <Popover.Root
            {...rest}
            open={open}
            onOpenChange={handlePopoverOpenChange}
            onOpenChangeComplete={handleOpenChangeComplete}
            actionsRef={popoverActionsRef}
          >
            {children}
          </Popover.Root>
        </ListboxContextProvider.Provider>
      </PopupMenuContext.Provider>
    </SurfaceTierContext.Provider>
  )
}

export namespace PopupMenuSubmenuRoot {
  export interface Props extends PopupMenuSubmenuRootProps {}
  export type ChangeEventDetails = PopupMenuOpenChangeEventDetails
  export type Actions = PopupMenuRootActions
}
