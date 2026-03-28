'use client'

import { Popover } from '@base-ui/react/popover'
import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { usePopupMenuContext } from '../../internal/popup-menu/contexts/popup-menu-context.js'
import { REASONS } from '../../utils/events/index.js'
import type { ComponentProps } from '../../utils/types.js'
import { DropdownMenuTriggerDataAttributes } from './trigger.data-attrs.js'

export { DropdownMenuTriggerDataAttributes }

export interface DropdownMenuTriggerState extends Record<string, unknown> {
  /**
   * Whether the dropdown menu is open.
   */
  open: boolean
  /**
   * Whether the trigger is disabled.
   */
  disabled: boolean
}

export interface DropdownMenuTriggerProps
  extends ComponentProps<'button', DropdownMenuTrigger.State> {
  /**
   * Whether the trigger is disabled.
   */
  disabled?: boolean
  /**
   * Whether the menu opens when hovering the trigger.
   * @default false
   */
  openOnHover?: boolean
  /**
   * Delay before opening on hover (in milliseconds).
   * Only applies when `openOnHover` is true.
   * @default 100
   */
  delay?: number
  /**
   * Delay before closing when pointer leaves (in milliseconds).
   * Only applies when `openOnHover` is true.
   * @default 0
   */
  closeDelay?: number
}

const stateAttributesMapping = {
  open: (value: unknown): Record<string, string> | null =>
    value ? { [DropdownMenuTriggerDataAttributes.popupOpen]: '' } : null,
  disabled: (value: unknown): Record<string, string> | null =>
    value ? { 'data-disabled': '' } : null,
}

/**
 * Inner component that renders using useRender.
 */
const DropdownMenuTriggerInner = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps & {
    triggerProps: React.ComponentPropsWithRef<'button'>
    triggerState: { open: boolean; disabled: boolean }
  }
>(function DropdownMenuTriggerInner(props, forwardedRef) {
  const {
    render,
    children,
    disabled,
    className,
    style,
    triggerProps,
    triggerState,
    openOnHover,
    delay,
    closeDelay,
    ...rest
  } = props

  const state: DropdownMenuTrigger.State = React.useMemo(
    () => ({
      open: triggerState.open,
      disabled: triggerState.disabled,
    }),
    [triggerState.open, triggerState.disabled],
  )

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...triggerProps,
      ...rest,
      [DropdownMenuTriggerDataAttributes.slot]: '',
      className,
      style,
      children,
    },
    defaultTagName: 'button',
  })
})

/**
 * A button that opens the dropdown menu.
 * Renders a `<button>` element.
 *
 * Supports `openOnHover` to open the menu when hovering the trigger,
 * with configurable `delay` and `closeDelay`.
 *
 * When `closeOnOutsidePress` is set to `'pointerdown'` on the Root,
 * the trigger will close the menu immediately on pointerdown when open.
 */
export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTrigger.Props
>(function DropdownMenuTrigger(props, forwardedRef) {
  const { disabled, openOnHover, delay, closeDelay, ...rest } = props

  const { store, closeAll, closeOnOutsidePress } = usePopupMenuContext()
  const isOpen = store.useState('open')

  // We need to intercept pointerdown before it reaches Popover.Trigger
  // This ref tracks the element so we can add a one-time click blocker
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
      // If menu is open, close it immediately and block the click
      if (isOpen) {
        closeAll(REASONS.triggerPress, event)

        // Block the upcoming click from reaching Popover.Trigger
        // This prevents the toggle behavior from reopening the menu
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
      openOnHover={openOnHover}
      delay={delay}
      closeDelay={closeDelay}
      render={(triggerProps, triggerState) => (
        <DropdownMenuTriggerInner
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

export namespace DropdownMenuTrigger {
  export interface Props extends DropdownMenuTriggerProps {}
  export type State = DropdownMenuTriggerState
}
