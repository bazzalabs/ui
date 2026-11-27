'use client'

import { Popover, type PopoverPopupProps } from '@base-ui/react/popover'
import * as React from 'react'
import type { ComponentRenderFn } from '../../../../utils/types.js'
import { POINTER_EVENT_DEBOUNCE_MS } from '../../constants.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useMenuTree } from '../../contexts/menu-tree-context.js'
import { useMaybePopupMenuContext } from '../../contexts/popup-menu-context.js'
import { PopupSurfaceIdContext } from '../../contexts/popup-surface-id-context.js'
import { useMaybeSubmenuContext } from '../../contexts/submenu-context.js'
import { SubpageStackContext } from '../../contexts/subpage-stack-context.js'
import {
  DataPopupProvider,
  DataSubpagesContent,
} from '../../data-first/data-subpages.js'
import { useMaybeAimGuard } from '../../hooks/use-aim-guard.js'
import { useMenuElement, usePressClaim } from '../../hooks/use-menu-element.js'
import { useSubpageStackState } from '../../hooks/use-subpage-stack-state.js'
import { getElementRegistry } from '../../store/MenuTreeStore.js'
import { PopupMenuPopupDataAttributes } from './popup.data-attrs.js'

// ============================================================================
// Types
// ============================================================================

export interface PopupMenuPopupState extends Popover.Popup.State {
  /**
   * Whether this popup is a submenu (not the root menu).
   */
  isSubmenu: boolean

  /**
   * Whether any non-root subpage is currently open.
   */
  hasOpenSubpage: boolean

  /**
   * Active subpage ID, or null when the root surface is active.
   */
  subpageId: string | null

  /**
   * Ordered stack of open non-root subpage IDs.
   * For nested subpages this includes each page in open order.
   */
  openSubpageIds: string[]
}

export interface PopupMenuPopupProps
  extends Omit<PopoverPopupProps, 'className' | 'render'> {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component's state.
   */
  className?: string | ((state: PopupMenuPopupState) => string)

  /**
   * Allows replacing the popup element with a custom element.
   * The render state includes popup + subpage navigation state.
   */
  render?:
    | React.ReactElement
    | ComponentRenderFn<React.HTMLAttributes<HTMLElement>, PopupMenuPopupState>
}

// ============================================================================
// Component
// ============================================================================

/**
 * A container for the popup menu contents.
 * Wraps Popover.Popup with:
 * - Aim guard clearing when pointer enters submenu
 * - Focus ownership transfer when pointer enters submenu
 * - Auto-focus disabled for submenus (focus managed by FocusOwner system)
 *
 * Renders a `<div>` element.
 */
export const PopupMenuPopup = React.forwardRef<
  HTMLDivElement,
  PopupMenuPopup.Props
