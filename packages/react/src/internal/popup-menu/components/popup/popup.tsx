'use client'

import { Popover, type PopoverPopupProps } from '@base-ui/react/popover'
import * as React from 'react'
import { useMaybeComboboxContext } from '../../../../combobox/contexts/combobox-context.js'
import type { ComponentRenderFn } from '../../../../utils/types.js'
import { POINTER_EVENT_DEBOUNCE_MS } from '../../constants.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useOpenChain } from '../../contexts/open-chain-context.js'
import { useMaybePopupMenuContext } from '../../contexts/popup-menu-context.js'
import { PopupSurfaceIdContext } from '../../contexts/popup-surface-id-context.js'
import { useMaybeSubmenuContext } from '../../contexts/submenu-context.js'
import {
  ROOT_SUBPAGE_ID,
  SubpageStackContext,
} from '../../contexts/subpage-stack-context.js'
import {
  DataPopupContext,
  type DataSurfaceContextValue,
} from '../../deep-search/context.js'
import { DataSubpagesContent } from '../../deep-search/data-subpages.js'
import { useAimGuard } from '../../hooks/use-aim-guard.js'
import { PopupMenuPopupDataAttributes } from './popup.data-attrs.js'

const SUBPAGE_NAVIGATING_MS = 140

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
   * Active subpage ID, or null when only the root page is open.
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

  // Get aim guard to clear it when pointer enters submenu
  const { clearAimGuard, aimGuardActiveRef, guardedSubmenuSurfaceIdRef } =
    useAimGuard()

  // Get focus owner store for transferring ownership
  const focusOwnerStore = useFocusOwner()

  // Get open chain store for tracking submenu chain
  const openChainStore = useOpenChain()

  // Get popup menu context for depth
  const popupMenuContext = useMaybePopupMenuContext()
  const depth = popupMenuContext?.depth ?? 0

  // Get combobox context to detect if we're inside a combobox and for layout
  const comboboxContext = useMaybeComboboxContext()

  // Generate surfaceId for root menus, use submenu context for submenus
  const generatedSurfaceId = React.useId()
  const surfaceId = submenuContext?.childSurfaceId ?? generatedSurfaceId

  // Subpage stack state (per popup instance)
  const [subpageStack, setSubpageStack] = React.useState<string[]>([
    ROOT_SUBPAGE_ID,
  ])
  const [dataSurfaceContext, setDataSurfaceContext] =
    React.useState<DataSurfaceContextValue | null>(null)
  const subpageStackRef = React.useRef(subpageStack)
  React.useEffect(() => {
    subpageStackRef.current = subpageStack
  }, [subpageStack])

  const subpagesRef = React.useRef<
    Map<string, { surfaceId: string; closeRootOnEsc: boolean }>
  >(new Map())
  const [, setSubpageRegistryVersion] = React.useState(0)
  const [isSubpageNavigating, setIsSubpageNavigating] = React.useState(false)
  const subpageNavigatingTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null)

  const clearSubpageNavigatingTimer = React.useCallback(() => {
    if (subpageNavigatingTimerRef.current !== null) {
      clearTimeout(subpageNavigatingTimerRef.current)
      subpageNavigatingTimerRef.current = null
    }
  }, [])

  const beginSubpageNavigation = React.useCallback(() => {
    setIsSubpageNavigating(true)
    clearSubpageNavigatingTimer()
    subpageNavigatingTimerRef.current = setTimeout(() => {
      subpageNavigatingTimerRef.current = null
      setIsSubpageNavigating(false)
    }, SUBPAGE_NAVIGATING_MS)
  }, [clearSubpageNavigatingTimer])

  React.useEffect(
    () => clearSubpageNavigatingTimer,
    [clearSubpageNavigatingTimer],
  )

  React.useEffect(() => {
    subpagesRef.current.set(ROOT_SUBPAGE_ID, {
      surfaceId,
      closeRootOnEsc: true,
    })
    setSubpageRegistryVersion((v) => v + 1)
    return () => {
      subpagesRef.current.delete(ROOT_SUBPAGE_ID)
      setSubpageRegistryVersion((v) => v + 1)
    }
  }, [surfaceId])

  const registerPage = React.useCallback(
    (registration: {
      pageId: string
      surfaceId: string
      closeRootOnEsc: boolean
    }) => {
      subpagesRef.current.set(registration.pageId, {
        surfaceId: registration.surfaceId,
        closeRootOnEsc: registration.closeRootOnEsc,
      })
      setSubpageRegistryVersion((v) => v + 1)

      return () => {
        subpagesRef.current.delete(registration.pageId)
        setSubpageRegistryVersion((v) => v + 1)

        setSubpageStack((prev) => {
          if (!prev.includes(registration.pageId)) {
            return prev
          }
          const next = prev.filter((id) => id !== registration.pageId)
          return next.length > 0 ? next : [ROOT_SUBPAGE_ID]
        })
      }
    },
    [],
  )

  const openPage = React.useCallback(
    (pageId: string) => {
      if (!subpagesRef.current.has(pageId)) {
        return false
      }

      const currentStack = subpageStackRef.current
      const currentPageId = currentStack[currentStack.length - 1]
      if (currentPageId === pageId) {
        return false
      }

      setSubpageStack((prev) => [...prev, pageId])
      beginSubpageNavigation()
      return true
    },
    [beginSubpageNavigation],
  )

  const goBack = React.useCallback(() => {
    const currentStack = subpageStackRef.current
    if (currentStack.length <= 1) {
      return false
    }

    setSubpageStack((prev) => prev.slice(0, -1))
    beginSubpageNavigation()
    return true
  }, [beginSubpageNavigation])

  const getSurfaceId = React.useCallback(
    (pageId: string) => subpagesRef.current.get(pageId)?.surfaceId ?? null,
    [],
  )

  const resetSubpageNavigationState = React.useCallback(() => {
    setSubpageStack([ROOT_SUBPAGE_ID])
    setIsSubpageNavigating(false)
    clearSubpageNavigatingTimer()
  }, [clearSubpageNavigatingTimer])

  React.useEffect(() => {
    const store = popupMenuContext?.store
    if (!store) {
      return
    }

    const previous = store.context.onPopupCloseComplete
    const handlePopupCloseComplete = () => {
      previous?.()
      resetSubpageNavigationState()
    }

    store.context.onPopupCloseComplete = handlePopupCloseComplete

    return () => {
      if (store.context.onPopupCloseComplete === handlePopupCloseComplete) {
        store.context.onPopupCloseComplete = previous
      }
      clearSubpageNavigatingTimer()
    }
  }, [
    popupMenuContext?.store,
    resetSubpageNavigationState,
    clearSubpageNavigatingTimer,
  ])

  const activePageId = subpageStack[subpageStack.length - 1] ?? ROOT_SUBPAGE_ID
  const activePageRegistration = subpagesRef.current.get(activePageId)
  const activeSurfaceId = activePageRegistration?.surfaceId ?? surfaceId
  const shouldCloseRootOnEsc = activePageRegistration?.closeRootOnEsc ?? true
  const canGoBack = subpageStack.length > 1
  const openSubpageIds = React.useMemo(
    () => subpageStack.filter((pageId) => pageId !== ROOT_SUBPAGE_ID),
    [subpageStack],
  )
  const subpageId = openSubpageIds[openSubpageIds.length - 1] ?? null
  const hasOpenSubpage = subpageId !== null

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
  const hasOpenSubmenu = openChainStore.useState('hasOpenSubmenu', depth)

  // Local ref for the popup element
  const popupRef = React.useRef<HTMLDivElement>(null)

  // Combine refs
  const combinedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      // Update local ref
      popupRef.current = node

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
    [forwardedRef, submenuContext],
  )

  // Clear aim guard when pointer moves inside this submenu popup
  // Only clear if aim guard is actually active AND this is the target submenu
  const handlePointerMove = React.useCallback(() => {
    // Only handle if this is a submenu popup (not the root popup) and aim guard is active
    // Also verify this is the specific submenu the user was aiming for
    if (
      submenuContext &&
      aimGuardActiveRef.current &&
      guardedSubmenuSurfaceIdRef.current === surfaceId
    ) {
      clearAimGuard()
    }
  }, [
    submenuContext,
    aimGuardActiveRef,
    guardedSubmenuSurfaceIdRef,
    surfaceId,
    clearAimGuard,
  ])

  React.useEffect(() => {
    if (
      submenuContext?.open !== false ||
      !aimGuardActiveRef.current ||
      guardedSubmenuSurfaceIdRef.current !== surfaceId
    ) {
      return
    }

    clearAimGuard()
  }, [
    submenuContext?.open,
    aimGuardActiveRef,
    guardedSubmenuSurfaceIdRef,
    surfaceId,
    clearAimGuard,
  ])

  React.useEffect(() => {
    return () => {
      if (
        aimGuardActiveRef.current &&
        guardedSubmenuSurfaceIdRef.current === surfaceId
      ) {
        clearAimGuard()
      }
    }
  }, [aimGuardActiveRef, guardedSubmenuSurfaceIdRef, surfaceId, clearAimGuard])

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

      // Check if the target is inside a nested submenu popup
      // If so, don't claim ownership - let the nested popup handle it
      const targetElement =
        target instanceof Element ? target : target.parentElement
      if (targetElement) {
        // Find the closest popup ancestor of the target
        const closestPopup = targetElement.closest('[data-base-ui-focusable]')
        // If the closest popup is not this popup, don't claim ownership
        if (closestPopup && closestPopup !== popupRef.current) {
          return
        }
      }

      // Only claim ownership if we're not already the owner
      if (focusOwnerStore.state.ownerId !== submenuContext.childSurfaceId) {
        focusOwnerStore.setOwnerId(submenuContext.childSurfaceId)
      }
    },
    [submenuContext, focusOwnerStore],
  )

  // Disable Base UI's auto-focus behavior for:
  // - Submenus: Focus is managed by our FocusOwner system
  // - Combobox: Focus should stay on the input element (which is outside the popup)
  const initialFocus = submenuContext || comboboxContext ? false : undefined

  // Disable returning focus to trigger when popup closes for:
  // - Submenus: Focus is managed by our FocusOwner system (we transfer to parent surface's input/list)
  // - Combobox: When clicking outside, we want focus to go to whatever was clicked, not back to input
  const finalFocus = submenuContext || comboboxContext ? false : undefined

  // Add data-input-embedded attribute when layout is input-embedded
  const isInputEmbedded = comboboxContext?.layout === 'input-embedded'

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

  const subpageStackContextValue = React.useMemo(
    () => ({
      activePageId,
      activeSurfaceId,
      canGoBack,
      shouldCloseRootOnEsc,
      stack: subpageStack,
      registerPage,
      openPage,
      goBack,
      getSurfaceId,
    }),
    [
      activePageId,
      activeSurfaceId,
      canGoBack,
      shouldCloseRootOnEsc,
      subpageStack,
      registerPage,
      openPage,
      goBack,
      getSurfaceId,
    ],
  )

  const dataPopupContextValue = React.useMemo(
    () => ({
      dataSurfaceContext,
      setDataSurfaceContext,
    }),
    [dataSurfaceContext],
  )

  return (
    <PopupSurfaceIdContext.Provider value={surfaceId}>
      <SubpageStackContext.Provider value={subpageStackContextValue}>
        <DataPopupContext.Provider value={dataPopupContextValue}>
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
            onPointerMove={(event) => {
              handlePointerMove()
              handleFocusTransferOnMove(event)
              rest.onPointerMove?.(event)
            }}
            {...rest}
          >
            {children}
            <DataSubpagesContent />
          </Popover.Popup>
        </DataPopupContext.Provider>
      </SubpageStackContext.Provider>
    </PopupSurfaceIdContext.Provider>
  )
})

export namespace PopupMenuPopup {
  export type Props = PopupMenuPopupProps
  export type State = PopupMenuPopupState
}
