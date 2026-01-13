'use client'

import * as React from 'react'
import { useComboboxContext } from '../contexts/combobox-context.js'
import { useComboboxItemContext } from '../item/item-context.js'

export interface ComboboxItemLabelProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

/**
 * Renders the text label for a combobox item.
 * Automatically registers the text content for use in the input display.
 * Renders a `<span>` element.
 */
export const ComboboxItemLabel = React.forwardRef<
  HTMLSpanElement,
  ComboboxItemLabelProps
>(function ComboboxItemLabel(props, forwardedRef) {
  const { children, ...rest } = props

  const comboboxContext = useComboboxContext()
  const itemContext = useComboboxItemContext()

  const internalRef = React.useRef<HTMLSpanElement>(null)

  // Register text content when mounted or children change
  React.useEffect(() => {
    const element = internalRef.current
    if (!element) return

    // Extract text content from the element
    const textContent = element.textContent ?? ''
    if (textContent) {
      return comboboxContext.registerItemText(itemContext.value, textContent)
    }
  }, [children, comboboxContext, itemContext.value])

  // Merge refs
  const mergedRef = React.useCallback(
    (node: HTMLSpanElement | null) => {
      ;(internalRef as React.MutableRefObject<HTMLSpanElement | null>).current =
        node
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    [forwardedRef],
  )

  return (
    <span ref={mergedRef} {...rest}>
      {children}
    </span>
  )
})

export namespace ComboboxItemLabel {
  export interface Props extends ComboboxItemLabelProps {}
}
