'use client'

import { Popover, type PopoverTriggerProps } from '@base-ui/react/popover'
import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { usePopupMenuContext } from '../../internal/popup-menu/contexts/popup-menu-context.js'
import { REASONS } from '../../utils/events/index.js'
import { mergeElementProps } from '../../utils/merge-element-props.js'
import { isValueEmpty } from '../../utils/resolve-value-label.js'
import type { ComponentProps } from '../../utils/types.js'
import { useSelectContext } from '../contexts/select-context.js'
import { SelectTriggerDataAttributes } from './trigger.data-attrs.js'

export { SelectTriggerDataAttributes }

export interface SelectTriggerState extends Record<string, unknown> {
  /**
   * Whether the select is open.
   */
  open: boolean
  /**
   * Whether the select is disabled.
   */
  disabled: boolean
  /**
   * Whether the select currently shows placeholder (no value selected).
   */
  placeholder: boolean
}

export interface SelectTriggerProps
  extends ComponentProps<'button', SelectTrigger.State> {
  /**
   * Whether the trigger is disabled.
   */
  disabled?: boolean
}

const stateAttributesMapping = {
  open: (value: unknown): Record<string, string> | null =>
    value ? { [SelectTriggerDataAttributes.open]: '' } : null,
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { [SelectTriggerDataAttributes.disabled]: '' } : null,
  placeholder: (value: unknown): Record<string, string> | null =>
    value ? { [SelectTriggerDataAttributes.placeholder]: '' } : null,
}

/**
 * Inner component that renders using useRender.
 * This allows us to use hooks while being called from Popover.Trigger's render prop.
 */
const SelectTriggerInner = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps & {
    triggerProps: React.ComponentPropsWithRef<'button'>
    triggerState: { open: boolean }
  }
>(function SelectTriggerInner(props, forwardedRef) {
  const {
    render,
    children,
    disabled: disabledProp,
    className,
    style,
    triggerProps,
    triggerState,
    ...rest
  } = props

  const selectContext = useSelectContext()
  const disabled = disabledProp ?? selectContext.disabled

  // Determine if showing placeholder
  // Match Base UI: null, undefined, or empty string = no selection
  const hasValue = selectContext.multiple
    ? selectContext.values.length > 0
    : !isValueEmpty(selectContext.value)

  const state: SelectTrigger.State = React.useMemo(
    () => ({
      open: triggerState.open,
      disabled,
      placeholder: !hasValue,
    }),
    [triggerState.open, disabled, hasValue],
  )

  // Register trigger element for positioning
  const internalRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      selectContext.setTriggerElement(node)
    },
    [selectContext],
  )

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...mergeElementProps<'button'>(triggerProps, {
        ...rest,
        className,
        style,
        children,
      } as Partial<React.ComponentPropsWithRef<'button'>>),
      [SelectTriggerDataAttributes.slot]: '',
      ref: internalRef,
      role: 'combobox' as const,
      'aria-haspopup': 'listbox' as const,
      'aria-controls': selectContext.listId,
    },
    defaultTagName: 'button',
  })
})

/**
 * A button that opens the select dropdown.
 * Renders a `<button>` element with combobox ARIA semantics.
 */
export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTrigger.Props
>(function SelectTrigger(props, forwardedRef) {
  const { disabled: disabledProp, ...rest } = props
  const selectContext = useSelectContext()
  const popupMenuContext = usePopupMenuContext()
  const { store, closeAll, closeOnOutsidePress } = popupMenuContext
  const disabled =
    (disabledProp ?? selectContext.disabled) || popupMenuContext.disabled
  const isOpen = store.useState('open')

  // We need to intercept pointerdown before it reaches Popover.Trigger.
  // This ref tracks the element so we can add a one-time click blocker.
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)

  // Combine refs
  const setRef = React.useCallback(
    (element: HTMLButtonElement | null) => {
      triggerRef.current = element
      if (typeof forwardedRef === 'function') {
        forwardedRef(element)
      } else if (forwardedRef) {
        forwardedRef.current = element
      }
    },
    [forwardedRef],
  )

  // Handle pointerdown to close on press when open
  React.useEffect(() => {
    const trigger = triggerRef.current
    if (!trigger || closeOnOutsidePress !== 'pointerdown') return

    const handlePointerDown = (event: PointerEvent) => {
      // If the select is open, close it immediately and block the click
      if (isOpen) {
        closeAll(REASONS.triggerPress, event)

        // Block the upcoming click from reaching Popover.Trigger
        // This prevents the toggle behavior from reopening the popup
        trigger.addEventListener(
          'click',
          (clickEvent) => {
            clickEvent.stopPropagation()
            clickEvent.preventDefault()
          },
          { once: true, capture: true },
        )
      }
    }

    // Use capture phase to see the event before Popover.Trigger
    trigger.addEventListener('pointerdown', handlePointerDown, true)
    return () => {
      trigger.removeEventListener('pointerdown', handlePointerDown, true)
    }
  }, [isOpen, closeAll, closeOnOutsidePress])

  return (
    <Popover.Trigger
      ref={setRef}
      disabled={disabled}
      render={(triggerProps, triggerState) => (
        <SelectTriggerInner
          {...rest}
          disabled={disabled}
          triggerProps={triggerProps}
          triggerState={triggerState}
          ref={triggerProps.ref as React.Ref<HTMLButtonElement>}
        />
      )}
    />
  )
})

export namespace SelectTrigger {
  export interface Props extends SelectTriggerProps {}
  export type State = SelectTriggerState
}
