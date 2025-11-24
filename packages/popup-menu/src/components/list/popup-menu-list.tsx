import {
  type AsyncNodeLoader,
  createSurfaceStore,
  type MenuDef,
  type MenuNodeDefaults,
  type SubmenuDef,
  useLoader,
  useMenu,
} from '@bazza-ui/menu'
import * as React from 'react'
import { FocusOwnerCtx } from '../../contexts/focus-owner-context.js'
import { KeyboardCtx } from '../../contexts/keyboard-context.js'
import { useScopedTheme } from '../../contexts/theme-context.js'
import { HoverPolicyProvider } from '../../features/hover-policy/hover-policy-context.js'
import { useNavKeydown } from '../../hooks/use-nav-keydown.js'
import type {
  PopupMenuDef,
  PopupMenuSlots,
  PopupSubmenuDef,
} from '../../types.js'
import { isInBounds } from '../../utils/dom.js'
import { ContentBindingsProvider } from '../content/content-bindings-context.js'
import { SubCtx } from '../submenu/submenu-context.js'
import { SurfaceProvider } from '../surface/surface-provider.js'
import { ListRenderer } from './list-renderer.js'

/**
 * Wrapper component that provides keyboard handler and surface bindings via context
 */
function ContentBindingsWrapper({
  surfaceId,
  onClose,
  surfaceProps,
  children,
}: {
  surfaceId: string
  onClose?: () => void
  surfaceProps: { onMouseMove: (e: React.MouseEvent) => void }
  children: React.ReactNode
}) {
  // This hook is now called inside SurfaceProvider context
  const handleKeyDown = useNavKeydown(surfaceId, onClose)

  const bindingsValue = React.useMemo(
    () => ({ surfaceProps, handleKeyDown }),
    [surfaceProps, handleKeyDown],
  )

  return (
    <ContentBindingsProvider value={bindingsValue}>
      {children}
    </ContentBindingsProvider>
  )
}

export interface PopupMenuListProps<T = unknown> {
  /** Menu definition */
  menu: PopupMenuDef<T> | PopupSubmenuDef<T>
  /** Query for search/filtering */
  query?: string
  /** Open state (for loaders) */
  open?: boolean
  /** Vim bindings enabled */
  vimBindings?: boolean
  /** Text direction */
  dir?: 'ltr' | 'rtl'
  /** Close callback */
  onClose?: () => void
  /** Callback when user starts typing to activate input */
  onTypeStart?: (seed: string) => void
  /** Content ref (for positioning and mouse move handling) */
  contentRef?: React.RefObject<HTMLDivElement | null>
  /** React children (standard JSX composition) */
  children?: React.ReactNode
  /** Pre-computed defaults from factory + instance levels */
  defaults?: MenuNodeDefaults<T>
  /** Whether this is a submenu */
  isSubmenu?: boolean
  /** Submenu context */
  subCtx?: any
}

/**
 * PopupMenuList creates the surface store, orchestrates loaders and deep search,
 * and provides the store and bindings to children via context.
 * If no children are provided, renders the ListRenderer by default.
 */
