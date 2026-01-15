'use client'

import { useRender } from '@base-ui/react/use-render'
import { useStableCallback } from '@base-ui/utils/useStableCallback'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import {
  defaultFilter,
  type FilterFn,
  SurfaceContext,
  useListboxContext,
  useSurfaceContext as useParentSurfaceContext,
} from '../../../listbox/index.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useMaybeSubmenuContext } from '../../contexts/submenu-context.js'

// Surface doesn't expose data attributes - using empty state
export interface PopupMenuSurfaceState extends Record<string, unknown> {}

export interface PopupMenuSurfaceProps
  extends ComponentProps<'div', PopupMenuSurfaceState> {
  /**
   * Filter function for matching items against search query.
   * Returns a score between 0 and 1 (0 = no match, > 0 = match).
   * Pass `false` to disable filtering entirely.
   * @default commandScore (fuzzy matching)
   */
  filter?: FilterFn | false

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
   * @default true
   */
  clearSearchOnClose?: boolean

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
 * Provides search context and manages item registration for popup menu.
 * Place inside PopupMenu.Popup to enable search functionality.
 * Renders a `<div>` element.
 */
export const PopupMenuSurface = React.forwardRef<
  HTMLDivElement,
  PopupMenuSurfaceProps
>(function PopupMenuSurface(props, forwardedRef) {
  const {
    filter = defaultFilter,
    search: searchProp,
    onSearchChange,
    defaultSearch = '',
    loop = true,
    autoHighlightFirst = true,
    clearSearchOnClose = true,
    skipAutoFocus = false,
    orderedItems,
    render,
    className,
    style,
    onPointerDown,
    onPointerMove,
    children,
    ...rest
  } = props

  // Get store and depth from Listbox context
  const { store, depth, virtualization } = useListboxContext()

  // Get submenu context (if inside a submenu)
  const submenuContext = useMaybeSubmenuContext()

  // Get focus owner store
  const focusOwnerStore = useFocusOwner()

  // Generate stable IDs
  const listId = React.useId()
  const inputId = React.useId()
  const generatedSurfaceId = React.useId()

  // Use childSurfaceId from submenu context if available, otherwise generate our own
  const surfaceId = submenuContext?.childSurfaceId ?? generatedSurfaceId

  // Subscribe to focus ownership
  const isOwner = focusOwnerStore.useState('isOwner', surfaceId)

  // Create stable callback for onSearchChange
  const handleSearchChange = useStableCallback((search: string) => {
    onSearchChange?.(search)
  })

  // Update store context with surface configuration
  React.useEffect(() => {
    store.context.filter = filter
    store.context.loop = loop
    store.context.autoHighlightFirst = autoHighlightFirst
    store.context.clearSearchOnClose = clearSearchOnClose
    store.context.listId = listId
    store.context.inputId = inputId
    store.context.onSearchChange = handleSearchChange

    // Configure virtualization if enabled
    if (virtualization) {
      store.setVirtualized(virtualization.virtualized)
      store.setVirtualItems(virtualization.items)
      store.setOnHighlightChange(virtualization.onHighlightChange)
    } else {
      store.setVirtualized(false)
      store.setVirtualItems([])
      store.setOnHighlightChange(undefined)
    }

    // Apply auto-highlight after context is updated
    // This handles the case where autoHighlightFirst is a string value
    // (the open observer only handles boolean true for backwards compatibility)
    if (typeof autoHighlightFirst === 'string') {
      store.applyAutoHighlight()
    }
  }, [
    store,
    filter,
    loop,
    autoHighlightFirst,
    clearSearchOnClose,
    listId,
    inputId,
    handleSearchChange,
    virtualization,
  ])

  // Sync consumer-provided ordered items to store
  // This is separate from the config effect since orderedItems changes on each search
  React.useEffect(() => {
    if (orderedItems) {
      store.setOrderedItems(orderedItems)
    }
  }, [store, orderedItems])

  // Sync controlled search prop to store
  store.useControlledProp('search', searchProp, defaultSearch)

  // Track the open state
  const open = store.useState('open')

  // Ref to the surface element for finding focusable elements
  const surfaceRef = React.useRef<HTMLDivElement | null>(null)

  // Claim focus ownership when root menu opens
  React.useEffect(() => {
    if (depth === 0 && open) {
      focusOwnerStore.setOwnerId(surfaceId)
    }
  }, [depth, open, surfaceId, focusOwnerStore])

  // Auto-focus when becoming owner
  // Skip for Combobox where the input is outside the popup and should retain focus
  React.useEffect(() => {
    if (!isOwner || skipAutoFocus) return

    requestAnimationFrame(() => {
      if (!surfaceRef.current) return

      // Find input or list within this surface
      const input = surfaceRef.current.querySelector('input')
      const list = surfaceRef.current.querySelector('[role="listbox"]')
      const focusTarget = input ?? list

      if (focusTarget && focusTarget instanceof HTMLElement) {
        focusTarget.focus()
      }
    })
  }, [isOwner, skipAutoFocus])

  const contextValue = React.useMemo(
    () => ({
      store,
      surfaceId,
    }),
    [store, surfaceId],
  )

  // Prevent pointer down from stealing focus from Input
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      onPointerDown?.(event)
    },
    [onPointerDown],
  )

  // Claim focus ownership when pointer moves inside this surface
  // This handles the case when moving from a submenu back to parent
  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event)

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

  const element = useRender({
    render,
    ref: [surfaceRef, forwardedRef],
    props: {
      ...rest,
      className,
      style,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      children,
    },
    defaultTagName: 'div',
  })

  return (
    <SurfaceContext.Provider value={contextValue}>
      {element}
    </SurfaceContext.Provider>
  )
})

export namespace PopupMenuSurface {
  export type State = PopupMenuSurfaceState
  export interface Props extends PopupMenuSurfaceProps {}
}
