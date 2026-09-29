'use client'

import { Popover, type PopoverRootProps } from '@base-ui/react/popover'
import * as React from 'react'
import type { ListboxStore, VirtualItem } from '../../internal/listbox/index.js'
import type { PopupMenuOpenChangeReason } from '../../internal/popup-menu/events.js'
import {
  type ForwardKeyDown,
  type PopupMenuHighlightChangeHandler,
  PopupMenuProviders,
  type UsePopupMenuRootParams,
  useFocusOwner,
  useForwardedKeyDown,
  usePopupMenuContext,
  usePopupMenuRoot,
} from '../../internal/popup-menu/index.js'
import type {
  GetResolvedIdFn,
  PopupMenuIdScope,
} from '../../internal/popup-menu/menu-tree/types.js'
import { REASONS } from '../../utils/events/index.js'
import type {
  SuggestionMenuHighlightChangeEventDetails,
  SuggestionMenuOpenChangeEventDetails,
  SuggestionMenuOpenChangeReason,
} from '../events.js'
import type { SuggestionMenuAnchor, SuggestionMenuHandle } from '../handle.js'
import { useHostAria } from './host-aria.js'
import { watchHost } from './host-events.js'
import { handleSuggestionMenuKey } from './keymap.js'
import {
  defaultGetAriaResultsText,
  type GetAriaResultsText,
  type ResultsAnnouncement,
  SuggestionMenuResultsStatus,
} from './results-status.js'
import { SuggestionMenuRootContext } from './root-context.js'
import { useVirtualAnchor } from './virtual-anchor.js'

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
  /**
   * Formats the result summary announced to screen readers once results
   * settle, for localisation. Receives the number of results and the text of
   * the row Enter would choose.
   * @default (count, label) => count === 0 ? 'No results' : `${count} results, first: ${label}`
   */
  getAriaResultsText?: GetAriaResultsText
  /**
   * What happens when nothing matches the query, once every search for it has
   * finished.
   * - `'empty'`: the menu stays open and shows `Empty`; Enter reaches the host.
   * - `'close'`: the menu closes (reason `'no-results'`). An `update()` with
   *   the same query leaves it closed; one with any other query searches
   *   again.
   * @default 'empty'
   */
  noResults?: 'empty' | 'close'
  /** The menu's parts, or a function of the payload and query that returns them. */
  children:
    | React.ReactNode
    | ((state: SuggestionMenuRootRenderState<Payload>) => React.ReactNode)
}

/**
 * Runs inside the providers so the menu's keyboard handling can reach the
 * store; hands the forwarding function to the Root.
 */
