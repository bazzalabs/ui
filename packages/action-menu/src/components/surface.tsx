/** biome-ignore-all lint/a11y/useSemanticElements: This library renders ARIA-only primitives intentionally. */

import { composeRefs } from '@radix-ui/react-compose-refs'
import { Primitive } from '@radix-ui/react-primitive'
import { useControllableState } from '@radix-ui/react-use-controllable-state'
import * as React from 'react'
import {
  HoverPolicyCtx,
  KeyboardCtx,
  SurfaceCtx,
  SurfaceIdCtx,
  useDisplayMode,
  useFocusOwner,
  useLoaderAdapter,
  useRootCtx,
  useScopedTheme,
  useSubCtx,
} from '../contexts/index.js'
import { useDebounced } from '../hooks/use-debounced.js'
import { cn } from '../lib/cn.js'
import {
  aggregateLoaderResults,
  collectDeepSearchLoaders,
  injectLoaderResults,
} from '../lib/deep-search-utils.js'
import { isInBounds } from '../lib/dom-utils.js'
import { INPUT_VISIBILITY_CHANGE_EVENT } from '../lib/events.js'
import { getDir } from '../lib/keyboard.js'
import { instantiateMenuFromDef } from '../lib/menu-utils.js'
import { mergeProps } from '../lib/merge-props.js'
import { isElementWithProp } from '../lib/react-utils.js'
import { createSurfaceStore } from '../store/surface-store.js'
import type {
  ActionMenuSurfaceProps,
  AsyncNodeLoaderContext,
  ContentBindAPI,
  Menu,
  MenuDef,
  MenuNodeDefaults,
  SurfaceStore,
} from '../types.js'
import { Input } from './input.js'
import { List } from './list.js'

/**
 * Normalizes minLength configuration to separate local and deep thresholds.
 * - number: Applies to deep search only, local is immediate (0)
 * - object: Use specified values, default to 0
 * - undefined: Both default to 0
 */
function normalizeMinLength(
  minLength: number | { local?: number; deep?: number } | undefined,
): { local: number; deep: number } {
  if (minLength === undefined) {
    return { local: 0, deep: 0 }
  }
  if (typeof minLength === 'number') {
    // Number applies to deep search only, local is immediate (0)
    return { local: 0, deep: minLength }
  }
  // Object form: use specified values, default to 0
  return {
    local: minLength.local ?? 0,
    deep: minLength.deep ?? 0,
  }
}

