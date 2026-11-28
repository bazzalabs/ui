'use client'

import { useRender } from '@base-ui/react/use-render'
import { useStableCallback } from '@base-ui/utils/useStableCallback'
import * as React from 'react'
import { REASONS } from '../../../../utils/events/index.js'
import {
  resolveClassName,
  resolveStyle,
} from '../../../../utils/resolve-state-props.js'
import type { ComponentProps } from '../../../../utils/types.js'
import {
  defaultFilter,
  type FilterFn,
  GroupContext,
  normalizeValue,
  type SearchNormalizer,
  SurfaceContext,
  useListboxContext,
} from '../../../listbox/index.js'
import {
  type ListboxStore,
  reapplyAutoHighlight,
  type SurfaceSettings,
  syncSurfaceSettings,
} from '../../../listbox/store/ListboxStore.js'
import { POINTER_EVENT_DEBOUNCE_MS } from '../../constants.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useMaybeFocusZoneRegistry } from '../../contexts/focus-zone-context.js'
import { useGraftPoint } from '../../contexts/graft-point-context.js'
import { useMenuTree } from '../../contexts/menu-tree-context.js'
import { usePopupMenuContext } from '../../contexts/popup-menu-context.js'
import { usePopupSurfaceId } from '../../contexts/popup-surface-id-context.js'
import { useMaybeSubmenuContext } from '../../contexts/submenu-context.js'
import { useMaybeSubpageContext } from '../../contexts/subpage-context.js'
import { useMaybeSubpageStack } from '../../contexts/subpage-stack-context.js'
import {
  findSurfaceTier,
  MenuSurfaceTier,
  SurfaceTierContext,
  useMaybeMenuSurfaceTier,
} from '../../contexts/surface-tier-context.js'
import {
  LoaderScopeContext,
  useLoaderScope,
} from '../../data-first/async-coordinator.js'
import {
  DataPopupContext,
  DataSurfaceContext,
  type DataSurfaceContextValue,
} from '../../data-first/context.js'
import type {
  DataSurfaceProps,
  DeepSearchConfig,
} from '../../data-first/types.js'
import { useMenuElement } from '../../hooks/use-menu-element.js'
import { useInactiveRootResolution } from '../../hooks/use-resolution.js'
import { isPopupMenuNode } from '../../menu-tree/resolve.js'
import { getTabbables } from '../../utils/tabbables.js'
import { PopupMenuCheckboxSelectionStatus } from './checkbox-selection-status.js'

// Surface doesn't expose data attributes - using empty state
export interface PopupMenuSurfaceState extends Record<string, unknown> {}

export interface PopupMenuSurfaceProps
  extends Omit<ComponentProps<'div', PopupMenuSurface.State>, 'content'>,
    DataSurfaceProps {
  /**
   * Filter function for matching items against search query.
   * Returns a score between 0 and 1 (0 = no match, > 0 = match).
   * Pass `false` to disable filtering entirely.
   * @default commandScore (fuzzy matching)
   */
  filter?: FilterFn | false

  /**
   * Transforms search input before filtering and visibility logic.
   * @default trim whitespace (`search.trim()`)
   */
  normalizeSearch?: SearchNormalizer

  /**
   * Controlled search value.
   */
  search?: string

  /**
   * Callback when search value changes.
   */
  onSearchChange?: (search: string) => void

  /**
   * Default search value for uncontrolled usage.
   * @default ''
   */
  defaultSearch?: string

  /**
   * Whether navigation should loop from last to first item and vice versa.
   * @default true
   */
  loop?: boolean

  /**
   * Controls auto-highlighting behavior when the menu opens.
   * - `true`: highlight the first item (default)
   * - `false`: don't auto-highlight any item
   * - `string`: highlight the item with this specific value
   * @default true
   */
  autoHighlightFirst?: boolean | string

  /**
   * Whether to clear the search query when the menu closes.
   * - `'after-exit'`: clear after exit animation completes (default)
   * - `true`: clear immediately when menu closes
   * - `false`: preserve search when menu closes
   * @default 'after-exit'
   */
  clearSearchOnClose?: boolean | 'after-exit'

  /**
   * Whether to reset the list scroll position when the search query changes.
   * @default true
   */
  resetScrollOnSearch?: boolean

  /**
   * Whether to skip auto-focusing the input/list when this surface becomes the focus owner.
   * Useful for Combobox where the input is outside the popup and should retain focus.
   * @default false
   */
  skipAutoFocus?: boolean

  /**
   * Ordered list of item values when using `filter={false}`.
   * This tells the store the intended display order for navigation/highlighting.
   * Required when `filter={false}` - must always be provided with the current visible items.
   */
  orderedItems?: string[]

  children: React.ReactNode
}

