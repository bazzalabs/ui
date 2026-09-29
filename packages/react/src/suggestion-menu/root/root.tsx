'use client'

import { Popover, type PopoverRootProps } from '@base-ui/react/popover'
import * as React from 'react'
import type { ListboxStore, VirtualItem } from '../../internal/listbox/index.js'
import {
  type PopupMenuHighlightChangeHandler,
  PopupMenuProviders,
  type UsePopupMenuRootParams,
  usePopupMenuRoot,
} from '../../internal/popup-menu/index.js'
import type {
  GetResolvedIdFn,
  PopupMenuIdScope,
} from '../../internal/popup-menu/menu-tree/types.js'
import type {
  SuggestionMenuHighlightChangeEventDetails,
  SuggestionMenuOpenChangeEventDetails,
  SuggestionMenuOpenChangeReason,
} from '../events.js'
import type { SuggestionMenuAnchor, SuggestionMenuHandle } from '../handle.js'
import { SuggestionMenuRootContext } from './root-context.js'

/** What the Root's `children` function receives. */
export interface SuggestionMenuRootRenderState<Payload = unknown> {
  /** The payload from the last `update()`. */
  payload: Payload | undefined
  /** The current query. */
  query: string
}

export interface SuggestionMenuRootProps<Payload = unknown>
  extends Omit<
    PopoverRootProps,
    | 'open'
    | 'onOpenChange'
    | 'defaultOpen'
    | 'actionsRef'
    | 'modal'
    | 'handle'
    | 'triggerId'
    | 'children'
  > {
  /** Connects the menu to its host input. Create it with `SuggestionMenu.createHandle()`. */
  handle: SuggestionMenuHandle<Payload>
  /**
   * Whether the menu is open, for controlled use. When set, `update()`,
   * `close()` and the menu's own dismissals become `onOpenChange` requests.
   */
  open?: boolean
  /**
   * Whether the menu is initially open, for uncontrolled use.
   * @default false
   */
  defaultOpen?: boolean
  /** Called when the menu asks to open or close, with the reason. */
  onOpenChange?: (
    open: boolean,
    eventDetails: SuggestionMenuOpenChangeEventDetails,
  ) => void
  /**
   * The query, for controlled use. When set, it wins over the handle's
   * `update({ query })`. The menu never changes the query itself.
   */
  query?: string
  /**
   * Measures where the popup is anchored, for controlled use. When set, it
   * wins over the handle's `update({ anchor })`.
   */
  anchor?: SuggestionMenuAnchor
  /**
   * Whether virtualization mode is enabled. Wire your virtualizer to
   * `onHighlightChange` so it scrolls to the highlighted row.
   * @default false
   */
  virtualized?: boolean
  /** Pre-registered items for virtualization. */
  items?: VirtualItem[]
  /** Called when the highlighted row changes. */
  onHighlightChange?: PopupMenuHighlightChangeHandler<SuggestionMenuHighlightChangeEventDetails>
  /**
   * Computes canonical Resolved IDs for data-first content. Read once when the
   * menu mounts.
   */
  getResolvedId?: GetResolvedIdFn
  /**
   * Definition Key uniqueness scope. Read once when the menu mounts.
   * @default 'surface'
   */
  idScope?: PopupMenuIdScope
  /** The menu's parts, or a function of the payload and query that returns them. */
  children:
    | React.ReactNode
    | ((state: SuggestionMenuRootRenderState<Payload>) => React.ReactNode)
}

const warned = new Set<string>()
function warnOnce(key: string, message: string) {
  if (process.env.NODE_ENV === 'production' || warned.has(key)) return
  warned.add(key)
  console.warn(message)
}

/**
 * Groups all parts of the suggestion menu and connects them to the host input
 * through its handle. Never modal: DOM focus stays in the host input.
 * Doesn't render its own HTML element.
 */