export const Surface = React.forwardRef(function Surface<T>(
  {
    menu: menuProp,
    render: renderProp,
    vimBindings = true,
    dir: dirProp,
    surfaceIdProp,
    suppressHoverOpenOnMount,
    defaults: defaultsOverrides,
    onOpenAutoFocus = true, // reserved
    onCloseAutoClear = 300,
    ...props
  }: ActionMenuSurfaceProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const root = useRootCtx()
  const sub = useSubCtx()
  const isSub = React.useMemo(() => sub !== null, [sub])
  const open = React.useMemo(
    () => (sub ? sub.open : root.open),
    [sub, sub?.open, root, root.open],
  )
  const surfaceId = React.useMemo(
    () => surfaceIdProp ?? sub?.childSurfaceId ?? 'root',
    [surfaceIdProp, sub],
  )

  // Initialize value state before menu (since menu depends on value for function loaders)
  const [value, setValue] = useControllableState({
    prop: (menuProp as MenuDef<T>).input?.value,
    defaultProp: (menuProp as MenuDef<T>).input?.defaultValue ?? '',
    onChange: (menuProp as MenuDef<T>).input?.onValueChange,
  })

  // Apply search configuration (debounce and minLength)
  const searchConfig = React.useMemo(() => {
    const menuDef = (menuProp as any)?.surfaceId
      ? (menuProp as Menu<T>)
      : (menuProp as MenuDef<T>)
    return menuDef.search ?? {}
  }, [menuProp])

  const debouncedValue = useDebounced(value, searchConfig.debounce ?? 0)

  // Apply minLength threshold - only pass query to loaders if it meets the minimum length
  const effectiveQuery = React.useMemo(() => {
    const { local } = normalizeMinLength(searchConfig.minLength)
    return debouncedValue.length >= local ? debouncedValue : ''
  }, [debouncedValue, searchConfig.minLength])

  // Get the loader adapter (always returns an adapter, defaults to NativeLoaderAdapter)
  const loaderAdapter = useLoaderAdapter()

  // Extract the loader from the menu
  const menuLoader = React.useMemo(() => {
    // IMPORTANT: If this is a submenu Surface, use the original loader (before deep search injection)
    // This prevents using cached deep search results when the submenu is opened
    if (sub?.def) {
      const submenuDef = sub.def as any
      // Use __originalLoader if it exists (set by deep search injection), otherwise use loader
      return submenuDef.__originalLoader || submenuDef.loader
    }

    // Check if it's already a Menu instance
    if ((menuProp as any)?.surfaceId) {
      const menu = menuProp as Menu<T>
      return menu.loader
    }

    // It's a MenuDef
    const menuDef = menuProp as MenuDef<T>
    return menuDef.loader
  }, [menuProp, sub])

  // Create loader context
  const loaderContext = React.useMemo<AsyncNodeLoaderContext>(
    () => ({ query: effectiveQuery, open }),
    [effectiveQuery, open],
  )

  // Execute the loader using the adapter (always defined, never null)
  const finalLoaderResult = loaderAdapter.useLoader(menuLoader, loaderContext)

  // Collect deep search loaders from the menu tree (respecting Rules of Hooks)
  const deepSearchLoaderEntries = React.useMemo(() => {
    const menuDef = menuProp as MenuDef<T>
    if ((menuProp as any)?.surfaceId) return [] // Already a Menu instance
    // Collect deep search loaders when there's any query (we'll filter per-submenu minLength later)
    // Don't use effectiveQuery here - submenus may have different minLength values
    if (!debouncedValue) return []
    return collectDeepSearchLoaders(menuDef)
  }, [menuProp, debouncedValue])

  // Prepare deep search loader configs for parallel execution
  // Each loader gets its own context with effectiveQuery calculated from its own minLength
  // IMPORTANT: Filter out loaders that don't meet their minLength threshold
  const deepSearchLoaderConfigs = React.useMemo(() => {
    // Get the root menu's deep threshold
    const rootDeepThreshold = normalizeMinLength(searchConfig.minLength).deep

    return deepSearchLoaderEntries
      .map((entry) => {
        // Each submenu can have its own minLength config
        const submenuMinLength = normalizeMinLength(
          entry.searchConfig?.minLength,
        )

        // Use the submenu's deep threshold, or fall back to root's deep threshold
        const effectiveDeepThreshold =
          entry.searchConfig?.minLength !== undefined
            ? submenuMinLength.deep
            : rootDeepThreshold

        const meetsMinLength = debouncedValue.length >= effectiveDeepThreshold

        // Only include this loader if the query meets its minLength
        if (!meetsMinLength) {
          return null
        }

        return {
          path: entry.path,
          loader: entry.loader,
          context: { query: debouncedValue, open },
        }
      })
      .filter((config): config is NonNullable<typeof config> => config !== null)
  }, [deepSearchLoaderEntries, debouncedValue, open, searchConfig.minLength])

  // Execute all deep search loaders using the adapter (always defined, never null)
  const deepSearchLoaderResults = loaderAdapter.useLoaders(
    deepSearchLoaderConfigs,
  )

  // Aggregate deep search loader states
  const aggregatedState = React.useMemo(() => {
    if (deepSearchLoaderResults.size === 0) return null
    const menuDef = menuProp as MenuDef<T>
    return aggregateLoaderResults(deepSearchLoaderResults, menuDef)
  }, [deepSearchLoaderResults, menuProp])

  const menu = React.useMemo<Menu<T>>(() => {
    // If it's already a Menu instance and we have a new loader result, rebuild it
    if ((menuProp as any)?.surfaceId) {
      const existingMenu = menuProp as Menu<T>

      // If we resolved a new loader result, rebuild the menu with it
      if (finalLoaderResult) {
        const depth = sub ? 1 : 0

        // Create a MenuDef from the existing Menu
        const menuDefFromExisting: MenuDef<T> = {
          ...(existingMenu as any),
          loader: finalLoaderResult, // Use the new loader result
        }

        return instantiateMenuFromDef(menuDefFromExisting, surfaceId, depth)
      }

      // No new loader result, return existing menu as-is
      return existingMenu
    }

    // It's a MenuDef, proceed with normal instantiation
    const depth = sub ? 1 : 0

    // Start with the menu def
    let resolvedMenuDef = { ...menuProp } as MenuDef<T>

    // IMPORTANT: Only inject deep search results in the ROOT menu, not in submenus
    // When a submenu is opened, it should use its own loader function with its own query,
    // not the cached deep search results from the parent menu's query
    if (!sub && aggregatedState && aggregatedState.results.size > 0) {
      resolvedMenuDef = injectLoaderResults(
        resolvedMenuDef,
        aggregatedState.results,
      )
    }

    // Then apply the main loader result
    if (finalLoaderResult) {
      resolvedMenuDef.loader = finalLoaderResult
    }

    const instantiatedMenu = instantiateMenuFromDef(
      resolvedMenuDef,
      surfaceId,
      depth,
    )

    // If we have aggregated loading state, merge it with the menu's loading state
    // Only apply this to root menus (submenus should have their own independent loading state)
    if (!sub && aggregatedState) {
      return {
        ...instantiatedMenu,
        loadingState: {
          ...instantiatedMenu.loadingState,
          isLoading:
            instantiatedMenu.loadingState?.isLoading ||
            aggregatedState.isLoading,
          isFetching:
            instantiatedMenu.loadingState?.isFetching ||
            aggregatedState.isFetching,
          // Keep isError from main loader only (we fail silently on deep search loaders)
          progress: aggregatedState.progress,
        },
      }
    }

    return instantiatedMenu
  }, [menuProp, surfaceId, sub, finalLoaderResult, aggregatedState])

  const mode = useDisplayMode()
  const { ownerId, setOwnerId } = useFocusOwner()
  const isOwner = ownerId === surfaceId
  const surfaceRef = React.useRef<HTMLDivElement | null>(null)
  const composedRef = composeRefs(
    ref,
    surfaceRef,
    sub ? (sub.contentRef as any) : undefined,
  )
  const dir = getDir(dirProp)

  // Clear input on menu close
  const clearTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    // Clear any existing timeout
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current)
      clearTimeoutRef.current = null
    }

    if (!open && onCloseAutoClear) {
      if (typeof onCloseAutoClear === 'number') {
        // Schedule timeout that persists after component unmounts
        clearTimeoutRef.current = setTimeout(() => {
          // Call the onChange handler directly since component may be unmounted
          setValue('')
          clearTimeoutRef.current = null
        }, onCloseAutoClear)
      } else {
        // Clear immediately
        setValue('')
      }
    }

    // Cleanup: clear timeout on unmount
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current)
        clearTimeoutRef.current = null
      }
    }
  }, [root.open, sub?.open, onCloseAutoClear, setValue])

  const { slots, slotProps, classNames } = useScopedTheme<T>()

  const defaults = React.useMemo<Partial<MenuNodeDefaults<T>>>(
    () => ({ ...defaultsOverrides, ...(menu.defaults ?? {}) }),
    [defaultsOverrides, menu.defaults],
  )

  const isSubmenu = !!sub
  const [inputActive, setInputActive] = React.useState(
    !menu.hideSearchUntilActive,
  )

  // Notify (e.g., Positioner) when input visibility changes
  React.useLayoutEffect(() => {
    const target: EventTarget =
      surfaceRef.current ??
      (typeof document !== 'undefined' ? document : ({} as any))
    target.dispatchEvent(
      new CustomEvent(INPUT_VISIBILITY_CHANGE_EVENT, {
        bubbles: true,
        composed: true,
        detail: {
          surfaceId,
          hideSearchUntilActive: menu.hideSearchUntilActive,
          inputActive,
        },
      }),
    )
  }, [inputActive, menu.hideSearchUntilActive])

  // Create per-surface store once
  const storeRef = React.useRef<SurfaceStore<T> | null>(null)
  if (!storeRef.current) {
    storeRef.current = createSurfaceStore()
  }
  const store = storeRef.current

  React.useEffect(() => {
    store.set('hasInput', inputActive)
  }, [inputActive, store])

  React.useEffect(() => {
    root.registerSurface(surfaceId, menu.depth)

    return () => {
      root.unregisterSurface(surfaceId)
    }
  }, [root.registerSurface, root.unregisterSurface, surfaceId, menu.depth])

  React.useEffect(() => {
    const handle = () => {
      sub?.onOpenChange(false)
    }
    document.addEventListener('actionmenu-close', handle, true)
    return () => {
      document.removeEventListener('actionmenu-close', handle, true)
    }
  }, [sub?.onOpenChange])

  // On open, claim focus ownership for the first surface and focus input/list.
  React.useEffect(() => {
    if (!root.open) {
      setOwnerId(null)
      return
    }
    if (root.open && ownerId === null) {
      setOwnerId(surfaceId)
      ;(store.inputRef.current ?? store.listRef.current)?.focus()
    }
  }, [root.open, ownerId, surfaceId, setOwnerId, store.inputRef, store.listRef])

  // Keep focus on input/list after re-render when we own focus
  React.useEffect(() => {
    if (!root.open || !isOwner) return
    const id = requestAnimationFrame(() => {
      ;(store.inputRef.current ?? store.listRef.current)?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [root.open, isOwner, store.inputRef, store.listRef])

  const [suppressHoverOpen, setSuppressHoverOpen] = React.useState(
    !!suppressHoverOpenOnMount,
  )
  const clearSuppression = React.useCallback(() => {
    if (suppressHoverOpen) setSuppressHoverOpen(false)
  }, [suppressHoverOpen])

  const [aimGuardActive, setAimGuardActive] = React.useState(false)
  const [guardedTriggerId, setGuardedTriggerId] = React.useState<string | null>(
    null,
  )
  const aimGuardActiveRef = React.useRef(false)
  const guardedTriggerIdRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    aimGuardActiveRef.current = aimGuardActive
  }, [aimGuardActive])
  React.useEffect(() => {
    guardedTriggerIdRef.current = guardedTriggerId
  }, [guardedTriggerId])
  const guardTimerRef = React.useRef<number | null>(null)
  const clearAimGuard = React.useCallback(() => {
    if (guardTimerRef.current) {
      window.clearTimeout(guardTimerRef.current)
      guardTimerRef.current = null
    }
    aimGuardActiveRef.current = false
    guardedTriggerIdRef.current = null
    setAimGuardActive(false)
    setGuardedTriggerId(null)
  }, [])
  const activateAimGuard = React.useCallback(
    (triggerId: string, timeoutMs = 450) => {
      aimGuardActiveRef.current = true
      guardedTriggerIdRef.current = triggerId
      setGuardedTriggerId(triggerId)
      setAimGuardActive(true)
      if (guardTimerRef.current) window.clearTimeout(guardTimerRef.current)
      guardTimerRef.current = window.setTimeout(() => {
        aimGuardActiveRef.current = false
        guardedTriggerIdRef.current = null
        setAimGuardActive(false)
        setGuardedTriggerId(null)
        guardTimerRef.current = null
      }, timeoutMs) as any
    },
    [],
  )
  const isGuardBlocking = React.useCallback(
    (rowId: string) =>
      aimGuardActiveRef.current && guardedTriggerIdRef.current !== rowId,
    [],
  )

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      clearSuppression()
      const rect = (
        surfaceRef.current as HTMLElement | null
      )?.getBoundingClientRect()
      if (!rect || !isInBounds(e.clientX, e.clientY, rect)) return
      setOwnerId(surfaceId)
    },
    [clearSuppression, surfaceId, setOwnerId],
  )

  const baseContentProps = React.useMemo(
    () =>
      ({
        ref: composedRef,
        role: 'menu',
        tabIndex: -1,
        'data-slot': 'action-menu-content',
        'data-root-menu': isSubmenu ? undefined : true,
        'data-sub-menu': isSubmenu ? 'true' : undefined,
        'data-state': root.open ? 'open' : 'closed',
        'data-action-menu-surface': true as const,
        'data-surface-id': surfaceId,
        'data-mode': mode,
        className: classNames?.content,
        onMouseMove: handleMouseMove,
        ...props,
      }) as const,
    [
      composedRef,
      isSubmenu,
      root.open,
      surfaceId,
      mode,
      classNames?.content,
      handleMouseMove,
      props,
    ],
  )

  const contentBind: ContentBindAPI = React.useMemo(
    () => ({
      getContentProps: (overrides) =>
        mergeProps(
          baseContentProps as any,
          mergeProps(slotProps?.content as any, overrides as any),
        ),
    }),
    [baseContentProps, slotProps?.content],
  )

  const headerEl = slots.Header ? (
    <div
      data-slot="action-menu-header"
      {...(slotProps?.header as any)}
      className={cn(
        'data-[slot=action-menu-header]:block',
        slotProps?.header?.className,
      )}
    >
      {slots.Header({ menu })}
    </div>
  ) : null

  const inputEl = inputActive ? (
    <Input<T>
      store={store}
      value={value}
      onChange={setValue}
      slot={slots.Input}
      slotProps={slotProps?.input}
      className={classNames?.input}
      inputPlaceholder={menu.inputPlaceholder}
    />
  ) : null

  const listEl = (
    <List<T>
      store={store}
      menu={menu}
      query={effectiveQuery}
      defaults={defaults}
      inputActive={inputActive}
      onTypeStart={(seed) => {
        if (!inputActive && ownerId === surfaceId) {
          setInputActive(true)
          setValue(seed)
          requestAnimationFrame(() => {
            store.inputRef.current?.focus()
          })
        }
      }}
    />
  )

  const footerEl = slots.Footer ? (
    <div
      data-slot="action-menu-footer"
      {...(slotProps?.footer as any)}
      className={cn(
        'data-[slot=action-menu-footer]:block',
        slotProps?.footer?.className,
      )}
    >
      {slots.Footer({ menu })}
    </div>
  ) : null

  const childrenNoProvider = (
    <>
      {headerEl}
      {inputEl}
      {listEl}
      {footerEl}
    </>
  )

  const body =
    isSubmenu && renderProp
      ? renderProp()
      : slots.Content({
          menu,
          children: childrenNoProvider,
          bind: contentBind,
        })

  const wrapped = !isElementWithProp(body, 'data-action-menu-surface') ? (
    <Primitive.div {...(contentBind.getContentProps() as any)}>
      <SurfaceCtx.Provider value={store}>{body}</SurfaceCtx.Provider>
    </Primitive.div>
  ) : (
    <SurfaceCtx.Provider value={store}>{body}</SurfaceCtx.Provider>
  )

  const keyboardCtxValue = React.useMemo(
    () => ({ dir, vimBindings }),
    [dir, vimBindings],
  )

  const hoverPolicyValue = React.useMemo(
    () => ({
      suppressHoverOpen,
      clearSuppression,
      aimGuardActive,
      guardedTriggerId,
      activateAimGuard,
      clearAimGuard,
      aimGuardActiveRef,
      guardedTriggerIdRef,
      isGuardBlocking,
    }),
    [
      suppressHoverOpen,
      clearSuppression,
      aimGuardActive,
      guardedTriggerId,
      activateAimGuard,
      clearAimGuard,
      isGuardBlocking,
    ],
  )

  return (
    <KeyboardCtx.Provider value={keyboardCtxValue}>
      <SurfaceIdCtx.Provider value={surfaceId}>
        <HoverPolicyCtx.Provider value={hoverPolicyValue}>
          {wrapped}
        </HoverPolicyCtx.Provider>
      </SurfaceIdCtx.Provider>
    </KeyboardCtx.Provider>
  )
}) as <T>(
  p: ActionMenuSurfaceProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => ReturnType<typeof Primitive.div>
