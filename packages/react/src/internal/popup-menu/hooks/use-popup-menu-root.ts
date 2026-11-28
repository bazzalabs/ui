'use client'

import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect'
import { useStableCallback } from '@base-ui/utils/useStableCallback'
import { decideOpenChange, type OpenRequestResult } from '@bazza-ui/menu-core'
import * as React from 'react'
import type { ChangeEventDetails } from '../../../utils/events/index.js'
import { REASONS } from '../../../utils/events/index.js'
import { ensureInputModalityTracking } from '../../../utils/input-modality.js'
import type { ListboxStore, VirtualItem } from '../../listbox/index.js'
import {
  type CloseCause,
  getCloseCause,
} from '../../listbox/store/ListboxStore.js'
import { useMaybeMenuTree } from '../contexts/menu-tree-context.js'
import type { VirtualizationConfig } from '../contexts/popup-menu-context.js'
import type {
  HighlightChangeEventDetails,
  PopupMenuHighlightChangeHandler,
  PopupMenuOpenChangeReason,
} from '../events.js'
import type { MenuTreeResolver } from '../menu-tree/resolver.js'
import { createMenuTreeResolver } from '../menu-tree/resolver.js'
import type { GetResolvedIdFn, PopupMenuIdScope } from '../menu-tree/types.js'
import type { FocusOwnerStore } from '../store/FocusOwnerStore.js'
import {
  getElementRegistry,
  MenuTreeStore,
  type RootAskOptions,
} from '../store/MenuTreeStore.js'
import type { OpenChainStore } from '../store/OpenChainStore.js'

// ============================================================================
// Types
// ============================================================================

export interface UsePopupMenuRootParams {
  /**
   * Computes canonical Resolved IDs for data-first content from the Unresolved Menu Node (definitional facts only).
   * @default explicit `def.id` verbatim, else the joined definition path
   * Read once when the menu root mounts — later changes have no effect.
   */
  getResolvedId?: GetResolvedIdFn
  /** Definition Key uniqueness scope. Read once when the menu root mounts. */
  idScope?: PopupMenuIdScope
  /**
   * Callback when the open state changes.
   * The second parameter contains event details including the reason for the change.
   */
  onOpenChange?: (
    open: boolean,
    eventDetails: ChangeEventDetails<string>,
  ) => void

  /**
   * Whether the menu is initially open.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Whether virtualization mode is enabled.
   * @default false
   */
  virtualized?: boolean

  /**
   * Pre-registered items for virtualization.
   */
  items?: VirtualItem[]

  /**
   * Callback when the highlighted item changes. `id` is first; `node` is the
   * resolved menu node enrichment and may be null.
   * The fourth parameter contains event details including the reason for the change.
   */
  onHighlightChange?: PopupMenuHighlightChangeHandler<HighlightChangeEventDetails>

  /**
   * When to close the menu on outside interactions.
   * - 'pointerdown': Close immediately when pointer is pressed outside (default)
   * - 'click': Close when a full click (pointerdown + pointerup) occurs outside
   * @default 'pointerdown'
   */
  closeOnOutsidePress?: 'click' | 'pointerdown'

  /**
   * Elements outside the menu that don't dismiss it (e.g. a suggestion menu's
   * host input): pressing one, or moving focus from the menu to one, is not an
   * outside press or a focus-out. Read when the event happens, so the returned
   * elements may change over time.
   */
  getDismissExemptElements?: () => ReadonlyArray<Element | null | undefined>

  /**
   * Whether the menu should ignore user interaction.
   * Can be controlled declaratively via this prop, or imperatively via actionsRef.setDisabled().
   * @default false
   */
  disabled?: boolean

  /**
   * Initial disabled state for imperative usage.
   * Ignored when `disabled` prop is true.
   * @default false
   */
  defaultDisabled?: boolean
}

export interface PopupMenuRootActions {
  /** Close the menu tree imperatively. */
  close: () => void
  /** Unmount the popup imperatively (when keep-mounted mode is enabled). */
  unmount: () => void
  /** Enable/disable the menu tree imperatively. */
  setDisabled: (disabled: boolean) => void
}