export function SuggestionMenuRoot<Payload = unknown>(
  props: SuggestionMenuRootProps<Payload>,
) {
  const {
    handle,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    query: queryProp,
    anchor: anchorProp,
    virtualized = false,
    items: itemsProp,
    onHighlightChange,
    onOpenChangeComplete: onOpenChangeCompleteProp,
    getResolvedId,
    idScope = 'surface',
    children,
    ...rest
  } = props

  const handleState = React.useSyncExternalStore(
    handle.subscribe,
    handle.getState,
    handle.getState,
  )

  const storeRef = React.useRef<ListboxStore | null>(null)
  const reportedOpenRef = React.useRef<boolean | null>(null)
  const {
    store,
    focusOwnerStore,
    openChainStore,
    registerSurface,
    closeAll,
    virtualization,
    handleOpenChange,
    disabled,
    menuTreeResolver,
  } = usePopupMenuRoot({
    // A request that matches the current state isn't reported. In an editor,
    // choosing a row edits the text, and the trigger code then calls
    // `close()` too. Until the task ends, the last reported state counts as
    // current: a controlled parent's `open` prop hasn't re-rendered yet.
    onOpenChange: ((
      nextOpen: boolean,
      details: SuggestionMenuOpenChangeEventDetails,
    ) => {
      const current =
        reportedOpenRef.current ?? storeRef.current?.select('open')
      if (current === nextOpen) return
      // Recorded before the consumer runs: its handler may ask again (e.g.
      // an editor exiting the trigger calls `close()` from inside it).
      const previous = reportedOpenRef.current
      reportedOpenRef.current = nextOpen
      queueMicrotask(() => {
        reportedOpenRef.current = null
      })
      onOpenChange?.(nextOpen, details)
      // A cancelled request didn't happen, so the next one is reported too.
      if (details.isCanceled) reportedOpenRef.current = previous
    }) as unknown as UsePopupMenuRootParams['onOpenChange'],
    defaultOpen,
    virtualized,
    items: itemsProp,
    onHighlightChange:
      onHighlightChange as unknown as UsePopupMenuRootParams['onHighlightChange'],
    closeOnOutsidePress: 'pointerdown',
    // Pressing the host input, or focusing it, never dismisses the menu.
    getDismissExemptElements: () => [handle.host],
    getResolvedId,
    idScope,
  })

  storeRef.current = store
  store.useControlledProp('openProp', openProp)
  const open = store.useState('open')

  const handleOpenChangeRef = React.useRef(handleOpenChange)
  handleOpenChangeRef.current = handleOpenChange

  React.useLayoutEffect(
    () =>
      handle.connect({
        isOpen: () => store.select('open'),
        requestOpenChange: (
          nextOpen: boolean,
          reason: SuggestionMenuOpenChangeReason,
          event?: Event,
        ) => handleOpenChangeRef.current(nextOpen, reason, event),
        handleKeyDown: () => false,
        attachHost: () => {},
      }),
    [handle, store],
  )

  if (queryProp !== undefined && handleState.updated.query) {
    warnOnce(
      'query',
      '[SuggestionMenu] Both the `query` prop and `handle.update({ query })` set the query; the prop wins.',
    )
  }
  if (anchorProp !== undefined && handleState.updated.anchor) {
    warnOnce(
      'anchor',
      '[SuggestionMenu] Both the `anchor` prop and `handle.update({ anchor })` set the anchor; the prop wins.',
    )
  }

  const query = queryProp ?? handleState.query
  const anchor = anchorProp ?? handleState.anchor
  const payload = handleState.payload
  const host = handleState.host

  const virtualAnchor = React.useMemo(() => {
    if (!anchor) return undefined
    return {
      getBoundingClientRect: () => anchor() ?? new DOMRect(),
      contextElement: host ?? undefined,
    }
  }, [anchor, host])

  const handleOpenChangeComplete = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        store.clearHighlight()
        store.context.onCloseComplete?.()
        store.context.onPopupCloseComplete?.()
      }
      onOpenChangeCompleteProp?.(nextOpen)
    },
    [store, onOpenChangeCompleteProp],
  )

  const handlePopoverOpenChange = React.useCallback(
    (nextOpen: boolean, details: Popover.Root.ChangeEventDetails) => {
      handleOpenChange(
        nextOpen,
        details.reason as SuggestionMenuOpenChangeReason,
        details.event,
      )
    },
    [handleOpenChange],
  )

  const rootContext = React.useMemo(
    () => ({ handle: handle as SuggestionMenuHandle, query, payload }),
    [handle, query, payload],
  )

  return (
    <PopupMenuProviders
      store={store}
      menuTreeResolver={menuTreeResolver}
      focusOwnerStore={focusOwnerStore}
      openChainStore={openChainStore}
      disabled={disabled}
      depth={0}
      closeAll={closeAll}
      registerSurface={registerSurface}
      virtualization={virtualization}
      virtualAnchor={virtualAnchor}
      menuType="context"
      externalFocus
      closeOnOutsidePress="pointerdown"
      componentName="suggestion-menu"
    >
      <SuggestionMenuRootContext.Provider value={rootContext}>
        <Popover.Root
          {...rest}
          open={open}
          onOpenChange={handlePopoverOpenChange}
          onOpenChangeComplete={handleOpenChangeComplete}
          modal={false}
        >
          {typeof children === 'function'
            ? children({ payload, query })
            : children}
        </Popover.Root>
      </SuggestionMenuRootContext.Provider>
    </PopupMenuProviders>
  )
}

export namespace SuggestionMenuRoot {
  export type Props<Payload = unknown> = SuggestionMenuRootProps<Payload>
  export type RenderState<Payload = unknown> =
    SuggestionMenuRootRenderState<Payload>
  export type ChangeEventDetails = SuggestionMenuOpenChangeEventDetails
}
