'use client'

import { Popover } from '@base-ui/react/popover'
import * as React from 'react'
import {
  PopupMenuPopup,
  type PopupMenuPopupState,
} from '../../internal/popup-menu/components/popup/popup.js'
import type { ComponentRenderFn } from '../../utils/types.js'
import { useSelectPositionerContext } from '../contexts/select-positioner-context.js'

// ============================================================================
// Types
// ============================================================================

export interface SelectPopupState extends Omit<PopupMenuPopupState, 'side'> {
  /**
   * Side the popup is placed on relative to the trigger.
   *
   * Reports `'none'` while `alignItemWithTrigger` positioning is active, because
   * the popup overlaps the trigger and therefore has no physical side. This
   * mirrors Base UI's behavior instead of leaking the `'bottom'` fallback that
   * the underlying Popover computes when no side is provided.
   */
  side: PopupMenuPopupState['side'] | 'none'

  /**
   * Whether the popup is currently using align-item-with-trigger positioning.
   * This reflects the actual state, not just the prop value - it will be false
   * if alignment couldn't be applied (e.g., not enough space, no selected item).
   */
  alignItemWithTriggerActive: boolean
}

export interface SelectPopupProps
  extends Omit<PopupMenuPopup.Props, 'className' | 'render'> {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component's state.
   */
  className?: string | ((state: SelectPopupState) => string)

  /**
   * Allows replacing the popup element with a custom element.
   * The render state includes Select-specific alignment state.
   */
  render?:
    | React.ReactElement
    | ComponentRenderFn<React.HTMLAttributes<HTMLElement>, SelectPopupState>
}

// ============================================================================
// Component
// ============================================================================

/**
 * A container for the select popup contents.
 * Extends PopupMenuPopup with Select-specific state including alignItemWithTriggerActive.
 *
 * Renders a `<div>` element.
 */
export const SelectPopup = React.forwardRef<HTMLDivElement, SelectPopup.Props>(
  function SelectPopup(props, forwardedRef) {
    const { className: classNameProp, render: renderProp, ...rest } = props

    // Get positioner context for alignItemWithTriggerActive
    const positionerContext = useSelectPositionerContext()
    const alignItemWithTriggerActive =
      positionerContext?.alignItemWithTriggerActive ?? false
    const align = positionerContext?.align

    // Extend the base popup state with Select-specific fields. While alignment
    // is active the popup overlaps the trigger, so there is no physical side -
    // surface `'none'` instead of the Popover's `'bottom'` fallback.
    const extendState = React.useCallback(
      (baseState: PopupMenuPopupState): SelectPopupState => ({
        ...baseState,
        side: alignItemWithTriggerActive ? 'none' : baseState.side,
        alignItemWithTriggerActive,
      }),
      [alignItemWithTriggerActive],
    )

    // Wrap className to expose the extended Select state
    const className = React.useMemo(() => {
      if (typeof classNameProp === 'function') {
        return (baseState: PopupMenuPopupState) =>
          classNameProp(extendState(baseState))
      }
      return classNameProp
    }, [classNameProp, extendState])

    // Wrap render to expose the extended Select state
    const render = React.useMemo(() => {
      if (typeof renderProp === 'function') {
        return (
          renderProps: React.HTMLAttributes<HTMLElement>,
          baseState: PopupMenuPopupState,
        ) => renderProp(renderProps, extendState(baseState))
      }
      return renderProp
    }, [renderProp, extendState])

    return (
      <PopupMenuPopup
        ref={forwardedRef}
        className={className}
        render={render}
        data-align-item-with-trigger={
          alignItemWithTriggerActive ? '' : undefined
        }
        // When alignment is active, override the side/align data attributes the
        // underlying Popover derives from its state so the DOM matches the
        // `'none'` side we report. The key is omitted entirely when inactive to
        // avoid clobbering Popover's own `data-side`/`data-align` with
        // `undefined` (Base UI's prop merge does not skip undefined values).
        {...(alignItemWithTriggerActive
          ? { 'data-side': 'none', 'data-align': align }
          : {})}
        {...rest}
      />
    )
  },
)

export namespace SelectPopup {
  export type Props = SelectPopupProps
  export type State = SelectPopupState
}