export function PopupMenuList<T = unknown>({
  menu,
  query = '',
  open = true,
  vimBindings = true,
  dir = 'ltr',
  onClose,
  onTypeStart,
  contentRef,
  children,
  defaults,
  isSubmenu: isSubmenuProp,
  subCtx: subCtxProp,
}: PopupMenuListProps<T>) {
  // Determine surface ID (from submenu context or 'root')
  const subCtx = React.useContext(SubCtx)
  const surfaceId = React.useMemo(
    () => subCtx?.childSurfaceId ?? 'root',
    [subCtx],
  )

  // Determine if this is a submenu (needed early for deep search orchestration)
  // Use prop if provided, otherwise derive from context
  const isSubmenu = isSubmenuProp ?? !!subCtx

  // Get theme from scoped context
  const theme = useScopedTheme()

  // Create a surface store for the current menu
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-create surface store when menu changes
  const store = React.useMemo(() => createSurfaceStore<T>(), [menu.id])

  // Extract the loader from the current menu
  const menuLoader = React.useMemo(() => {
    return 'loader' in menu ? menu.loader : undefined
  }, [menu]) as AsyncNodeLoader<T>

  // Determine if we should pass query to the loader
  const loaderQuery = React.useMemo(() => {
    const searchMode = menu.search?.mode ?? 'client'
    // Only pass query to loader for server/hybrid modes
    return searchMode === 'client' ? '' : query
  }, [menu.search?.mode, query])

  // Create loader context
  const loaderContext = React.useMemo(
    () => ({
      query: loaderQuery,
      open,
    }),
    [loaderQuery, open],
  )

  // Execute the root menu loader using auto-detection
  const loaderResult = useLoader(menuLoader, loaderContext)

  // Build menu with deep search support from @bazza-ui/menu
  const { menu: orchestratedMenu } = useMenu<T>({
    menuDef: menu as MenuDef<T> | SubmenuDef<T>,
    query,
    open,
    surfaceId,
    isSubmenu,
    rootLoaderResult: loaderResult,
    defaults,
  })

  // Check if we're already inside a FocusOwnerCtx (from parent surface)
  const existingFocusOwnerCtx = React.useContext(FocusOwnerCtx)

  // Focus owner state - only create if we're the root (no existing context)
  const [localOwnerId, setLocalOwnerId] = React.useState<string | null>(null)
  const localFocusOwnerValue = React.useMemo(
    () => ({ ownerId: localOwnerId, setOwnerId: setLocalOwnerId }),
    [localOwnerId],
  )

  // Use existing context if available (submenu), otherwise use local (root)
  const { ownerId, setOwnerId } = existingFocusOwnerCtx || localFocusOwnerValue

  // On open, claim focus ownership for the first surface and focus input/list
  // Only the root menu should clear ownerId when closing
  React.useEffect(() => {
    // Only clear ownerId if we're the root menu and we're closing
    if (!open && !isSubmenu) {
      setOwnerId(null)
      return
    }
    // When opened and no owner, claim ownership and focus
    if (open && ownerId === null) {
      setOwnerId(surfaceId)
      // Focus input or list on next frame
      requestAnimationFrame(() => {
        const element = store.inputRef.current ?? store.listRef.current
        element?.focus()
      })
    }
  }, [
    open,
    ownerId,
    surfaceId,
    store.inputRef,
    store.listRef,
    setOwnerId,
    isSubmenu,
  ])

  // Keep focus on input/list after re-render when we own focus
  const isOwner = ownerId === surfaceId
  React.useEffect(() => {
    if (!open || !isOwner) return
    // Only refocus if neither input nor list currently has focus
    const activeElement = document.activeElement
    const inputHasFocus = store.inputRef.current === activeElement
    const listHasFocus = store.listRef.current === activeElement
    if (inputHasFocus || listHasFocus) return

    const id = requestAnimationFrame(() => {
      const element = store.inputRef.current ?? store.listRef.current
      element?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [open, isOwner, store])

  // Mouse move handler - claim focus ownership when mouse is within this surface bounds
  // This handler is attached to the content element and will receive events from it and its children
  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      const rect = contentRef?.current
        ? (contentRef.current as HTMLElement | null)?.getBoundingClientRect()
        : undefined
      const inBounds = rect ? isInBounds(e.clientX, e.clientY, rect) : false
      if (inBounds && ownerId !== surfaceId) {
        setOwnerId(surfaceId)
      }
      if (!rect || !inBounds) return
    },
    [contentRef, surfaceId, setOwnerId, ownerId],
  )

  // Surface props to pass to content
  const surfaceProps = React.useMemo(
    () => ({ onMouseMove: handleMouseMove }),
    [handleMouseMove],
  )

  const keyboardValue = React.useMemo(
    () => ({ dir, vimBindings }),
    [dir, vimBindings],
  )

  const content = (
    <KeyboardCtx.Provider value={keyboardValue}>
      <HoverPolicyProvider>
        <SurfaceProvider
          store={store}
          menu={orchestratedMenu}
          slots={theme?.slots as PopupMenuSlots<T> | undefined}
          classNames={theme?.classNames}
        >
          <ContentBindingsWrapper
            surfaceId={surfaceId}
            onClose={onClose}
            surfaceProps={surfaceProps}
          >
            <ListRenderer
              query={query}
              onClose={onClose}
              onTypeStart={onTypeStart}
            />
          </ContentBindingsWrapper>
        </SurfaceProvider>
      </HoverPolicyProvider>
    </KeyboardCtx.Provider>
  )

  // Only provide FocusOwnerCtx if we're the root menu (no existing context)
  if (!existingFocusOwnerCtx) {
    return (
      <FocusOwnerCtx.Provider value={localFocusOwnerValue}>
        {content}
      </FocusOwnerCtx.Provider>
    )
  }

  return content
}
