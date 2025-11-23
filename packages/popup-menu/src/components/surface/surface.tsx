import {
  type AsyncNodeLoader,
  createSurfaceStore,
  type MenuControl,
  type MenuDef,
  type MenuNodeDefaults,
  type SubmenuDef,
  useFilteredNodes,
  useInputActivation,
  useLoader,
  useMenu,
} from '@bazza-ui/menu'
import * as React from 'react'
import { FocusOwnerCtx } from '../../contexts/focus-owner-context.js'
import { KeyboardCtx } from '../../contexts/keyboard-context.js'
import { useRoot } from '../../contexts/root-context.js'
import { useScopedTheme } from '../../contexts/theme-context.js'
import { HoverPolicyProvider } from '../../features/hover-policy/hover-policy-context.js'
import type {
  PopupMenuDef,
  PopupMenuSlots,
  PopupSubmenuDef,
} from '../../types.js'
import { isInBounds } from '../../utils/dom.js'
import { PopupMenuInput } from '../input/input.js'
import { List } from '../list/list.js'
import { Popup } from '../popup/popup.js'
import { SubCtx } from '../submenu/submenu-context.js'
import { SurfaceProvider } from './surface-provider.js'

export interface SurfaceProps<T = unknown> {
  /** Menu definition */
  menu: PopupMenuDef<T> | PopupSubmenuDef<T>
  /** Whether the menu is open */
  open?: boolean
  /** Close callback */
  onClose?: () => void
  /** Vim bindings enabled */
  vimBindings?: boolean
  /** Text direction */
  dir?: 'ltr' | 'rtl'
  /** Content ref (for positioning) */
  contentRef?: React.RefObject<HTMLDivElement | null>
  /** Placeholder for input */
  placeholder?: string
  /** Popover.Popup props from Base UI (spread on content wrapper) */
  popupProps?: React.HTMLAttributes<HTMLElement>
  /** Pre-computed defaults from factory + instance levels */
  defaults?: MenuNodeDefaults<T>
  /** Query override (optional) */
  query?: string
  /** Control for programmatic access (optional) - accepts any control that extends MenuControl */
  control?: MenuControl<T> | (MenuControl<T> & Record<string, any>)
}

/**
 * Surface component - The orchestration layer.
 * Consolidates store creation, loaders, focus management, and rendering.
 */
