import {
  type AsyncNodeLoader,
  createSurfaceStore,
  type MenuDef,
  type MenuNodeDefaults,
  type SubmenuDef,
  useFilteredNodes,
  useInputActivation,
  useLoader,
  useMenu,
} from '@bazza-ui/menu'
import { mergeProps } from '@bazza-ui/theming'
import { composeRefs } from '@radix-ui/react-compose-refs'
import * as React from 'react'
import { FocusOwnerCtx } from '../../contexts/focus-owner-context.js'
import { KeyboardCtx } from '../../contexts/keyboard-context.js'
import { useRoot } from '../../contexts/root-context.js'
import { useScopedTheme } from '../../contexts/theme-context.js'
import { HoverPolicyProvider } from '../../features/hover-policy/hover-policy-context.js'
import { useNavKeydown } from '../../hooks/use-nav-keydown.js'
import type {
  ContentBindAPI,
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
  }, [open, isOwner, store])

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

  const handleKeyDown = useNavKeydown(surfaceId, onClose)

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
  const contentBind: ContentBindAPI = React.useMemo(() => {
    return {
      getContentProps: (overrides) => {
        const baseUIRef = (popupProps as any)?.ref
        const composedRef = baseUIRef
          ? composeRefs(contentRef as any, baseUIRef)
          : contentRef

        return mergeProps(
          {
            role: 'menu' as const,
            tabIndex: -1,
            'data-slot': isSubmenu
              ? 'popup-menu-submenu-content'
              : 'popup-menu-content',
            'data-popup-menu-surface': true,
            'data-root-menu': isSubmenu ? undefined : true,
            'data-sub-menu': isSubmenu ? 'true' : undefined,
            'data-surface-id': surfaceId,
            ...slotProps?.content,
            ...popupProps,
            onMouseMove: handleMouseMove,
            className: classNames?.content,
            ref: composedRef,
            onKeyDown: handleKeyDown,
          },
          overrides,
        ) as any
      },
    }
  }, [
    popupProps,
    contentRef,
    isSubmenu,
    surfaceId,
    slotProps?.content,
    handleMouseMove,
    classNames?.content,
    handleKeyDown,
  ])

  // --- 9. COMPONENTS ---
  const Header = () =>
    slots.Header ? (
      <div data-slot="popup-menu-header" {...(slotProps?.header as any)}>
        {slots.Header({
          menu: orchestratedMenu as any,
          loadMode: orchestratedMenu.loadingState?.loadMode,
        })}
      </div>
    ) : null

  const Input = () => {
    return inputActive ? (
      <PopupMenuInput
        store={store}
        value={query}
        onValueChange={setQuery}
        placeholder={placeholder ?? menu.inputPlaceholder ?? 'Search...'}
      />
    ) : null
  }

  const Footer = () =>
    slots.Footer ? (
      <div data-slot="popup-menu-footer" {...(slotProps?.footer as any)}>
        {slots.Footer({ menu: orchestratedMenu as any })}
      </div>
    ) : null

  // --- 10. RENDER ---
  const content = (
    <KeyboardCtx.Provider value={{ dir, vimBindings }}>
      <HoverPolicyProvider>
        <SurfaceProvider
          store={store}
          menu={orchestratedMenu}
          displayNodes={displayNodes}
          slots={slots}
          classNames={classNames}
          slotProps={slotProps}
          inputActive={inputActive}
          setInputActive={setInputActive}
          query={query}
          setQuery={setQuery}
        >
          <Popup bind={contentBind}>
            <Header />
            <Input />
            <List onTypeStart={handleTypeStart} />
            <Footer />
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
