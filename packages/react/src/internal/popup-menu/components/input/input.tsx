'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import { useListboxContext, useSurfaceContext } from '../../../listbox/index.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { usePopupMenuContext } from '../../contexts/popup-menu-context.js'
import { useMaybeSubmenuContext } from '../../contexts/submenu-context.js'
import { useMaybeSubpageContext } from '../../contexts/subpage-context.js'
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
    disabled: disabledProp = false,
    render,
    className,
    style,
    onKeyDown,
    onPointerDown,
    ...rest
  } = props

  const { store, surfaceId } = useSurfaceContext()
  const { depth, closeAll } = useListboxContext()
  const submenuContext = useMaybeSubmenuContext()
  const subpageContext = useMaybeSubpageContext()
  const { disabled: popupMenuDisabled } = usePopupMenuContext()
  const disabled = popupMenuDisabled || disabledProp
  const focusOwnerStore = useFocusOwner()
  const internalRef = React.useRef<HTMLInputElement>(null)

  // Get values from store
  const search = store.useState('search')
  const highlightedId = store.useState('highlightedId')
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

  // Determine the actual value (controlled input prop > controlled surface > uncontrolled)
  const isInputControlled = controlledValue !== undefined
  const displayValue = isInputControlled ? controlledValue : search

  // Consume pending search on activation
  React.useEffect(() => {
    if (pendingSearch && internalRef.current) {
      // Always sync to store for filtering/highlighting, even in controlled mode
      store.setSearch(pendingSearch)
      onValueChange?.(pendingSearch)
      // Clear pending search
      store.setPendingSearch('')
      // Focus the input
      internalRef.current.focus()
    }
  }, [pendingSearch, store, onValueChange])

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value

      // Always sync to store for filtering/highlighting, even in controlled mode
      store.setSearch(newValue)
      onValueChange?.(newValue)
    },
    [onValueChange, store],
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
  })

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
      className,
      style,
      value: displayValue,
      onChange: handleChange,
      onKeyDown: handleKeyDown,
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
