'use client'

import * as React from 'react'
import { useMaybeCheckboxSelection } from '../contexts/checkbox-selection-context.js'
import {
  type UsePopupMenuKeyboardParams,
  usePopupMenuKeyboard,
} from './use-popup-menu-keyboard.js'

/** A key press from an element outside the menu: a DOM event or a React one. */
export type ForwardedKeyboardEvent = KeyboardEvent | React.KeyboardEvent

/**
 * Handles a key press that happened outside the menu. Returns `true` when the
 * menu used the key (and prevented its default action), `false` when the key
 * should keep its normal meaning in the element it was pressed in.
 */
export type ForwardKeyDown = (event: ForwardedKeyboardEvent) => boolean

/**
 * Keyboard params for a forwarded key press. There is no `onKeyDown`: the
 * member handles its own keys before forwarding the rest.
 */
export type UseForwardedKeyDownParams = Omit<
  UsePopupMenuKeyboardParams,
  'skipFocusOwnerCheck' | 'enableTypeToSearch' | 'onKeyDown'
>

const NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End'])

/**
 * Lets an element outside the menu (an editor, a text field) forward its key
 * presses into the menu's keyboard handling: arrows, Ctrl+N/P, Home/End, Enter
 * and the rest of the listbox bindings, with the same IME guard. DOM focus
 * never has to enter the menu.
 *
 * A key counts as handled only when the menu acts on it, so the element keeps
 * its own behaviour otherwise: nothing is handled while the menu is closed,
 * navigation keys need at least one row, Enter needs a highlighted row it can
 * activate, and printable characters always belong to the element (they never
 * trigger item shortcuts).
 *
 * Checkbox span selection (Shift+Arrow) needs the Surface's selection context,
 * so it applies only when the hook is mounted inside a Surface.
 *
 * The returned function is stable, so it can be handed to code outside React.
 * Which keys a member forwards, and what Escape or Tab mean for it, is the
 * member's policy.
 */
export function useForwardedKeyDown(
  params: UseForwardedKeyDownParams,
): ForwardKeyDown {
  const { handleKeyDown } = usePopupMenuKeyboard({
    ...params,
    enableTypeToSearch: false,
    // The key press comes from outside every surface, so no surface owns focus.
    skipFocusOwnerCheck: true,
  })

  const selection = useMaybeCheckboxSelection()
  const latestRef = React.useRef({
    handleKeyDown,
    store: params.store,
    selection,
  })
  latestRef.current = { handleKeyDown, store: params.store, selection }

  return React.useCallback((event: ForwardedKeyboardEvent) => {
    const { handleKeyDown, store, selection } = latestRef.current
    if (event.defaultPrevented || !store.select('open')) return false

    const { key, ctrlKey, metaKey, altKey } = event
    const isPrintable = key.length === 1 && !ctrlKey && !metaKey && !altKey
    if (isPrintable) return false

    const isNavigation =
      NAVIGATION_KEYS.has(key) || (ctrlKey && (key === 'n' || key === 'p'))
    if (isNavigation && store.getVisibleItemIds().length === 0) return false

    // Enter during a keyboard span commits the span, whatever row is highlighted.
    const keyboardSpanActive = selection?.state.gesture?.kind === 'keyboard'
    if (key === 'Enter' && !keyboardSpanActive) {
      const highlighted = store.getHighlightedItem()
      if (!store.state.highlightedId || highlighted?.activatable === false) {
        return false
      }
    }

    const forwarded = toForwardedReactEvent(event)
    handleKeyDown(forwarded.event)
    return forwarded.wasPrevented()
  }, [])
}

/**
 * Presents a DOM or React keyboard event in the React event shape the keyboard
 * handlers expect, recording whether any handler prevented it. Tracked
 * separately from `defaultPrevented`, which stays false for non-cancelable
 * events. Everything else reads through to the original event, with methods
 * bound to it.
 */
export function toForwardedReactEvent(event: ForwardedKeyboardEvent): {
  event: React.KeyboardEvent
  wasPrevented: () => boolean
} {
  const nativeEvent = 'nativeEvent' in event ? event.nativeEvent : event
  let prevented = false
  let propagationStopped = false

  const proxy = new Proxy(event as object, {
    get(target, property) {
      switch (property) {
        case 'nativeEvent':
          return nativeEvent
        case 'defaultPrevented':
          return prevented || event.defaultPrevented
        case 'isDefaultPrevented':
          return () => prevented || event.defaultPrevented
        case 'preventDefault':
          return () => {
            prevented = true
            event.preventDefault()
          }
        case 'stopPropagation':
          return () => {
            propagationStopped = true
            event.stopPropagation()
          }
        case 'isPropagationStopped':
          return () => propagationStopped
        case 'persist':
          return () => {}
      }
      const value = Reflect.get(target, property, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })

  return {
    event: proxy as React.KeyboardEvent,
    wasPrevented: () => prevented,
  }
}
