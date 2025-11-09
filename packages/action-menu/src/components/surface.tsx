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
  useRootCtx,
  useScopedTheme,
  useSubCtx,
} from '../contexts/index.js'
import { cn } from '../lib/cn.js'
import { isInBounds } from '../lib/dom-utils.js'
import { INPUT_VISIBILITY_CHANGE_EVENT } from '../lib/events.js'
import { getDir } from '../lib/keyboard.js'
import { instantiateMenuFromDef } from '../lib/menu-utils.js'
import { mergeProps } from '../lib/merge-props.js'
import { isElementWithProp } from '../lib/react-utils.js'
import { createSurfaceStore } from '../store/surface-store.js'
import type {
  ActionMenuSurfaceProps,
  ContentBindAPI,
  Menu,
  MenuDef,
  MenuNodeDefaults,
  SurfaceStore,
} from '../types.js'
import { Input } from './input.js'
import { List } from './list.js'

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
  const open = React.useMemo(() => (sub ? sub.open : root.open), [isSub, root])
  const surfaceId = React.useMemo(
    () => surfaceIdProp ?? sub?.childSurfaceId ?? 'root',
    [surfaceIdProp, sub],
  )
  const menu = React.useMemo<Menu<T>>(() => {
    if ((menuProp as any)?.surfaceId) return menuProp as Menu<T>
    // depth: root = 0, submenu = parent.depth + 1 (if you have access to parent via sub)
    const depth = sub ? 1 : 0
    return instantiateMenuFromDef(menuProp as MenuDef<T>, surfaceId, depth)
  }, [
    menuProp,
    surfaceId,
    sub,
    // Re-instantiate when async loader data changes
    (menuProp as MenuDef<T>)?.loader?.data,
    (menuProp as MenuDef<T>)?.loader?.isLoading,
    (menuProp as MenuDef<T>)?.loader?.isError,
  ])
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

  const [value, setValue] = useControllableState({
    prop: menu.input?.value,
    defaultProp: menu.input?.defaultValue ?? '',
    onChange: menu.input?.onValueChange,
  })

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
      query={value}
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
