'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { usePopupMenuContext } from '../../internal/popup-menu/contexts/popup-menu-context.js'
import type { ComponentProps } from '../../utils/types.js'
import { useComboboxContext } from '../contexts/combobox-context.js'
import { ComboboxInputWrapperDataAttributes } from './input-wrapper.data-attrs.js'
import { ComboboxInputWrapperContext } from './input-wrapper-context.js'

export { ComboboxInputWrapperDataAttributes }

export interface ComboboxInputWrapperState extends Record<string, unknown> {
  /**
   * Whether the combobox popup is open.
   */
  open: boolean
}

export interface ComboboxInputWrapperProps
  extends ComponentProps<'div', ComboboxInputWrapperState> {}

const stateAttributesMapping = {
  open: (value: unknown): Record<string, string> | null =>
    value ? { [ComboboxInputWrapperDataAttributes.open]: '' } : null,
}

/**
 * A wrapper component for the Combobox.Input and Combobox.Icon.
 * Provides relative positioning context and manages z-index for input-embedded layouts.
 * Use this to position icons or other elements inside/over the input.
 *
 * Renders a `<div>` element with `position: relative`.
 */
export const ComboboxInputWrapper = React.forwardRef<
  HTMLDivElement,
  ComboboxInputWrapperProps
>(function ComboboxInputWrapper(props, forwardedRef) {
  const { render, className, style, children, ...rest } = props

  const { store } = usePopupMenuContext()
  const comboboxContext = useComboboxContext()
  const open = store.useState('open')

  const state: ComboboxInputWrapperState = React.useMemo(
    () => ({ open }),
    [open],
  )

  // When input-embedded layout, apply higher z-index to ensure
  // the wrapper (and its children like Icon) appear above the popup
  const inputEmbeddedStyles: React.CSSProperties =
    comboboxContext.layout === 'input-embedded'
      ? { position: 'relative', zIndex: 1 }
      : { position: 'relative' }

  // Register wrapper element for positioning (used as anchor instead of input)
  const mergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      comboboxContext.setInputWrapperElement(node)
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    [forwardedRef, comboboxContext],
  )

  const element = useRender({
    render,
    ref: mergedRef,
    state,
    stateAttributesMapping,
    props: {
      ...rest,
      className,
      style: { ...inputEmbeddedStyles, ...style },
      children,
    },
    defaultTagName: 'div',
  })

  return (
    <ComboboxInputWrapperContext.Provider value={true}>
      {element}
    </ComboboxInputWrapperContext.Provider>
  )
})

export namespace ComboboxInputWrapper {
  export type State = ComboboxInputWrapperState
  export interface Props extends ComboboxInputWrapperProps {}
}
