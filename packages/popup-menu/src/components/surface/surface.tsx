import {
  type MenuControl,
  type MenuNodeDefaults,
  type RootMenuDef,
  type SubmenuDef,
  useMenuPipeline,
} from '@bazza-ui/menu'
import * as React from 'react'
import { FocusOwnerCtx } from '../../contexts/focus-owner-context.js'
import { KeyboardCtx } from '../../contexts/keyboard-context.js'
import { useRoot } from '../../contexts/root-context.js'
import { useScopedTheme } from '../../contexts/theme-context.js'
import { HoverPolicyProvider } from '../../features/hover-policy/hover-policy-context.js'
import { useSurfaceEffects } from '../../hooks/use-surface-effects.js'
import { usePopupMenuActions, useSurfaceRefs } from '../../store/index.js'
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
 *
 * Uses the unified menu pipeline for state management and
 * consolidated effects for store synchronization.
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
  // ============================================================================
  // Context & Setup
  // ============================================================================
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

  // Get surface refs from store
  const surfaceRefs = useSurfaceRefs(surfaceId)

  // ============================================================================
  // Pipeline: Unified Menu State Management
  // ============================================================================
  const pipeline = useMenuPipeline<T>({
    menuDef: menu as RootMenuDef<T> | SubmenuDef<T>,
    open,
    surfaceId,
    isSubmenu,
    defaults,
    control,
    query: queryProp,
  })

  const {
    inputActive,
    setInputActive,
    query,
    setQuery,
    menu: orchestratedMenu,
    displayNodes,
  } = pipeline

  // ============================================================================
  // Store Effects: Sync Pipeline State to Global Store
  // ============================================================================
  const storeActions = usePopupMenuActions()

  useSurfaceEffects({
    surfaceId,
    open,
    isSubmenu,
    menu: orchestratedMenu,
    displayNodes,
    query,
    inputActive,
    storeActions,
    registerSurface: rootCtx.registerSurface,
    unregisterSurface: rootCtx.unregisterSurface,
  })

  // ============================================================================
  // Focus Management
  // (Kept separate from pipeline as it requires DOM refs)
  // ============================================================================
  const existingFocusOwnerCtx = React.useContext(FocusOwnerCtx)
  const [localOwnerId, setLocalOwnerId] = React.useState<string | null>(null)
  const localFocusOwnerValue = React.useMemo(
    () => ({ ownerId: localOwnerId, setOwnerId: setLocalOwnerId }),
    [localOwnerId],
  )
  const { ownerId, setOwnerId } = existingFocusOwnerCtx || localFocusOwnerValue

  // Claim focus ownership when menu opens
  React.useEffect(() => {
    if (!open && !isSubmenu) {
      setOwnerId(null)
      return
    }
    // Wait for surfaceRefs to be available before focusing
    if (open && ownerId === null && surfaceRefs) {
      setOwnerId(surfaceId)
      requestAnimationFrame(() => {
        const element =
          surfaceRefs.inputRef.current ?? surfaceRefs.listRef.current
        element?.focus()
      })
    }
  }, [open, ownerId, surfaceId, surfaceRefs, setOwnerId, isSubmenu])

  // Re-focus when becoming owner
  const isOwner = ownerId === surfaceId
  React.useEffect(() => {
    if (!open || !isOwner || !surfaceRefs) {
      return
    }
    const activeElement = document.activeElement
    const inputHasFocus = surfaceRefs.inputRef.current === activeElement
    const listHasFocus = surfaceRefs.listRef.current === activeElement
    if (inputHasFocus || listHasFocus) {
      return
    }

    const id = requestAnimationFrame(() => {
      const element =
        surfaceRefs.inputRef.current ?? surfaceRefs.listRef.current
      element?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [open, isOwner, surfaceRefs])

  // ============================================================================
  // Interaction Handlers
  // ============================================================================
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

  // Type start handler for hideSearchUntilActive
  const handleTypeStart = React.useCallback(
    (seed: string) => {
      if (!inputActive && ownerId === surfaceId) {
        setInputActive(true)
        setQuery(seed)

        // Focus the input after it mounts - use polling to handle race condition
        let attempts = 0
        const maxAttempts = 10

        const tryFocus = () => {
          if (surfaceRefs?.inputRef.current) {
            surfaceRefs.inputRef.current.focus()
          } else if (attempts < maxAttempts) {
            attempts++
            requestAnimationFrame(tryFocus)
          }
        }

        requestAnimationFrame(tryFocus)
      }
    },
    [inputActive, ownerId, surfaceId, setInputActive, setQuery, surfaceRefs],
  )

  // Close listener for submenus
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

  // ============================================================================
  // Render Components
  // ============================================================================
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
      value={query}
      onValueChange={setQuery}
      placeholder={placeholder}
    />
  ) : null

  const Footer = slots.Footer ? (
    <div data-slot="popup-menu-footer" {...(slotProps?.footer as any)}>
      {slots.Footer({ menu: orchestratedMenu as any })}
    </div>
  ) : null

  // ============================================================================
  // Render
  // ============================================================================
  // Check for custom render function (escape hatch)
  const customRender = (menu as any).render || (orchestratedMenu as any).render

  const content = customRender ? (
    // Custom render mode - bypass Popup wrapper, render directly in SurfaceProvider
    <KeyboardCtx.Provider value={{ dir, vimBindings }}>
      <HoverPolicyProvider>
        <SurfaceProvider
          surfaceId={surfaceId}
          isSubmenu={isSubmenu}
          control={control}
          slots={slots as any}
          classNames={classNames}
          slotProps={slotProps}
          contentRef={contentRef}
          popupProps={popupProps}
          handleMouseMove={handleMouseMove}
          onClose={onClose}
        >
          <Popup>{customRender()}</Popup>
        </SurfaceProvider>
      </HoverPolicyProvider>
    </KeyboardCtx.Provider>
  ) : (
    // Standard render mode
    <KeyboardCtx.Provider value={{ dir, vimBindings }}>
      <HoverPolicyProvider>
        <SurfaceProvider
          surfaceId={surfaceId}
          isSubmenu={isSubmenu}
          control={control}
          slots={slots as any}
          classNames={classNames}
          slotProps={slotProps}
          contentRef={contentRef}
          popupProps={popupProps}
          handleMouseMove={handleMouseMove}
          onClose={onClose}
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
