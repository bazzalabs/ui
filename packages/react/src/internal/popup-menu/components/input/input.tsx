'use client'

import { useRender } from '@base-ui/react/use-render'
import { platform } from '@base-ui/utils/platform'
import * as React from 'react'
import {
  resolveClassName,
  resolveStyle,
} from '../../../../utils/resolve-state-props.js'
import type { ComponentProps } from '../../../../utils/types.js'
import { useListboxContext, useSurfaceContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { usePopupMenuContext } from '../../contexts/popup-menu-context.js'
import { useMaybeSubmenuContext } from '../../contexts/submenu-context.js'
import { useMaybeSubpageContextInPopup } from '../../contexts/subpage-context.js'
import { usePopupMenuKeyboard } from '../../hooks/use-popup-menu-keyboard.js'

export interface PopupMenuInputState extends Record<string, unknown> {
  /**
   * Whether the input is active (visible).
   * Only relevant when `hideUntilActive` is true.
   */
  active: boolean
}

export interface PopupMenuInputProps
  extends Omit<
    ComponentProps<'input', PopupMenuInput.State>,
    'value' | 'onChange' | 'type'
  > {
  /**
   * Controlled value for the search input.
   * If provided, this takes precedence over the Surface's search state.
   */
  value?: string

  /**
   * Callback when the input value changes.
   */
  onValueChange?: (value: string) => void

  /**
   * When true, the input is not rendered until the user starts typing.
   * The List receives focus initially, and typing a character activates the input.
   * Once activated, the input stays visible until the menu closes.
   * @default false
   */
  hideUntilActive?: boolean

  /**
   * When true, Backspace in an empty subpage input navigates back one page.
   * @default false
   */
  backspaceGoesBack?: boolean
}

/**
 * Whether a key belongs to the input's own text editing rather than menu
 * navigation. Only an input with text keeps keys: Home/End and
 * ArrowLeft/ArrowRight move the caret (ArrowRight still opens a highlighted
 * submenu trigger), Shift+ArrowLeft/ArrowRight extend the selection, and
 * Alt/Meta+Arrow jump by word or line. Shift+ArrowUp/ArrowDown stay with the
 * menu so they can start a keyboard drag selection; Shift+Home/End select to
 * either end of the text instead. An empty input leaves every key to the menu.
 * Ctrl bindings (Ctrl+N/P/H/L) always navigate.
 */
function isTextEditKey(
  event: React.KeyboardEvent,
  hasText: boolean,
  highlightedOpensSubmenu: boolean,
): boolean {
  if (!hasText) return false
  const { key } = event
  if (key === 'Home' || key === 'End' || key === 'ArrowLeft') return true
  if (key === 'ArrowRight') {
    return (
      event.shiftKey ||
      event.altKey ||
      event.metaKey ||
      event.ctrlKey ||
      !highlightedOpensSubmenu
    )
  }
  if (key === 'ArrowUp' || key === 'ArrowDown') {
    return event.altKey || event.metaKey
  }
  return false
}

/**
 * Search input for filtering popup menu items.
 * Handles keyboard navigation (Arrow keys, Ctrl+N/P, Enter).
 * Renders an `<input>` element.
 */
export const PopupMenuInput = React.forwardRef<
  HTMLInputElement,
  PopupMenuInput.Props
>(function PopupMenuInput(props, forwardedRef) {
  const {
    value: controlledValue,
    onValueChange,
    hideUntilActive = false,
    backspaceGoesBack = false,
    disabled: disabledProp = false,
    render,
    className,
    style,
    onKeyDown,
    onPointerDown,
    onCompositionStart,
    onCompositionEnd,
    ...rest
  } = props

  const { store, surfaceId } = useSurfaceContext()
  const { depth, closeAll } = useListboxContext()
  const submenuContext = useMaybeSubmenuContext()
  const subpageContext = useMaybeSubpageContextInPopup()
  const { disabled: popupMenuDisabled } = usePopupMenuContext()
  const disabled = popupMenuDisabled || disabledProp
  const focusOwnerStore = useFocusOwner()
  const internalRef = React.useRef<HTMLInputElement>(null)

  // Get values from store
  const search = store.useState('search')
  const highlightedId = store.useState('highlightedId')
  const open = store.useState('open')
  const listId = store.context.listId
  const inputId = store.context.inputId

  // Register hideUntilActive mode
  React.useEffect(() => {
    store.setHideUntilActive(hideUntilActive)
    return () => store.setHideUntilActive(false)
  }, [store, hideUntilActive])

  // Subscribe to inputActive and pendingSearch state
  const inputActive = store.useState('inputActive')
  const pendingSearch = store.useState('pendingSearch')

  // Determine if we should render
  const shouldRender = !hideUntilActive || inputActive

  // Register that an Input is present - ONLY when actually rendering
  // This ensures List handles keyboard when Input is hidden
  React.useEffect(() => {
    if (!shouldRender) {
      return // Don't register when hidden
    }
    store.setHasInput(true)
    return () => store.setHasInput(false)
  }, [store, shouldRender])

  // IME text isn't committed until the composition ends, so the search waits
  // for it. While composing, the input shows the composing text.
  const [composingValue, setComposingValue] = React.useState<string | null>(
    null,
  )
  const isComposingRef = React.useRef(false)
  // The input's value when the current composition started; a composition
  // that ends on it was cancelled and commits nothing.
  const compositionStartValueRef = React.useRef('')
  // The value the last composition committed. WebKit follows
  // `compositionend` with one more input event for the same text, in the same
  // task, which mustn't commit again. Other browsers send none, so the value
  // expires after the task instead of swallowing a later real edit.
  const compositionEndValueRef = React.useRef<string | null>(null)
  const compositionEndTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null)
  const clearCompositionEndValue = React.useCallback(() => {
    compositionEndValueRef.current = null
    if (compositionEndTimerRef.current !== null) {
      clearTimeout(compositionEndTimerRef.current)
      compositionEndTimerRef.current = null
    }
  }, [])
  React.useEffect(() => clearCompositionEndValue, [clearCompositionEndValue])

  // A composition can be cut off without a `compositionend` (the input stops
  // rendering, or the menu closes). Drop it so filtering doesn't stay paused.
  React.useEffect(() => {
    if (!shouldRender || !open) {
      isComposingRef.current = false
      clearCompositionEndValue()
      setComposingValue(null)
    }
  }, [shouldRender, open, clearCompositionEndValue])

  // Determine the actual value
  // (composing value > controlled input prop > controlled surface > uncontrolled)
  const isInputControlled = controlledValue !== undefined
  const displayValue =
    composingValue ?? (isInputControlled ? controlledValue : search)

  const commitValue = React.useCallback(
    (newValue: string) => {
      // Always sync to store for filtering/highlighting, even in controlled mode
      store.setSearch(newValue)
      onValueChange?.(newValue)
    },
    [onValueChange, store],
  )

  // Consume pending search on activation
  React.useEffect(() => {
    if (pendingSearch && internalRef.current) {
      commitValue(pendingSearch)
      // Clear pending search
      store.setPendingSearch('')
      // Focus the input
      internalRef.current.focus()
    }
  }, [pendingSearch, store, commitValue])

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // The input keeps focus while the popup animates out. An edit then
      // would land after the close, so the input keeps showing the frozen
      // value instead, composing text included.
      if (!store.select('open')) return
      if (isComposingRef.current) {
        setComposingValue(event.target.value)
        return
      }
      const endValue = compositionEndValueRef.current
      clearCompositionEndValue()
      if (event.target.value === endValue) return
      commitValue(event.target.value)
    },
    [commitValue, store, clearCompositionEndValue],
  )

  const handleCompositionStart = React.useCallback(
    (event: React.CompositionEvent<HTMLInputElement>) => {
      onCompositionStart?.(event)
      // Some Android keyboards treat all typing as one composition. While the
      // popup animates out, edits are ignored, so there's nothing to track.
      if (platform.os.android || !store.select('open')) {
        return
      }
      isComposingRef.current = true
      compositionStartValueRef.current = event.currentTarget.value
      clearCompositionEndValue()
      setComposingValue(event.currentTarget.value)
    },
    [onCompositionStart, store, clearCompositionEndValue],
  )

  const handleCompositionEnd = React.useCallback(
    (event: React.CompositionEvent<HTMLInputElement>) => {
      onCompositionEnd?.(event)
      if (!isComposingRef.current) {
        return
      }
      isComposingRef.current = false
      setComposingValue(null)
      const { value } = event.currentTarget
      if (!store.select('open') || value === compositionStartValueRef.current) {
        return
      }
      clearCompositionEndValue()
      compositionEndValueRef.current = value
      compositionEndTimerRef.current = setTimeout(clearCompositionEndValue, 0)
      commitValue(value)
    },
    [onCompositionEnd, commitValue, store, clearCompositionEndValue],
  )

  // A direct press on the input is an explicit "enter" action: make its
  // surface the focus owner synchronously — the move-based reclaim in Surface
  // is not guaranteed to have fired (e.g. a stationary click).
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLInputElement>) => {
      onPointerDown?.(event)
      if (disabled) {
        return
      }
      if (focusOwnerStore.state.ownerId !== surfaceId) {
        focusOwnerStore.setOwnerId(surfaceId)
      }
    },
    [onPointerDown, disabled, focusOwnerStore, surfaceId],
  )

  const isInputTextEditKey = React.useCallback(
    (event: React.KeyboardEvent) =>
      isTextEditKey(
        event,
        Boolean(internalRef.current?.value),
        store.isHighlightedSubmenuTrigger(),
      ),
    [store],
  )

  // Use centralized keyboard navigation hook
  const { handleKeyDown } = usePopupMenuKeyboard({
    store,
    surfaceId,
    focusOwnerStore,
    depth,
    submenuContext,
    subpageContext,
    enabled: true,
    disabled,
    enableTypeToSearch: false,
    onKeyDown,
    closeAll,
    isTextEditKey: isInputTextEditKey,
  })

  const handleKeyDownWithBack = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        backspaceGoesBack &&
        event.key === 'Backspace' &&
        !event.repeat &&
        // Never navigate during IME composition — Backspace edits the
        // composition buffer (mirrors the guard in useListboxKeyboard).
        !event.nativeEvent.isComposing &&
        event.keyCode !== 229 &&
        displayValue === '' &&
        subpageContext
      ) {
        const didGoBack = subpageContext.goBack()
        if (didGoBack) {
          event.preventDefault()
          if (subpageContext.parentSurfaceId) {
            focusOwnerStore.setOwnerId(subpageContext.parentSurfaceId)
          }
          return
        }
      }
      handleKeyDown(event)
    },
    [
      backspaceGoesBack,
      displayValue,
      subpageContext,
      focusOwnerStore,
      handleKeyDown,
    ],
  )

  const state: PopupMenuInput.State = React.useMemo(
    () => ({
      active: inputActive,
    }),
    [inputActive],
  )

  // Get component name for slot attribute
  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'input')

  const element = useRender({
    render,
    ref: [internalRef, forwardedRef],
    state,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      id: inputId,
      type: 'text',
      role: 'combobox',
      'aria-autocomplete': 'list',
      'aria-expanded': true,
      'aria-controls': listId,
      'aria-activedescendant': highlightedId ?? undefined,
      autoComplete: 'off',
      autoCorrect: 'off',
      spellCheck: false,
      disabled,
      className: resolveClassName(className, state),
      style: resolveStyle(style, state),
      value: displayValue,
      onChange: handleChange,
      onCompositionStart: handleCompositionStart,
      onCompositionEnd: handleCompositionEnd,
      onKeyDown: handleKeyDownWithBack,
      onPointerDown: handlePointerDown,
    },
    defaultTagName: 'input',
  })

  // Don't render if hideUntilActive is enabled and not yet active
  if (!shouldRender) {
    return null
  }

  return element
})

export namespace PopupMenuInput {
  export type State = PopupMenuInputState
  export interface Props extends PopupMenuInputProps {}
}
