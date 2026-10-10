'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { useFocusOwner } from '../../internal/popup-menu/contexts/focus-owner-context.js'
import { usePopupMenuContext } from '../../internal/popup-menu/contexts/popup-menu-context.js'
import { useKeyboardHighlightGate } from '../../internal/popup-menu/hooks/use-keyboard-highlight-gate.js'
import { resolveLabelFromItems } from '../../utils/items.js'
import {
  resolveClassName,
  resolveStyle,
} from '../../utils/resolve-state-props.js'
import type { ComponentProps } from '../../utils/types.js'
import { useComboboxContext } from '../contexts/combobox-context.js'
import { useIsInsideInputWrapper } from '../input-wrapper/input-wrapper-context.js'
import { ComboboxInputDataAttributes } from './input.data-attrs.js'
import { useComboboxDisplayValue } from './use-combobox-display-value.js'
import { useComboboxInputBehavior } from './use-combobox-input-behavior.js'

export { ComboboxInputDataAttributes }

export interface ComboboxInputState extends Record<string, unknown> {
  /**
   * Whether the combobox popup is open.
   */
  open: boolean
  /**
   * Whether the input is disabled.
   */
  disabled: boolean
  /**
   * Whether the input currently shows placeholder (no value selected).
   */
  placeholder: boolean
}

/**
 * Cursor behavior when the combobox popup opens.
 * - `'none'` - Don't move the cursor (cursor appears where clicked)
 * - `'end'` - Move cursor to the end of the input
 * - `'select-all'` - Move cursor to the end and select all text
 */
export type ComboboxInputCursorBehavior = 'none' | 'end' | 'select-all'

export interface ComboboxInputProps
  extends Omit<
    ComponentProps<'input', ComboboxInput.State>,
    'value' | 'onChange' | 'type'
  > {
  /**
   * Placeholder text shown when no value is selected and input is empty.
   * Overrides the placeholder set on Combobox.Root.
   */
  placeholder?: string

  /**
   * Cursor behavior when the combobox popup opens.
   * - `'none'` - Don't move the cursor (cursor appears where clicked)
   * - `'end'` - Move cursor to the end of the input
   * - `'select-all'` - Move cursor to the end and select all text
   *
   * @default 'none'
   */
  cursorBehavior?: ComboboxInputCursorBehavior
}

/**
 * An input that acts as both the trigger and search field for the combobox.
 * Renders an `<input>` element with combobox ARIA semantics.
 */
export const ComboboxInput = React.forwardRef<
  HTMLInputElement,
  ComboboxInput.Props