>(function PopupMenuPopup(props, forwardedRef) {
  const {
    children,
    className: classNameProp,
    render: renderProp,
    ...rest
  } = props

  // Get submenu context to set contentRef for aim guard and get childSurfaceId for focus transfer
  const submenuContext = useMaybeSubmenuContext()

  // The tree's aim guard: the pointer over a submenu popup reached it
  const aimGuard = useMaybeAimGuard()

  // Get focus owner store for transferring ownership
  const focusOwnerStore = useFocusOwner()

  // Get the menu tree: its open chain tracks the submenu chain
  const tree = useMenuTree()

  // Get popup menu context for depth
  const popupMenuContext = useMaybePopupMenuContext()
  const depth = popupMenuContext?.depth ?? 0

  // Generate surfaceId for root menus, use submenu context for submenus
  const generatedSurfaceId = React.useId()
  const surfaceId = submenuContext?.childSurfaceId ?? generatedSurfaceId

  const {
    subpageStackContextValue,
    isSubpageNavigating,
    hasOpenSubpage,
    subpageId,
    openSubpageIds,
  } = useSubpageStackState({
    surfaceId,
    store: popupMenuContext?.store ?? null,
  })

  const activeSurfaceId = subpageStackContextValue.activeSurfaceId

  // Track when popup opened to ignore initial pointer events
  // This prevents focus transfer when the popup appears under a stationary cursor
  const openTimeRef = React.useRef<number>(0)

  // Record open time when popup opens
  React.useEffect(() => {
    if (submenuContext?.open) {
      openTimeRef.current = Date.now()
    }
  }, [submenuContext?.open])

  // Subscribe to focus ownership for data-focused attribute
  const isFocused = focusOwnerStore.useState('isOwner', activeSurfaceId)

  // Subscribe to open chain for data-has-open-submenu attribute
  const hasOpenSubmenu = tree.openChain.useState('hasOpenSubmenu', depth)

  // Local ref for the popup element
  const popupRef = React.useRef<HTMLDivElement>(null)

  const registerPopup = useMenuElement('popup', surfaceId)
  const claimPress = usePressClaim(rest.onPointerDownCapture)

  // Combine refs
  const combinedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      // Update local ref
      popupRef.current = node
      registerPopup(node)

      // Update forwarded ref
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }

      // Update submenu context contentRef for aim guard
      if (submenuContext?.contentRef) {
        ;(
          submenuContext.contentRef as React.MutableRefObject<HTMLElement | null>
        ).current = node
      }
    },
    [forwardedRef, submenuContext, registerPopup],
  )

  // Register the root popup element with the store so popup-layer features
  // (e.g. Select's align-item-with-trigger) can measure it. Only the root popup
  // (depth 0) registers; submenu popups must not clobber it.
  React.useEffect(() => {
    if (depth !== 0) {
      return
    }
    popupMenuContext?.store.setPopupRef(popupRef)
  }, [depth, popupMenuContext])

  // The pointer over a submenu popup (or a popup nested in it) reached it:
  // a guard on the way there is released, and its trigger hears of it
  const handlePointerInPopup = React.useCallback(() => {
    if (submenuContext) aimGuard?.pointerInPopup(surfaceId)
  }, [submenuContext, aimGuard, surfaceId])

  // Transfer focus ownership when pointer moves inside this submenu popup
  // We ignore events shortly after open to prevent focus transfer when
  // the popup appears under a stationary cursor
  const handleFocusTransferOnMove = React.useCallback(
    (event: React.PointerEvent) => {
      // Ignore pointer events briefly after popup opens
      // This prevents focus transfer when popup appears under stationary cursor
      const timeSinceOpen = Date.now() - openTimeRef.current
      if (timeSinceOpen < POINTER_EVENT_DEBOUNCE_MS) {
        return
      }

      // Only transfer focus if this is a submenu popup (not the root popup)
      // Use childSurfaceId from SubmenuContext since Popup is outside Surface in the component tree
      if (!submenuContext) {
        return
      }

      // Check if the event target is actually within this popup's DOM
      // This prevents parent popups from claiming ownership when events
      // bubble through React portals from child submenus
      const target = event.target as Node
      if (!popupRef.current?.contains(target)) {
        return
      }

      // A popup of this tree nested inside this one's DOM claims ownership
      // for itself
      if (getElementRegistry(tree).surfaceFor(target) !== surfaceId) {
        return
      }

      // Only claim ownership if we're not already the owner
      if (focusOwnerStore.state.ownerId !== submenuContext.childSurfaceId) {
        focusOwnerStore.setOwnerId(submenuContext.childSurfaceId)
      }
    },
    [submenuContext, focusOwnerStore, tree, surfaceId],
  )

  // Disable Base UI's auto-focus behavior for:
  // - Submenus: Focus is managed by our FocusOwner system
  // - Menus whose focus stays on an element outside the popup (`externalFocus`)
  const externalFocus = popupMenuContext?.externalFocus ?? false
  const initialFocus = submenuContext || externalFocus ? false : undefined

  // Disable returning focus to trigger when popup closes for:
  // - Submenus: Focus is managed by our FocusOwner system (we transfer to parent surface's input/list)
  // - Menus with `externalFocus`: When clicking outside, focus goes to whatever was clicked,
  //   not back to the outside element
  const finalFocus = submenuContext || externalFocus ? false : undefined

  // Add data-input-embedded attribute when the popup embeds an input (`inputEmbedded`)
  const isInputEmbedded = popupMenuContext?.inputEmbedded ?? false

  // Determine if this popup is a submenu (not the root menu)
  const isSubmenu = !!submenuContext

  const toPopupState = React.useCallback(
    (baseState: Popover.Popup.State): PopupMenuPopupState => ({
      ...baseState,
      isSubmenu,
      hasOpenSubpage,
      subpageId,
      openSubpageIds,
    }),
    [hasOpenSubpage, isSubmenu, openSubpageIds, subpageId],
  )

  // Wrap className to include isSubmenu in the state
  const className = React.useMemo(() => {
    if (typeof classNameProp === 'function') {
      return (baseState: Popover.Popup.State) => {
        return classNameProp(toPopupState(baseState))
      }
    }
    return classNameProp
  }, [classNameProp, toPopupState])

  const render = React.useMemo(() => {
    if (typeof renderProp === 'function') {
      return (
        popupProps: React.HTMLAttributes<HTMLElement>,
        baseState: Popover.Popup.State,
      ) => renderProp(popupProps, toPopupState(baseState))
    }

    return renderProp
  }, [renderProp, toPopupState])

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'popup')

  return (
    <PopupSurfaceIdContext.Provider value={surfaceId}>
      <SubpageStackContext.Provider value={subpageStackContextValue}>
        <DataPopupProvider>
          <Popover.Popup
            ref={combinedRef}
            initialFocus={initialFocus}
            finalFocus={finalFocus}
            className={className}
            render={render}
            data-input-embedded={isInputEmbedded ? '' : undefined}
            {...(slotAttr ? { [slotAttr]: '' } : {})}
            {...{
              [PopupMenuPopupDataAttributes.focused]: isFocused
                ? ''
                : undefined,
              [PopupMenuPopupDataAttributes.hasOpenSubmenu]: hasOpenSubmenu
                ? ''
                : undefined,
              [PopupMenuPopupDataAttributes.submenu]: isSubmenu
                ? ''
                : undefined,
              [PopupMenuPopupDataAttributes.navigating]: isSubpageNavigating
                ? ''
                : undefined,
            }}
            {...rest}
            // After the consumer's props, so theirs can't replace these: the
            // engine's part runs first, as `onPointerMove` always has, then
            // the consumer's handler
            onPointerEnter={(event) => {
              handlePointerInPopup()
              rest.onPointerEnter?.(event)
            }}
            onPointerMove={(event) => {
              handlePointerInPopup()
              handleFocusTransferOnMove(event)
              rest.onPointerMove?.(event)
            }}
            onPointerDownCapture={claimPress}
          >
            {children}
            <DataSubpagesContent />
          </Popover.Popup>
        </DataPopupProvider>
      </SubpageStackContext.Provider>
    </PopupSurfaceIdContext.Provider>
  )
})

export namespace PopupMenuPopup {
  export type Props = PopupMenuPopupProps
  export type State = PopupMenuPopupState
}
