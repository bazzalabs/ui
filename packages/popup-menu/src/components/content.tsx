import type { MenuDef, MenuNodeDefaults } from '@bazza-ui/menu'
import { useInputActivation } from '@bazza-ui/menu'
import { mergeProps } from '@bazza-ui/theming'
import { composeRefs } from '@radix-ui/react-compose-refs'
import * as React from 'react'
import { useRoot } from '../contexts/root-context.js'
import { useSub } from '../contexts/submenu-context.js'
import {
  ScopedThemeProvider,
  useScopedTheme,
} from '../contexts/theme-context.js'
import type { ContentBindAPI, PopupMenuDef, PopupSubmenuDef } from '../types.js'
import { PopupMenuInput } from './input.js'
import { PopupMenuList } from './list.js'

export interface PopupMenuContentProps<T = unknown> {
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
}

/**
 * PopupMenuContent renders the menu content with optional input activation.
 * This component is the "Surface" - it renders input (conditionally) and list.
 * This component is used by both context-menu and dropdown-menu packages.
 */
export function PopupMenuContent<T = unknown>({
  menu,
  open = true,
  onClose,
  vimBindings = true,
  dir = 'ltr',
  contentRef,
  placeholder,
  popupProps,
  defaults,
}: PopupMenuContentProps<T>) {
  const { slots, classNames, slotProps } = useScopedTheme()
  const subCtx = useSub()
  const isSubmenu = !!subCtx
  const rootCtx = useRoot()

  // Register/unregister this surface for tracking
  React.useEffect(() => {
    if (!open) return

    const surfaceId = isSubmenu ? subCtx?.childSurfaceId : 'root'
    if (!surfaceId) return

    // Calculate depth: root = 0, submenus get parent depth + 1
    // For now, we'll use a simple approach: root = 0, submenus = 1
    // In the future, we could track depth more precisely through context
    const depth = isSubmenu ? 1 : 0

    rootCtx.registerSurface(surfaceId, depth)
    return () => {
      rootCtx.unregisterSurface(surfaceId)
    }
  }, [rootCtx, isSubmenu, subCtx?.childSurfaceId, open])

  // Listen for close events (mirrors action-menu pattern)
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

  // Input activation hook
  const hideSearchUntilActive = menu.hideSearchUntilActive ?? false
  const { inputActive, query, setQuery, setInputActive } = useInputActivation(
    hideSearchUntilActive,
  )

  // Store reference to input ref for focusing when activated
  const storeInputRef = React.useRef<React.RefObject<HTMLInputElement> | null>(
    null,
  )
  // Track previous inputActive state to detect transitions
  const prevInputActiveRef = React.useRef(inputActive)

  // Callback when user starts typing on the list - activate input and set query
  const handleTypeStart = React.useCallback(
    (seed: string) => {
      if (!inputActive) {
        setInputActive(true)
        setQuery(seed)
      }
    },
    [inputActive, setInputActive, setQuery],
  )

  // Focus the input only when it transitions from inactive to active (user started typing)
  React.useEffect(() => {
    // Only focus if inputActive changed from false to true (not on initial render or submenu open)
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

  // Apply scoped theme from menu.ui
  const submenuTheme = React.useMemo(() => menu.ui as any, [menu.ui])

  return (
    <ScopedThemeProvider theme={submenuTheme}>
      <PopupMenuList
        menu={menu}
        query={query}
        open={open}
        vimBindings={vimBindings}
        dir={dir}
        onClose={onClose}
        onTypeStart={handleTypeStart}
        contentRef={contentRef}
        defaults={defaults}
        isSubmenu={isSubmenu}
        subCtx={subCtx}
      >
        {(
          store,
          surfaceProps,
          listElement,
          orchestratedMenu,
          handleKeyDown,
        ) => {
          // Keep track of the store's inputRef for focus management
          storeInputRef.current = store.inputRef

          // Create bind API for content with surfaceProps
          const contentBind: ContentBindAPI = {
            getContentProps: (overrides) => {
              // Compose refs to avoid Base UI's ref overwriting our contentRef
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
                  'data-surface-id': isSubmenu
                    ? subCtx?.childSurfaceId
                    : 'root',
                  ...slotProps?.content,
                  ...popupProps, // Spread Base UI popup props (may contain a ref)
                  ...surfaceProps, // Add mouse move handler
                  className: classNames?.content,
                  // Apply composed ref last to ensure it's not overwritten
                  ref: composedRef,
                  onKeyDown: handleKeyDown, // Centralized keyboard handler - must be last to avoid being overwritten
                },
                overrides,
              ) as any
            },
          }

          // Render Header slot if provided
          const headerEl = slots.Header ? (
            <div data-slot="popup-menu-header" {...(slotProps?.header as any)}>
              {slots.Header({
                menu: orchestratedMenu,
                loadMode: orchestratedMenu.loadingState?.loadMode,
              })}
            </div>
          ) : null

          // Render Footer slot if provided
          const footerEl = slots.Footer ? (
            <div data-slot="popup-menu-footer" {...(slotProps?.footer as any)}>
              {slots.Footer({ menu: orchestratedMenu })}
            </div>
          ) : null

          return slots.Content({
            children: (
              <>
                {headerEl}
                {inputActive ? (
                  <PopupMenuInput
                    store={store}
                    value={query}
                    onValueChange={setQuery}
                    placeholder={
                      placeholder ?? menu.inputPlaceholder ?? 'Search...'
                    }
                  />
                ) : null}
                {listElement}
                {footerEl}
              </>
            ),
            bind: contentBind,
          })
        }}
      </PopupMenuList>
    </ScopedThemeProvider>
  )
}