/**
 * Syncs the Surface's settings into its store in the layout effects of the
 * commit that renders them. Rendered as the Surface's first child, so they
 * run before the List's (which flushes the rows) and before a data-first list
 * publishes its Collection; outside the Surface's element, so they run while
 * a subpage hides it too.
 */
function SurfaceConfigSync({
  store,
  settings,
  orderedItems,
  orderedItemsChangedRef,
}: {
  store: ListboxStore
  settings: SurfaceSettings
  orderedItems: string[] | undefined
  /** Set when the store takes new `orderedItems`, for the Surface's highlight. */
  orderedItemsChangedRef: React.RefObject<boolean>
}) {
  React.useLayoutEffect(
    () => syncSurfaceSettings(store, settings),
    [store, settings],
  )
  // `setOrderedItems` without its highlight, which needs the commit's items
  // registered: the Surface moves it in a passive effect.
  React.useLayoutEffect(() => {
    if (!orderedItems || orderedItems === store.context.orderedItems) return
    store.context.orderedItems = orderedItems
    orderedItemsChangedRef.current = true
  }, [store, orderedItems, orderedItemsChangedRef])
  return null
}

/**
 * Provides search context and manages item registration for popup menu.
 * Place inside PopupMenu.Popup to enable search functionality.
 * Renders a `<div>` element.
 */
export const PopupMenuSurface = React.forwardRef<
  HTMLDivElement,
  PopupMenuSurface.Props