export interface UsePopupMenuRootReturn {
  /** The menu-tree resolver for this menu root. */
  menuTreeResolver: MenuTreeResolver
  /** The Listbox store instance */
  store: ListboxStore
  /** The FocusOwner store instance */
  focusOwnerStore: FocusOwnerStore
  /** The OpenChain store instance */
  openChainStore: OpenChainStore
  /** Register a surface (submenu) for closeAll tracking */
  registerSurface: (
    depth: number,
    setOpen: (
      open: boolean,
      reason?: PopupMenuOpenChangeReason,
      event?: Event,
    ) => void,
  ) => () => void
  /** Close the entire menu tree */
  closeAll: (reason?: PopupMenuOpenChangeReason, event?: Event) => void
  /** Virtualization configuration (if enabled) */
  virtualization: VirtualizationConfig | undefined
  /** Handle open state change (updates store and clears stores on close) */
  handleOpenChange: (
    open: boolean,
    reason?: PopupMenuOpenChangeReason,
    event?: Event,
  ) => void
  /** Whether the menu currently ignores user interaction. */
  disabled: boolean
  /** Update imperative disabled state. */
  setDisabled: (disabled: boolean) => void
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook that creates and manages the core stores and utilities for popup menus.
 * Used by both DropdownMenu.Root and ContextMenu.Root.
 *
 * Provides:
 * - ListboxStore for item management
 * - FocusOwnerStore for focus tracking across submenus
 * - OpenChainStore for tracking open submenu chain
 * - Surface registry for closeAll functionality
 */
export function usePopupMenuRoot(
  params: UsePopupMenuRootParams = {},
): UsePopupMenuRootReturn {
  const {
    onOpenChange,
    defaultOpen = false,
    virtualized = false,
    items: itemsProp,
    onHighlightChange,
    closeOnOutsidePress = 'pointerdown',
    getDismissExemptElements,
    disabled: disabledProp = false,
    defaultDisabled = false,
    getResolvedId,
    idScope = 'surface',
  } = params

  const menuTreeResolverRef = React.useRef<MenuTreeResolver | null>(null)
  if (menuTreeResolverRef.current === null) {
    menuTreeResolverRef.current = createMenuTreeResolver({
      getResolvedId,
      idScope,
    })
  }
  const menuTreeResolver = menuTreeResolverRef.current

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

  const [imperativeDisabled, setImperativeDisabled] =
    React.useState(defaultDisabled)
  const disabled = disabledProp || imperativeDisabled

  const setDisabled = React.useCallback((nextDisabled: boolean) => {
    setImperativeDisabled(nextDisabled)
  }, [])

  // Begin tracking global input modality so the store can attribute opens to
  // mouse/touch/pen/keyboard. Idempotent; installed once for the whole app.
  React.useEffect(() => {
    ensureInputModalityTracking()
  }, [])

  // Track outside pointer events to distinguish outside-press from focus-out
  // When a pointerdown happens outside the menu, we store it so that if a
  // focus-out close happens immediately after, we can treat it as outside-press
  const outsidePointerEventRef = React.useRef<PointerEvent | null>(null)

  // Stable, for the tree keeps the first one it's given; it calls the
  // latest `onOpenChange`.
  const stableOnOpenChange = useStableCallback(
    (open: boolean, eventDetails: ChangeEventDetails<string>) => {
      onOpenChange?.(open, eventDetails)
    },
  )
  // The tree's `ask`, stable for the same reason: the gate below, which
  // returns what became of the change (root adapters mirror a canceled one
  // to Base UI's details)
  const ask = useStableCallback(
    (
      open: boolean,
      reason: PopupMenuOpenChangeReason,
      event?: Event,
      options?: RootAskOptions,
    ): OpenRequestResult =>
      requestOpen(
        open,
        reason,
        event,
        options?.engine ?? false,
        options?.cause,
      ),
  )

  // The menu tree's store (one per root, shared by its submenus) keeps the
  // root's open cell, its open chain and its focus owner; the root surface's
  // Listbox store state mirrors the open cell.
  const storesRef = React.useRef<{
    tree: MenuTreeStore
    store: ListboxStore
  } | null>(null)
  if (!storesRef.current) {
    const tree = new MenuTreeStore({
      resolver: menuTreeResolver,
      open: defaultOpen,
      onOpenChange: stableOnOpenChange,
      ask,
    })
    storesRef.current = { tree, store: tree.createRootStore() }
  }
  const { tree, store } = storesRef.current

  // Get current open state for the pointer event listener
  const isOpen = store.useState('open')

  // The elements this tree's parts render (triggers, positioners, popups,
  // surfaces), so membership never depends on attributes on the page.
  const elements = getElementRegistry(tree)
  // Read when the event happens, so the root sets it on each render.
  elements.getExempt = getDismissExemptElements
  // A tree rendered inside another one (a select in a dropdown menu's popup)
  // reads the outer tree here, before providing its own, and nests its
  // registry in the outer one's while it's open.
  const outerTree = useMaybeMenuTree()
  React.useEffect(
    () =>
      outerTree && isOpen
        ? getElementRegistry(outerTree).nest(elements)
        : undefined,
    [outerTree, isOpen, elements],
  )
  const isExemptNode = React.useCallback(
    (node: unknown): boolean => node instanceof Node && elements.isExempt(node),
    [elements],
  )

  // The root's own submenus (and subpages), closed when the root closes;
  // each submenu closes its own the same way. They register from a layout
  // effect.
  type SurfaceEntry = {
    depth: number
    setOpen: (
      open: boolean,
      reason?: PopupMenuOpenChangeReason,
      event?: Event,
    ) => void
  }
  const surfaceRegistryRef = React.useRef<Map<string, SurfaceEntry>>(new Map())

  // Register a surface (submenu) for closeAll tracking
  const registerSurface = React.useCallback(
    (depth: number, setOpen: SurfaceEntry['setOpen']) => {
      const id = Math.random().toString(36).slice(2)
      surfaceRegistryRef.current.set(id, { depth, setOpen })
      return () => {
        surfaceRegistryRef.current.delete(id)
      }
    },
    [],
  )

  // When the root's `open` goes false (whatever closed it: a request, Base
  // UI's dismissal, a controlled `open`), close its open submenus with the
  // cause of the close (`getCloseCause`: the last close the consumer let
  // through, for a controlled `open` set whenever), then clear focus
  // ownership and the open chain. A close the consumer canceled, or hasn't applied yet, leaves them
  // as they are.
  // Subscribed in a layout effect, before a close a layout effect makes (a
  // controlled `open` syncs in one).
  useIsoLayoutEffect(
    () =>
      store.observe('open', (open, wasOpen) => {
        if (open || !wasOpen) return
        const cause = getCloseCause(store)
        for (const surface of [...surfaceRegistryRef.current.values()]) {
          surface.setOpen(false, cause?.reason ?? REASONS.none, cause?.event)
        }
        tree.clear()
      }),
    [store, tree],
  )

  // Ref to hold closeAll for use in the pointerdown effect
  const closeAllRef = React.useRef<
    (reason: PopupMenuOpenChangeReason, event?: Event) => void
  >(() => {})

  // Listen for pointerdown events on document to detect outside clicks
  // This is a single listener at the root level that handles the entire menu tree.
  // Behavior depends on closeOnOutsidePress:
  // - 'pointerdown': Close immediately when pointer is pressed outside
  // - 'click': Store event and convert focus-out to outside-press reason
  React.useEffect(() => {
    if (!isOpen || disabled) {
      outsidePointerEventRef.current = null
      return
    }

    // The outside press waiting for its decision (see below).
    let cancelPending = () => {}
    // Clears `outsidePressThisTask` once the press's task ends.
    let endOfTask: ReturnType<typeof setTimeout> | undefined

    const handlePointerDown = (event: PointerEvent) => {
      cancelPending()
      const target = event.target
      if (!(target instanceof Node)) return
      // Presses on an exempt element (e.g. a host input) count as inside.
      if (elements.isExempt(target)) return

      // A press outside the tree's elements reaches the root, so a submenu
      // leaves the focus-out it causes in this task to the root.
      const owned = elements.owns(target)
      if (!owned) {
        clearTimeout(endOfTask)
        elements.outsidePressThisTask = event
        endOfTask = setTimeout(() => {
          elements.outsidePressThisTask = null
        })
      }

      // Presses inside an element this tree (or a tree nested in it)
      // registered count as inside; a backdrop's press is its own to handle.
      if (owned) return

      // Store the event for focus-out-to-outside-press conversion
      outsidePointerEventRef.current = event

      // Outside the registered elements, the press may still be on content a
      // popup of the tree renders through a portal (a consumer's popover
      // opened from a menu item): the popup claims it as the framework
      // dispatches the event through it. Decide once the event reaches its
      // target, or after it when an ancestor stops it on the way.
      const decide = (current?: Event) => {
        if (current && current !== event) return
        cancelPending()
        // Another handler closed the tree (a focus-out converted to this
        // outside press, or Base UI's own dismissal) or a later press
        // replaced this one.
        if (outsidePointerEventRef.current !== event || !store.select('open')) {
          return
        }
        // Content a popup of the tree claimed is inside: a focus-out it
        // causes isn't this press. Another open popup on the page is outside.
        if (elements.claimed(event)) {
          outsidePointerEventRef.current = null
          return
        }
        // With 'click', the press only waits for a focus-out it causes
        if (closeOnOutsidePress !== 'pointerdown') return
        closeAllRef.current(REASONS.outsidePress, event)
      }
      const timeout = setTimeout(decide)
      target.addEventListener('pointerdown', decide, true)
      cancelPending = () => {
        clearTimeout(timeout)
        target.removeEventListener('pointerdown', decide, true)
        cancelPending = () => {}
      }
    }

    // Use capture phase to see the event before any stopPropagation
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      cancelPending()
      clearTimeout(endOfTask)
      elements.outsidePressThisTask = null
      outsidePointerEventRef.current = null
    }
  }, [isOpen, closeOnOutsidePress, disabled, elements, store])