>(function ComboboxInput(props, forwardedRef) {
  const {
    placeholder: placeholderProp,
    disabled: disabledProp,
    cursorBehavior = 'none',
    render,
    className,
    style,
    onFocus,
    onBlur,
    onClick,
    onKeyDown,
    ...rest
  } = props

  const comboboxContext = useComboboxContext()
  const popupMenuContext = usePopupMenuContext()
  const focusOwnerStore = useFocusOwner()
  const isInsideInputWrapper = useIsInsideInputWrapper()

  const disabled =
    (disabledProp ?? comboboxContext.disabled) || popupMenuContext.disabled

  // A `null` item's label (looked up under the empty-string key) acts as the
  // placeholder, taking precedence over the Root placeholder but not an
  // explicit `placeholder` prop on the input.
  const nullItemLabel = resolveLabelFromItems(comboboxContext.items, '')
  const placeholder =
    placeholderProp ??
    (typeof nullItemLabel === 'string' ? nullItemLabel : undefined) ??
    comboboxContext.placeholder

  // Get open state
  const open = popupMenuContext.store.useState('open')

  // DOM focus stays on this input, so it carries `aria-activedescendant` and
  // the list doesn't (the list reads `hasInput`). It follows keyboard
  // highlight only (ADR 0005): set when a key moves the highlight, unset for a
  // pointer or automatic highlight, after the query changes, and on ←/→.
  const { store } = popupMenuContext
  const search = store.useState('search')
  const highlightedElementId = store.useState('highlightedElementId')
  const keyboardHighlight = useKeyboardHighlightGate({
    store,
    open,
    query: search,
  })
  const activeDescendant = keyboardHighlight.active
    ? (highlightedElementId ?? undefined)
    : undefined

  React.useEffect(() => {
    store.setHasInput(true)
    return () => store.setHasInput(false)
  }, [store])

  // Use display value hook
  const { hasValue, displayValue, getValueText } = useComboboxDisplayValue({
    comboboxContext,
    open,
  })

  // Use input behavior hook
  const {
    handleChange,
    handleFocus,
    handleBlur,
    handleClick,
    handleKeyDown: handleBehaviorKeyDown,
  } = useComboboxInputBehavior({
    comboboxContext,
    store: popupMenuContext.store,
    focusOwnerStore,
    open,
    disabled,
    cursorBehavior,
    hasValue,
    getValueText,
    onFocus,
    onBlur,
    onClick,
    onKeyDown,
  })

  const { arm: armKeyboardHighlight, disarm: disarmKeyboardHighlight } =
    keyboardHighlight
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const prevHighlightedId = store.select('highlightedId')
      handleBehaviorKeyDown(event)
      // Moving the caret hands the screen reader back to the text.
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        disarmKeyboardHighlight()
        return
      }
      // Arm only when this key moved the highlight (Enter chooses a row).
      if (
        event.key !== 'Enter' &&
        store.select('highlightedId') !== prevHighlightedId &&
        store.select('highlightSource') === 'keyboard'
      ) {
        armKeyboardHighlight()
      }
    },
    [
      handleBehaviorKeyDown,
      store,
      armKeyboardHighlight,
      disarmKeyboardHighlight,
    ],
  )

  // Build data attributes
  const dataAttrs: Record<string, string> = {
    [ComboboxInputDataAttributes.slot]: '',
  }
  if (open) {
    dataAttrs[ComboboxInputDataAttributes.open] = ''
  } else {
    dataAttrs[ComboboxInputDataAttributes.closed] = ''
  }
  if (disabled) {
    dataAttrs[ComboboxInputDataAttributes.disabled] = ''
  }
  if (!hasValue) {
    dataAttrs[ComboboxInputDataAttributes.placeholder] = ''
  }
  // Add input-embedded data attribute when layout is input-embedded
  if (comboboxContext.layout === 'input-embedded') {
    dataAttrs['data-input-embedded'] = ''
  }

  // Register input element for positioning
  const mergedRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      comboboxContext.setInputElement(node)
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    [forwardedRef, comboboxContext],
  )

  const state: ComboboxInput.State = React.useMemo(
    () => ({
      open,
      disabled,
      placeholder: !hasValue,
    }),
    [open, disabled, hasValue],
  )

  // When input-embedded layout, apply styles to position input above the popup
  // Skip z-index if inside an InputWrapper (the wrapper handles z-index)
  const inputEmbeddedStyles: React.CSSProperties | undefined =
    comboboxContext.layout === 'input-embedded' && !isInsideInputWrapper
      ? { position: 'relative', zIndex: 1 }
      : undefined

  const element = useRender({
    render,
    ref: mergedRef,
    state,
    props: {
      ...rest,
      ...dataAttrs,
      type: 'text',
      role: 'combobox',
      'aria-autocomplete': 'list',
      'aria-expanded': open,
      'aria-controls': comboboxContext.listId,
      'aria-haspopup': 'listbox',
      'aria-activedescendant': activeDescendant,
      autoComplete: 'off',
      autoCorrect: 'off',
      spellCheck: false,
      disabled,
      placeholder: !hasValue ? placeholder : undefined,
      className: resolveClassName(className, state),
      style: { ...inputEmbeddedStyles, ...resolveStyle(style, state) },
      value: displayValue,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
    },
    defaultTagName: 'input',
  })

  return element
})

export namespace ComboboxInput {
  export interface Props extends ComboboxInputProps {}
  export type State = ComboboxInputState
}
