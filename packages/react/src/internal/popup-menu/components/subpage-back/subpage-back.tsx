'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../../../utils/types.js'
import {
  getSlotAttribute,
  useMaybeComponentName,
} from '../../contexts/component-name-context.js'
import { useFocusOwner } from '../../contexts/focus-owner-context.js'
import { useSubpageContext } from '../../contexts/subpage-context.js'
import { useSubpageStack } from '../../contexts/subpage-stack-context.js'
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
    disabled = false,
    render,
    className,
    style,
    onClick,
    children,
    ...rest
  } = props

  const subpageContext = useSubpageContext()
  const subpageStack = useSubpageStack()
  const focusOwnerStore = useFocusOwner()

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (event.defaultPrevented || disabled) {
        return
      }

      const didGoBack = subpageContext.goBack()
      if (didGoBack && subpageContext.parentSurfaceId) {
        focusOwnerStore.setOwnerId(subpageContext.parentSurfaceId)
      }
    },
    [onClick, disabled, subpageContext, focusOwnerStore],
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

  return useRender({
    render,
    ref: forwardedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      ...(slotAttr ? { [slotAttr]: '' } : {}),
      type: 'button',
      disabled,
      className,
      style,
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