  // The one gate for every open change of the root: the close policy
  // decides, then the tree's store takes it, telling the consumer (who may
  // cancel it) with the policy's reason. A press on an exempt element, or
  // focus moving to one, or to another popup of the tree, doesn't dismiss;
  // this covers Base UI's own dismissal, which runs alongside our listener.
  // A focus-out an outside press caused is reported as that press. A close
  // the engine makes (`closeAll`) goes through while disabled; `cause` is
  // what the submenus closing with the root are told.
  const requestOpen = React.useCallback(
    (
      newOpen: boolean,
      reason: PopupMenuOpenChangeReason,
      event: Event | undefined,
      engine: boolean,
      cause?: CloseCause,
    ) => {
      // For a focus-out only the element gaining focus (`relatedTarget`)
      // counts: `target` is the element losing it.
      const focusTarget =
        reason === REASONS.focusOut
          ? (event as FocusEvent | undefined)?.relatedTarget
          : undefined
      const decision = decideOpenChange<PopupMenuOpenChangeReason, Event>({
        open: newOpen,
        reason,
        event,
        level: 'root',
        disabled,
        engine,
        exempt:
          reason === REASONS.outsidePress
            ? isExemptNode(event?.target)
            : isExemptNode(focusTarget),
        focusInTree:
          focusTarget instanceof Node &&
          elements.popupFor(focusTarget) !== null,
        outsidePress: outsidePointerEventRef.current ?? undefined,
      })
      if (decision.type !== 'allow') return 'refused'
      outsidePointerEventRef.current = null
      return tree.requestOpen(newOpen, decision.reason, decision.event, cause)
    },
    [tree, disabled, isExemptNode, elements],
  )

  const handleOpenChange = React.useCallback(
    (
      newOpen: boolean,
      reason: PopupMenuOpenChangeReason = REASONS.none,
      event?: Event,
    ) => {
      requestOpen(newOpen, reason, event, false)
    },
    [requestOpen],
  )

  // Close the entire menu tree, through the gate: the root closes, and its
  // submenus close with it (see above), with `reason`.
  const closeAll = React.useCallback(
    (reason: PopupMenuOpenChangeReason = REASONS.itemPress, event?: Event) => {
      requestOpen(false, reason, event, true)
    },
    [requestOpen],
  )
  closeAllRef.current = closeAll

  // Memoize listbox wiring config
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

  return {
    menuTreeResolver,
    store,
    focusOwnerStore: tree.focusOwner,
    openChainStore: tree.openChain,
    registerSurface,
    closeAll,
    virtualization,
    handleOpenChange,
    disabled,
    setDisabled,
  }
}
