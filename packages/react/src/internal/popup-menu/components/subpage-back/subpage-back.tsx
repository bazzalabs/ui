'use client'

import * as React from 'react'
import {
  resolveClassName,
  resolveStyle,
} from '../../../../utils/resolve-state-props.js'
import type { ComponentProps } from '../../../../utils/types.js'
import { usePart } from '../../../../utils/use-part.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useSubpageContext } from '../../contexts/subpage-context.js'
import { useSubpageStack } from '../../contexts/subpage-stack-context.js'
import { useMenuSurfaceSettings } from '../../contexts/surface-settings-context.js'
import { PopupMenuSubpageBackDataAttributes } from './subpage-back.data-attrs.js'

export { PopupMenuSubpageBackDataAttributes }

export interface PopupMenuSubpageBackState extends Record<string, unknown> {
  /** Whether navigating back is currently possible. */
  canGoBack: boolean
  /** Whether the button is disabled. */
  disabled: boolean
}

const stateAttributesMapping = {
  canGoBack: (value: unknown) =>
    value ? { [PopupMenuSubpageBackDataAttributes.canGoBack]: '' } : null,
  disabled: (value: unknown) =>
    value ? { [PopupMenuSubpageBackDataAttributes.disabled]: '' } : null,
}

export interface PopupMenuSubpageBackProps
  extends ComponentProps<'button', PopupMenuSubpageBack.State> {
  /** Whether this button is disabled. */
  disabled?: boolean
}

/**
 * A button that navigates back one page in the current subpage stack.
 * Useful for custom headers/toolbars outside of list rows.
 * Renders a `<button>` element.
 */
export const PopupMenuSubpageBack = React.forwardRef<
  HTMLButtonElement,
  PopupMenuSubpageBack.Props
>(function PopupMenuSubpageBack(props, forwardedRef) {
  const {
    disabled: disabledProp = false,
    render,
    className,
    style,
    children,
    ...rest
  } = props

  const subpageContext = useSubpageContext()
  const subpageStack = useSubpageStack()
  const focusOwnerStore = useFocusOwner()
  const menuDisabled = useMenuSurfaceSettings().disabled

  const disabled = disabledProp || menuDisabled

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (event.defaultPrevented || disabled) {
        return
      }

      const didGoBack = subpageContext.goBack()
      if (didGoBack && subpageContext.parentSurfaceId) {
        focusOwnerStore.setOwnerId(subpageContext.parentSurfaceId)
      }
    },
    [disabled, subpageContext, focusOwnerStore],
  )

  const state: PopupMenuSubpageBack.State = React.useMemo(
    () => ({
      canGoBack: subpageStack.canGoBack,
      disabled,
    }),
    [subpageStack.canGoBack, disabled],
  )

  const componentName = useMaybeComponentName()
  const slotAttr = getSlotAttribute(componentName, 'subpage-back')

  return usePart({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    consumer: rest,
    props: {
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      type: 'button',
      disabled,
      className: resolveClassName(className, state),
      style: resolveStyle(style, state),
      onClick: handleClick,
      children,
    },
    defaultTagName: 'button',
  })
})

export namespace PopupMenuSubpageBack {
  export type State = PopupMenuSubpageBackState
  export interface Props extends PopupMenuSubpageBackProps {}
}