function KeyboardBridge(props: {
  forwardKeyDownRef: React.MutableRefObject<ForwardKeyDown | null>
}) {
  const { store, closeAll } = usePopupMenuContext()
  const focusOwnerStore = useFocusOwner()
  const open = store.useState('open')
  const forward = useForwardedKeyDown({
    store,
    surfaceId: 'suggestion-menu-host',
    focusOwnerStore,
    depth: 0,
    submenuContext: null,
    subpageContext: null,
    enabled: open,
    closeAll,
  })
  props.forwardKeyDownRef.current = forward
  return null
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
    getAriaResultsText = defaultGetAriaResultsText,
    noResults = 'empty',
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
  const pendingChangeRef = React.useRef<{
    open: boolean
    reason: SuggestionMenuOpenChangeReason
    thisTask: boolean
  } | null>(null)
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
      // The reason of the request that changes the state, for the handle:
      // the first one in this task, or a later task's (a controlled parent
      // may have refused an earlier one).
      const pending = pendingChangeRef.current
      if (
        storeRef.current?.select('open') !== nextOpen &&
        (!pending || pending.open !== nextOpen || !pending.thisTask)
      ) {
        const change = {
          open: nextOpen,
          reason: details.reason,
          thisTask: true,
        }
        pendingChangeRef.current = change
        queueMicrotask(() => {
          change.thisTask = false
        })
        // A controlled parent may commit the change in a later task; to
        // refuse it, it cancels the details, which drops the reason.
      }
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
      if (details.isCanceled) {
        reportedOpenRef.current = previous
        pendingChangeRef.current = null
      }
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
  // Tell the handle once the change has happened (a controlled parent may
  // refuse it), e.g. so a text-field binding knows how the menu closed.
  const lastNotifiedOpenRef = React.useRef(open)
  React.useLayoutEffect(() => {
    if (lastNotifiedOpenRef.current === open) return
    lastNotifiedOpenRef.current = open
    const pending = pendingChangeRef.current
    pendingChangeRef.current = null
    handle.notifyOpenChange(
      open,
      pending?.open === open ? pending.reason : REASONS.none,
    )
  }, [open, handle])

  const handleOpenChangeRef = React.useRef(handleOpenChange)
  handleOpenChangeRef.current = handleOpenChange
  const forwardKeyDownRef = React.useRef<ForwardKeyDown | null>(null)
  const detachHostRef = React.useRef<(() => void) | null>(null)
  // With `noResults: 'close'`: the query whose results settled empty.
  const emptyQueryRef = React.useRef<string | null>(null)
  const noResultsRef = React.useRef(noResults)
  noResultsRef.current = noResults
  const queryPropRef = React.useRef(queryProp)
  queryPropRef.current = queryProp
  const openOnQueryChangeRef = React.useRef(false)

  // `aria-activedescendant` follows keyboard highlight only (ADR 0005). Set
  // when the menu moves the highlight for a key; cleared when the query
  // changes, on ←/→, and when the pointer or the menu itself moves it.
  const [keyboardHighlightQuery, setKeyboardHighlightQuery] = React.useState<
    string | null
  >(null)
  const queryRef = React.useRef('')

  React.useLayoutEffect(() => {
    const isOpen = () => store.select('open')
    const send = (
      nextOpen: boolean,
      reason: SuggestionMenuOpenChangeReason,
      event?: Event,
    ) => {
      if (reason === REASONS.imperativeAction) {
        const empty = emptyQueryRef.current
        if (nextOpen && empty !== null) {
          // The query that settled empty stays closed (e.g. only the caret
          // moved); any other query searches again. A controlled query may
          // not have rendered yet, so that open waits for it.
          const controlled = queryPropRef.current
          if (controlled === empty) {
            openOnQueryChangeRef.current = true
            return
          }
          if (controlled === undefined && handle.getState().query === empty) {
            return
          }
        }
        emptyQueryRef.current = null
        openOnQueryChangeRef.current = false
      }
      handleOpenChangeRef.current(
        nextOpen,
        reason as PopupMenuOpenChangeReason,
        event,
      )
    }

    // While a row is being chosen (Enter, or a click on a row), a `close()`
    // from the row's `onSelect` waits, so the menu's own close reports
    // `item-press` first; the waiting close is then a no-op.
    let selecting = 0
    let heldClose: { event: Event | undefined } | null = null
    const startSelection = () => {
      selecting += 1
    }
    const endSelection = () => {
      selecting -= 1
      if (selecting > 0 || !heldClose) return
      const { event } = heldClose
      heldClose = null
      send(false, REASONS.imperativeAction, event)
    }
    const request = (
      nextOpen: boolean,
      reason: SuggestionMenuOpenChangeReason,
      event?: Event,
    ) => {
      if (!nextOpen && reason === REASONS.imperativeAction && selecting > 0) {
        heldClose = { event }
        return
      }
      send(nextOpen, reason, event)
    }

    return handle.connect({
      isOpen,
      requestOpenChange: request,
      handleKeyDown: (event) => {
        // Moving the caret hands the screen reader back to the text.
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          setKeyboardHighlightQuery(null)
        }
        return handleSuggestionMenuKey(event, {
          isOpen,
          forward: (forwarded) => {
            const choosing = forwarded.key === 'Enter'
            if (choosing) startSelection()
            try {
              const used = forwardKeyDownRef.current?.(forwarded) ?? false
              if (used && !choosing) {
                setKeyboardHighlightQuery(queryRef.current)
              }
              return used
            } finally {
              if (choosing) endSelection()
            }
          },
          dismiss: (keyEvent) =>
            request(
              false,
              REASONS.escapeKey,
              'nativeEvent' in keyEvent ? keyEvent.nativeEvent : keyEvent,
            ),
        })
      },
      attachHost: (host) => {
        // A new host (or none) starts fresh.
        emptyQueryRef.current = null
        openOnQueryChangeRef.current = false
        detachHostRef.current?.()
        detachHostRef.current = host
          ? watchHost(host, {
              isOpen,
              getPopup: () => store.context.refs.popupRef.current,
              onFocusOut: (event) => request(false, REASONS.focusOut, event),
              onSelectionStart: startSelection,
              onSelectionEnd: endSelection,
            })
          : null
      },
    })
  }, [handle, store])

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
  // An open that waited for a controlled query to leave the empty one. The
  // prop can render after the `update()` (e.g. state set from an editor's
  // native listener), so it waits until the next `update()`, `close()` or
  // host change.
  React.useLayoutEffect(() => {
    if (!openOnQueryChangeRef.current || query === emptyQueryRef.current) return
    openOnQueryChangeRef.current = false
    emptyQueryRef.current = null
    handleOpenChangeRef.current(
      true,
      REASONS.imperativeAction as PopupMenuOpenChangeReason,
    )
  }, [query])
  const anchor = anchorProp ?? handleState.anchor
  const payload = handleState.payload
  const host = handleState.host
  queryRef.current = query

  const highlightedId = store.useState('highlightedId')
  const highlightSource = store.useState('highlightSource')
  // Decided during render, so a pointer or automatic highlight never reaches
  // the host, not even for one render.
  const activeDescendant =
    open && highlightSource === 'keyboard' && keyboardHighlightQuery === query
      ? highlightedId
      : null
  React.useEffect(() => {
    if (highlightSource !== 'keyboard') setKeyboardHighlightQuery(null)
  }, [highlightSource])
  // A new query disarms it for good, even if the text comes back.
  React.useLayoutEffect(() => {
    setKeyboardHighlightQuery(null)
  }, [query])
  const syncHostAria = useHostAria({ store, host, open, activeDescendant })

  // The settled result summary, reported by the Surface once per settle.
  const [announcement, setAnnouncement] =
    React.useState<ResultsAnnouncement | null>(null)
  const getAriaResultsTextRef = React.useRef(getAriaResultsText)
  getAriaResultsTextRef.current = getAriaResultsText
  const reportResults = React.useCallback(
    (count: number, label: string | null) => {
      if (count === 0 && noResultsRef.current === 'close') {
        emptyQueryRef.current = queryRef.current
        handleOpenChangeRef.current(
          false,
          REASONS.noResults as PopupMenuOpenChangeReason,
        )
        return
      }
      const text = getAriaResultsTextRef.current(count, label)
      setAnnouncement((current) => ({ text, key: (current?.key ?? 0) + 1 }))
    },
    [],
  )
  React.useEffect(() => {
    if (open) return
    setKeyboardHighlightQuery(null)
    setAnnouncement(null)
  }, [open])

  // Measured while open: again on each `update()`, query change and opening,
  // never on close (the text the anchor measured may be gone by then).
  const measureKey = React.useMemo(
    () => ({}),
    // biome-ignore lint/correctness/useExhaustiveDependencies: these are the triggers
    [handleState, query, open],
  )
  const { virtualAnchor, ready: anchorReady } = useVirtualAnchor(
    open ? anchor : undefined,
    host,
    measureKey,
  )

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
        details.reason as PopupMenuOpenChangeReason,
        details.event,
      )
    },
    [handleOpenChange],
  )

  const rootContext = React.useMemo(
    () => ({
      handle: handle as SuggestionMenuHandle,
      query,
      payload,
      reportResults,
      syncHostAria,
      anchorReady,
    }),
    [handle, query, payload, reportResults, syncHostAria, anchorReady],
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
      <KeyboardBridge forwardKeyDownRef={forwardKeyDownRef} />
      <SuggestionMenuResultsStatus announcement={announcement} />
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