>(function PopupMenuSurface(props, forwardedRef) {
  const {
    filter = defaultFilter,
    normalizeSearch = normalizeValue,
    search: searchProp,
    onSearchChange,
    defaultSearch = '',
    loop = true,
    autoHighlightFirst = true,
    clearSearchOnClose = 'after-exit',
    resetScrollOnSearch = true,
    skipAutoFocus = false,
    orderedItems,
    content,
    asyncContent,
    asyncContentMode = 'replace',
    asyncContentReveal = 'stream',
    deepSearch,
    includeInDeepSearch = true,
    render,
    className,
    style,
    onKeyDown,
    onFocus,
    onPointerDown,
    onPointerMove,
    children,
    ...rest
  } = props

  const contentDefs = React.useMemo(
    () => content?.map((entry) => (isPopupMenuNode(entry) ? entry.def : entry)),
    [content],
  )

  const isDataMode =
    content !== undefined ||
    asyncContent !== undefined ||
    deepSearch !== undefined ||
    props.includeInDeepSearch !== undefined

  // Get store and depth from Listbox context
  const { store, depth, virtualization } = useListboxContext()

  // The tier of this surface's store, made where the store was (a root,
  // submenu or subpage); a Surface whose store has none provides its own.
  const nearestTier = useMaybeMenuSurfaceTier()
  const storeTier = findSurfaceTier(nearestTier, store)
  const ownTier = React.useMemo(
    () => (storeTier ? null : new MenuSurfaceTier(store, nearestTier)),
    [storeTier, store, nearestTier],
  )
  const tier = storeTier ?? (ownTier as MenuSurfaceTier)

  store.initializeDefaultSearch(defaultSearch)

  // Get submenu context (if inside a submenu)
  const submenuContext = useMaybeSubmenuContext()

  // Get subpage context/stack (if inside a popup with subpage navigation)
  const subpageContext = useMaybeSubpageContext()
  const subpageStack = useMaybeSubpageStack()

  // Get focus owner store
  const focusOwnerStore = useFocusOwner()

  // Track when surface opened to ignore initial pointer events
  // This prevents focus transfer when a popup appears under a stationary cursor
  const openTimeRef = React.useRef<number>(0)

  // Generate stable IDs
  const listId = React.useId()
  const inputId = React.useId()
  const generatedSurfaceId = React.useId()

  // Get surfaceId from Popup context (if available) to ensure Popup and Surface share the same ID
  const popupSurfaceId = usePopupSurfaceId()

  // Priority: PopupSurfaceIdContext > SubmenuContext > generated
  // This ensures Popup and Surface share the same ID for data attribute tracking
  const surfaceId =
    popupSurfaceId ?? submenuContext?.childSurfaceId ?? generatedSurfaceId

  const focusZoneRegistry = useMaybeFocusZoneRegistry()

  // Only render/activate the surface for the currently active page.
  const isSurfaceActive = React.useMemo(() => {
    if (!subpageStack) {
      return true
    }

    if (subpageContext) {
      // If this page is registered in the current popup stack, use it.
      // Otherwise (e.g., nested submenu popup), treat this surface as root surface.
      const registeredSurfaceId = subpageStack.getSurfaceId(
        subpageContext.pageId,
      )
      if (registeredSurfaceId) {
        return subpageStack.activePageId === subpageContext.pageId
      }
    }

    return subpageStack.activePageId === null
  }, [subpageStack, subpageContext])

  // Subscribe to focus ownership
  const isOwner = focusOwnerStore.useState('isOwner', surfaceId)

  // Create stable callback for onSearchChange
  const handleSearchChange = useStableCallback((search: string) => {
    onSearchChange?.(search)
  })

  // The settings reach the store in this commit's layout effects, from
  // `SurfaceConfigSync` (rendered first, below).
  const settings: SurfaceSettings = React.useMemo(
    () => ({
      context: {
        // A data-first Surface's list filters.
        filter: isDataMode ? false : filter,
        loop,
        autoHighlightFirst,
        clearSearchOnClose,
        resetScrollOnSearch,
        listId,
        inputId,
        onSearchChange: handleSearchChange,
      },
      normalizeSearch,
      virtualization,
    }),
    [
      filter,
      isDataMode,
      normalizeSearch,
      loop,
      autoHighlightFirst,
      clearSearchOnClose,
      resetScrollOnSearch,
      listId,
      inputId,
      handleSearchChange,
      virtualization,
    ],
  )

  // What needs the commit's items registered, which they do in passive
  // effects, runs in the Surface's own, after theirs. A string
  // `autoHighlightFirst` is applied when the menu opens, or when its rows
  // first arrive (the store keeps it pending until then), and when it
  // changes; never for another setting's change.
  React.useEffect(() => {
    if (reapplyAutoHighlight(autoHighlightFirst)) store.applyAutoHighlight()
  }, [store, autoHighlightFirst])

  const popupMenuContext = usePopupMenuContext()
  const deepSearchConfig: DeepSearchConfig = React.useMemo(() => {
    if (typeof deepSearch === 'boolean' || deepSearch === undefined) {
      return {
        enabled: deepSearch ?? true,
        minLength: 0,
        groupSearchBehavior: 'preserve',
        radioGroupSearchBehavior: 'preserve',
        checkboxGroupSearchBehavior: 'preserve',
        sortGroups: true,
        asyncResultBehavior: 'stream',
        disabledBranchBehavior: 'exclude',
      }
    }
    return {
      enabled: deepSearch.enabled ?? true,
      minLength: deepSearch.minLength ?? 0,
      groupSearchBehavior: deepSearch.groupSearchBehavior ?? 'preserve',
      radioGroupSearchBehavior:
        deepSearch.radioGroupSearchBehavior ?? 'preserve',
      checkboxGroupSearchBehavior:
        deepSearch.checkboxGroupSearchBehavior ?? 'preserve',
      sortGroups: deepSearch.sortGroups ?? true,
      asyncResultBehavior: deepSearch.asyncResultBehavior ?? 'stream',
      disabledBranchBehavior: deepSearch.disabledBranchBehavior ?? 'exclude',
    }
  }, [deepSearch])

  const dataListId = React.useId()
  const dataSurfaceContextValue: DataSurfaceContextValue = React.useMemo(
    () => ({
      content: contentDefs ?? [],
      asyncContent,
      asyncContentMode,
      asyncContentReveal,
      deepSearchConfig,
      includeInDeepSearch,
      filter,
      listId: dataListId,
    }),
    [
      contentDefs,
      asyncContent,
      asyncContentMode,
      asyncContentReveal,
      deepSearchConfig,
      includeInDeepSearch,
      filter,
      dataListId,
    ],
  )

  const setDataSurfaceContext =
    React.useContext(DataPopupContext)?.setDataSurfaceContext

  // Only the popup's root data surface registers into DataPopupContext (the
  // popup's, which keeps it in the menu tree, or a consumer's) — the popup's
  // subpage outlet renders the subpages of the nodes its list resolves while
  // it is registered. A data-mode Surface nested inside a Subpage of THIS
  // popup (e.g. an async page passing `asyncContent` per
  // SubpageContentRenderParams) must not clobber the root registration. A
  // subpage context inherited across a submenu boundary (not registered in
  // this popup's stack) still counts as this popup's root surface — mirrors
  // the isSurfaceActive resolution above.
  const isSubpageSurfaceInThisPopup = Boolean(
    subpageContext && subpageStack?.getSurfaceId(subpageContext.pageId),
  )

  // The root list unmounts while a subpage is open: new content resolves here
  // meanwhile, so the open page stays while its id is still there.
  const tree = useMenuTree()
  const graftPoint = useGraftPoint()
  // Live while the Surface shows its data-first content: a subpage that
  // hides it drops the scope, so the root starts a new one on the way back.
  const loaderScope = useLoaderScope(tree, store, isDataMode && isSurfaceActive)
  useInactiveRootResolution(
    tree,
    popupSurfaceId,
    dataSurfaceContextValue,
    graftPoint,
    depth,
    isDataMode && !isSurfaceActive && !isSubpageSurfaceInThisPopup,
  )

  React.useLayoutEffect(() => {
    if (!isDataMode || !setDataSurfaceContext || isSubpageSurfaceInThisPopup) {
      return
    }
    setDataSurfaceContext(dataSurfaceContextValue)
    return () => {
      setDataSurfaceContext((current) =>
        current === dataSurfaceContextValue ? null : current,
      )
    }
  }, [
    isDataMode,
    setDataSurfaceContext,
    dataSurfaceContextValue,
    isSubpageSurfaceInThisPopup,
  ])

  // New `orderedItems` move the highlight to the first of them, once their
  // items have registered.
  const orderedItemsChangedRef = React.useRef(false)
  React.useEffect(() => {
    if (!orderedItems || !orderedItemsChangedRef.current) return
    orderedItemsChangedRef.current = false
    store.highlightFirstOrderedItem()
  }, [store, orderedItems])

  // Sync controlled search prop to store
  store.useControlledProp('searchProp', searchProp)

  // Track the open state
  const open = store.useState('open')

  // Ref to the surface element for finding focusable elements
  const surfaceRef = React.useRef<HTMLDivElement | null>(null)
  const elementRef = useMenuElement('surface')

  // Record open time when surface opens
  React.useEffect(() => {
    if (open) {
      openTimeRef.current = Date.now()
    }
  }, [open])

  // Claim focus ownership when root menu opens
  React.useEffect(() => {
    if (!isSurfaceActive) {
      return
    }

    if (depth === 0 && open) {
      focusOwnerStore.setOwnerId(surfaceId)
    }
  }, [depth, open, surfaceId, focusOwnerStore, isSurfaceActive])

  // Register this surface's position in the tree for Tab bubbling.
  React.useEffect(() => {
    if (!focusZoneRegistry || !isSurfaceActive) return undefined
    if (!popupMenuContext.explicitTabBehavior) return undefined
    return focusZoneRegistry.registerSurface(surfaceId, {
      parentSurfaceId: submenuContext?.parentSurfaceId ?? null,
      close: submenuContext
        ? () => {
            // An explicit close: keyboard auto-reopen is suppressed while the
            // trigger stays highlighted (as for ArrowLeft/Escape closes).
            tier.submenu?.closeExplicitly()
            // Tab moved focus out of the submenu
            submenuContext.setOpen(false, REASONS.focusOut)
          }
        : () => {},
    })
  }, [
    tier,
    focusZoneRegistry,
    isSurfaceActive,
    popupMenuContext.explicitTabBehavior,
    surfaceId,
    submenuContext,
  ])

  // Auto-focus when becoming owner
  // Skip for Combobox where the input is outside the popup and should retain focus
  const hasAutoFocusedRef = React.useRef(false)

  React.useEffect(() => {
    if (!isSurfaceActive || !open) {
      hasAutoFocusedRef.current = false
    }
  }, [isSurfaceActive, open])

  React.useEffect(() => {
    // A closed surface (kept mounted, or exiting) never takes focus
    if (!isSurfaceActive || !isOwner || skipAutoFocus || !open) {
      return
    }

    // Use setTimeout(0) to push focus to the next macrotask
    // This allows FloatingFocusManager's cleanup to complete before we focus
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        if (!surfaceRef.current || !store.select('open')) {
          return
        }

        const zoneElements = focusZoneRegistry?.getZoneElements(surfaceId) ?? []
        const isInitialAutoFocus = !hasAutoFocusedRef.current
        hasAutoFocusedRef.current = true
        const activeElementInZone = zoneElements.some(
          (zone) =>
            document.activeElement !== null &&
            zone.contains(document.activeElement),
        )

        // If focus is already inside this surface (e.g. ownership was claimed
        // because focus moved here), don't yank it to the input/list.
        // Exception: on the surface's first auto-focus after opening, focus
        // sitting inside a focus zone is a focus-manager artifact.
        // Gated: only trees with explicit Tab behavior get this semantics.
        if (
          popupMenuContext.explicitTabBehavior &&
          document.activeElement &&
          surfaceRef.current.contains(document.activeElement) &&
          !(isInitialAutoFocus && activeElementInZone)
        ) {
          return
        }

        // Inputs that belong to the menu itself, not to a focus zone
        // (a zone input must not steal the open-focus from the search Input).
        const inputs = Array.from(surfaceRef.current.querySelectorAll('input'))
        const input = inputs.find(
          (el) => !zoneElements.some((zone) => zone.contains(el)),
        )
        const list = surfaceRef.current.querySelector('[role="listbox"]')
        const zoneTabbable = zoneElements.flatMap(getTabbables)[0]
        const focusTarget = input ?? list ?? zoneTabbable

        if (focusTarget && focusTarget instanceof HTMLElement) {
          focusTarget.focus()
        }
      })
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [
    isSurfaceActive,
    isOwner,
    skipAutoFocus,
    open,
    store,
    popupMenuContext.explicitTabBehavior,
    focusZoneRegistry,
    surfaceId,
  ])

  const contextValue = React.useMemo(
    () => ({
      store,
      surfaceId,
    }),
    [store, surfaceId],
  )

  // The tier's selection. This Surface claims it as it mounts, which starts
  // it fresh for a new Surface and keeps it for this one shown again.
  const selectionStore = tier.selection
  const [selectionOwner] = React.useState(() => ({}))
  React.useLayoutEffect(
    () => selectionStore.claim(selectionOwner),
    [selectionStore, selectionOwner],
  )
  React.useEffect(() => selectionStore.attach(), [selectionStore])
  React.useEffect(() => {
    selectionStore.setAnnouncementFormatter(
      popupMenuContext.getAriaSelectionText,
    )
  }, [selectionStore, popupMenuContext.getAriaSelectionText])
  // An inactive surface (a subpage is open) drops its announcement so the
  // region mounts empty again when the surface comes back.
  React.useEffect(() => {
    if (!isSurfaceActive) selectionStore.clearAnnouncement()
  }, [selectionStore, isSurfaceActive])

  // Prevent pointer down from stealing focus from Input.
  // A press on an input itself must keep the browser's native
  // focus-on-pointerdown behavior, so don't cancel it there.
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!(event.target instanceof HTMLInputElement)) {
        event.preventDefault()
      }
      onPointerDown?.(event)
    },
    [onPointerDown],
  )

  // Claim focus ownership when pointer moves inside this surface
  // This handles the case when moving from a submenu back to parent
  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)

      // Ignore pointer events briefly after surface opens
      // This prevents focus transfer when popup appears under stationary cursor
      const timeSinceOpen = Date.now() - openTimeRef.current
      if (timeSinceOpen < POINTER_EVENT_DEBOUNCE_MS) {
        return
      }

      // Check if the event target is actually within this surface's DOM
      // This prevents parent surfaces from claiming ownership when events
      // bubble through React portals from child surfaces
      const target = event.target as Node
      if (!surfaceRef.current?.contains(target)) {
        return
      }

      // Check store directly to avoid stale reactive state issues
      // Only claim ownership if we're not already the owner
      if (focusOwnerStore.state.ownerId !== surfaceId) {
        focusOwnerStore.setOwnerId(surfaceId)
      }
    },
    [onPointerMove, surfaceId, focusOwnerStore],
  )

  // Explicit Tab behavior: with no focus zones, Tab closes the whole menu
  // tree (replaces Base UI's emergent focus-out close).
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event)
      if (event.defaultPrevented) return
      if (event.key !== 'Tab') return
      if (!popupMenuContext.explicitTabBehavior) return
      const target = event.target as Node
      if (!surfaceRef.current?.contains(target)) return
      const zoneElements = focusZoneRegistry?.getZoneElements(surfaceId) ?? []
      const zoneTabbables = zoneElements.flatMap(getTabbables)

      if (zoneTabbables.length === 0) {
        if (!focusZoneRegistry) {
          if (popupMenuContext.tabWithoutZones === 'inert') {
            event.preventDefault()
            return
          }
          popupMenuContext.closeAll(REASONS.focusOut, event.nativeEvent)
          return
        }
        // Bubble: find the nearest ancestor surface with zone tabbables.
        const chain: string[] = []
        let current = surfaceId
        for (;;) {
          const parent = focusZoneRegistry.getParentSurfaceId(current)
          if (!parent) {
            // No ancestor with zones: close the whole tree (no preventDefault).
            if (popupMenuContext.tabWithoutZones === 'inert') {
              event.preventDefault()
              return
            }
            popupMenuContext.closeAll(REASONS.focusOut, event.nativeEvent)
            return
          }
          chain.push(current)
          const parentTabbables = focusZoneRegistry
            .getZoneElements(parent)
            .flatMap(getTabbables)
          if (parentTabbables.length > 0) {
            event.preventDefault()
            for (const id of chain) {
              focusZoneRegistry.closeSurface(id)
            }
            focusOwnerStore.setOwnerId(parent)
            const targetEl = event.shiftKey
              ? parentTabbables[parentTabbables.length - 1]
              : parentTabbables[0]
            targetEl?.focus()
            return
          }
          current = parent
        }
      }

      // Cycle: primary stop (Input, or List when no Input) → zone tabbables.
      // Set-dedupe: nested/overlapping zones may yield the same element twice.
      const primaryId = store.state.hasInput
        ? store.context.inputId
        : store.context.listId
      const primaryEl = primaryId ? document.getElementById(primaryId) : null
      const stopSet = new Set<HTMLElement>()
      if (primaryEl instanceof HTMLElement) stopSet.add(primaryEl)
      for (const el of zoneTabbables) stopSet.add(el)
      const stops = [...stopSet]

      event.preventDefault()
      const active = document.activeElement as HTMLElement | null
      const currentIndex = active ? stops.indexOf(active) : -1
      const delta = event.shiftKey ? -1 : 1
      const next =
        currentIndex === -1
          ? event.shiftKey
            ? stops[stops.length - 1]
            : stops[0]
          : stops[(currentIndex + delta + stops.length) % stops.length]
      next?.focus()
    },
    [
      onKeyDown,
      popupMenuContext,
      store,
      focusZoneRegistry,
      surfaceId,
      focusOwnerStore,
    ],
  )

  // Sync DOM focus into FocusOwnerStore: focus landing inside this surface
  // makes it the focus owner (focusin bubbles; the contains-guard filters
  // portal re-bubbling from child surfaces, same as handlePointerMove).
  const handleFocus = React.useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      onFocus?.(event)
      if (!popupMenuContext.explicitTabBehavior) return
      const target = event.target as Node
      if (!surfaceRef.current?.contains(target)) return
      if (focusOwnerStore.state.ownerId !== surfaceId) {
        focusOwnerStore.setOwnerId(surfaceId)
      }
    },
    [onFocus, popupMenuContext, focusOwnerStore, surfaceId],
  )

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'surface')

  const renderedChildren = isDataMode ? (
    <DataSurfaceContext.Provider value={dataSurfaceContextValue}>
      <LoaderScopeContext.Provider value={loaderScope}>
        {children}
      </LoaderScopeContext.Provider>
    </DataSurfaceContext.Provider>
  ) : (
    children
  )

  const element = useRender({
    render,
    ref: [surfaceRef, tier.surfaceRef, forwardedRef, elementRef],
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      className: resolveClassName(className, {}),
      style: resolveStyle(style, {}),
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      children: (
        <>
          {/* First, so styled surfaces using `divide-y` keep the list as the last child. */}
          <PopupMenuCheckboxSelectionStatus />
          {renderedChildren}
        </>
      ),
    },
    enabled: isSurfaceActive,
    defaultTagName: 'div',
  })

  // Every surface starts outside any group. A submenu's surface renders
  // through a portal inside the trigger's group, and without this its rows
  // would join that group: its description, its positional flags, its
  // search-hidden state, and its label setter.
  const surface = (
    <SurfaceContext.Provider value={contextValue}>
      <SurfaceConfigSync
        store={store}
        settings={settings}
        orderedItems={orderedItems}
        orderedItemsChangedRef={orderedItemsChangedRef}
      />
      <GroupContext.Provider value={null}>{element}</GroupContext.Provider>
    </SurfaceContext.Provider>
  )
  return ownTier ? (
    <SurfaceTierContext.Provider value={ownTier}>
      {surface}
    </SurfaceTierContext.Provider>
  ) : (
    surface
  )
})

export namespace PopupMenuSurface {
  export type State = PopupMenuSurfaceState
  export interface Props extends PopupMenuSurfaceProps {}
}
