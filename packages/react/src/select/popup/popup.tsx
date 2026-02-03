'use client'

import { Popover } from '@base-ui/react/popover'
import * as React from 'react'
import {
  PopupMenuPopup,
  type PopupMenuPopupState,
} from '../../internal/popup-menu/components/popup/popup.js'
import { useSelectPositionerContext } from '../contexts/select-positioner-context.js'

// ============================================================================
// Types
// ============================================================================

export interface SelectPopupState extends PopupMenuPopupState {
  /**
   * Whether the popup is currently using align-item-with-trigger positioning.
   * This reflects the actual state, not just the prop value - it will be false
   * if alignment couldn't be applied (e.g., not enough space, no selected item).
   */
  alignItemWithTriggerActive: boolean
}

export interface SelectPopupProps
  extends Omit<PopupMenuPopup.Props, 'className'> {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component's state.
   */
  className?: string | ((state: SelectPopupState) => string)
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
    const { className: classNameProp, ...rest } = props

    // Get positioner context for alignItemWithTriggerActive
    const positionerContext = useSelectPositionerContext()
    const alignItemWithTriggerActive =
      positionerContext?.alignItemWithTriggerActive ?? false

    // Wrap className to include alignItemWithTriggerActive in the state
    const className = React.useMemo(() => {
      if (typeof classNameProp === 'function') {
        return (baseState: PopupMenuPopupState) => {
          const extendedState: SelectPopupState = {
            ...baseState,
            alignItemWithTriggerActive,
          }
          return classNameProp(extendedState)
        }
      }
      return classNameProp
    }, [classNameProp, alignItemWithTriggerActive])

    return (
      <PopupMenuPopup
        ref={forwardedRef}
        className={className}
        data-align-item-with-trigger={
          alignItemWithTriggerActive ? '' : undefined
        }
        {...rest}
      />
    )
  },
)

export namespace SelectPopup {
  export type Props = SelectPopupProps
  export type State = SelectPopupState
}
