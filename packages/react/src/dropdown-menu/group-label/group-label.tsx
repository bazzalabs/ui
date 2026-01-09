'use client'

import * as React from 'react'

export interface DropdownMenuGroupLabelProps
  extends React.ComponentPropsWithoutRef<'div'> {
  children: React.ReactNode
}

/**
 * A label/heading for a group of dropdown menu items.
 * Renders a `<div>` element with role="presentation".
 */
export const DropdownMenuGroupLabel = React.forwardRef<
  HTMLDivElement,
  DropdownMenuGroupLabelProps
>(function DropdownMenuGroupLabel(props, forwardedRef) {
  const { children, ...rest } = props

  return (
    <div
      ref={forwardedRef}
      {...rest}
      // Presentation role - this is a visual label, not interactive
      role="presentation"
      // aria-hidden since the group label is decorative for screen readers
      // in the context of a listbox (options are the semantic elements)
      aria-hidden="true"
    >
      {children}
    </div>
  )
})

export namespace DropdownMenuGroupLabel {
  export interface Props extends DropdownMenuGroupLabelProps {}
}