export function Surface<T = unknown>({
  menu,
  open = true,
  onClose,
  vimBindings = true,
  dir = 'ltr',
  contentRef,
  placeholder,
  popupProps,
  defaults,
  query: queryProp,
  control,
}: SurfaceProps<T>) {
  const subCtx = React.useContext(SubCtx)
  const isSubmenu = !!subCtx
  const surfaceId = React.useMemo(
    () => subCtx?.childSurfaceId ?? 'root',
    [subCtx],
  )
  const rootCtx = useRoot()

  // Theme from scoped context (provided by consumer or parent list)
  const { slots: themeSlots, classNames, slotProps } = useScopedTheme()
  const slots = themeSlots as unknown as PopupMenuSlots<T>

  // --- 1. STORE CREATION ---
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-create surface store when menu changes
  const store = React.useMemo(() => createSurfaceStore<T>(), [menu.id])

  // --- 2. INPUT ACTIVATION ---
  const hideSearchUntilActive = menu.hideSearchUntilActive ?? false
  const {
    inputActive,
    query: internalQuery,
    setQuery,
    setInputActive,
  } = useInputActivation(hideSearchUntilActive)

  // Use prop query if provided (controlled), otherwise internal state
  const query = queryProp ?? internalQuery

  // --- 3. LOADER ORCHESTRATION ---
  const menuLoader = React.useMemo(() => {
    return 'loader' in menu ? menu.loader : undefined
  }, [menu]) as AsyncNodeLoader<T>

  const loaderQuery = React.useMemo(() => {
    const searchMode = menu.search?.mode ?? 'client'
    return searchMode === 'client' ? '' : query
  }, [menu.search?.mode, query])

  const loaderContext = React.useMemo(
    () => ({
      query: loaderQuery,
      open,
    }),
    [loaderQuery, open],
  )

  const loaderResult = useLoader(menuLoader, loaderContext)

  // --- 4. MENU ORCHESTRATION ---
  const { menu: orchestratedMenu } = useMenu<T>({
    menuDef: menu as MenuDef<T> | SubmenuDef<T>,
    query,
    open,
    surfaceId,
    isSubmenu,
    rootLoaderResult: loaderResult,
    defaults,
  })

  // --- 5. SEARCH & FILTERING ---
  const isStreaming =
    (orchestratedMenu as any).loadingState?.loadMode === 'streaming'
  const completionOrder = (orchestratedMenu as any).loadingState
    ?.completionOrder as string[] | undefined

  const { displayNodes } = useFilteredNodes(orchestratedMenu, query, {
    mode: query.length > 0 ? 'deep' : 'shallow',
    streamingEnabled: isStreaming,
    completionOrder: completionOrder ?? [],
  })

  // --- 6. FOCUS MANAGEMENT ---
  const existingFocusOwnerCtx = React.useContext(FocusOwnerCtx)
  const [localOwnerId, setLocalOwnerId] = React.useState<string | null>(null)
  const localFocusOwnerValue = React.useMemo(
    () => ({ ownerId: localOwnerId, setOwnerId: setLocalOwnerId }),
    [localOwnerId],
  )
  const { ownerId, setOwnerId } = existingFocusOwnerCtx || localFocusOwnerValue

  React.useEffect(() => {
    if (!open && !isSubmenu) {
      setOwnerId(null)
      return
    }
    if (open && ownerId === null) {
      setOwnerId(surfaceId)
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

  const isOwner = ownerId === surfaceId
  React.useEffect(() => {
    if (!open || !isOwner) return
    const activeElement = document.activeElement
    const inputHasFocus = store.inputRef.current === activeElement
    const listHasFocus = store.listRef.current === activeElement
    if (inputHasFocus || listHasFocus) return

    const id = requestAnimationFrame(() => {
      const element = store.inputRef.current ?? store.listRef.current
      element?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [open, isOwner, store.inputRef, store.listRef])

  // --- 7. INTERACTION HANDLERS ---
  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      const rect = contentRef?.current
        ? (contentRef.current as HTMLElement | null)?.getBoundingClientRect()
        : undefined
      const inBounds = rect ? isInBounds(e.clientX, e.clientY, rect) : false
      if (inBounds && ownerId !== surfaceId) {
        setOwnerId(surfaceId)
      }
    },
    [contentRef, surfaceId, setOwnerId, ownerId],
  )

  // handleKeyDown moved to Popup component where it can access SurfaceProvider context

  // Surface registration
  React.useEffect(() => {
    if (!open) return
    const depth = isSubmenu ? 1 : 0 // TODO: cleaner depth tracking
    rootCtx.registerSurface(surfaceId, depth)
    return () => {
      rootCtx.unregisterSurface(surfaceId)
    }
  }, [rootCtx, surfaceId, isSubmenu, open])

  // Close listener
  React.useEffect(() => {
    const handle = () => {
      if (subCtx) {
        subCtx.onOpenChange(false)
      }
    }
    document.addEventListener('popupmenu-close', handle, true)
    return () => {
      document.removeEventListener('popupmenu-close', handle, true)
    }
  }, [subCtx?.onOpenChange])

  // Input focus sync
  const storeInputRef = React.useRef<React.RefObject<HTMLInputElement> | null>(
    null,
  )
  React.useEffect(() => {
    storeInputRef.current = store.inputRef as React.RefObject<HTMLInputElement>
  }, [store.inputRef])

  const prevInputActiveRef = React.useRef(inputActive)
  React.useEffect(() => {
    if (
      inputActive &&
      !prevInputActiveRef.current &&
      storeInputRef.current?.current
    ) {
      requestAnimationFrame(() => {
        storeInputRef.current?.current?.focus()
      })
    }
    prevInputActiveRef.current = inputActive
  }, [inputActive])

  // Type start handler
  const handleTypeStart = React.useCallback(
    (seed: string) => {
      if (!inputActive) {
        setInputActive(true)
        setQuery(seed)
      }
    },
    [inputActive, setInputActive, setQuery],
  )

  // --- 8. BINDINGS ---
  // Binding creation moved to Popup component where it can access SurfaceProvider context

  // --- 9. COMPONENTS ---
  const Header = slots.Header ? (
    <div data-slot="popup-menu-header" {...(slotProps?.header as any)}>
      {slots.Header({
        menu: orchestratedMenu as any,
        loadMode: orchestratedMenu.loadingState?.loadMode,
      })}
    </div>
  ) : null

  const Input = inputActive ? (
    <PopupMenuInput
      store={store}
      value={query}
      onValueChange={setQuery}
      placeholder={placeholder ?? menu.inputPlaceholder ?? 'Search...'}
    />
  ) : null

  const Footer = slots.Footer ? (
    <div data-slot="popup-menu-footer" {...(slotProps?.footer as any)}>
      {slots.Footer({ menu: orchestratedMenu as any })}
    </div>
  ) : null

  // --- 10. RENDER ---
  const content = (
    <KeyboardCtx.Provider value={{ dir, vimBindings }}>
      <HoverPolicyProvider>
        <SurfaceProvider
          store={store as any}
          menu={orchestratedMenu as any}
          displayNodes={displayNodes as any}
          slots={slots as any}
          classNames={classNames}
          slotProps={slotProps}
          inputActive={inputActive}
          setInputActive={setInputActive}
          query={query}
          setQuery={setQuery}
          surfaceId={surfaceId}
          isSubmenu={isSubmenu}
          contentRef={contentRef}
          popupProps={popupProps}
          handleMouseMove={handleMouseMove}
          onClose={onClose}
          control={control}
        >
          <Popup>
            {Header}
            {Input}
            <List onTypeStart={handleTypeStart} />
            {Footer}
          </Popup>
        </SurfaceProvider>
      </HoverPolicyProvider>
    </KeyboardCtx.Provider>
  )

  if (!existingFocusOwnerCtx) {
    return (
      <FocusOwnerCtx.Provider value={localFocusOwnerValue}>
        {content}
      </FocusOwnerCtx.Provider>
    )
  }

  return content
}
