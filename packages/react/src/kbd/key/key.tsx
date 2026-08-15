'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import type { ComponentProps } from '../../utils/types.js'
import { KbdKeyDataAttributes } from './key.data-attrs.js'

export interface KbdKeyState extends Record<string, unknown> {}

export interface KbdKeyProps extends ComponentProps<'kbd', KbdKey.State> {
  label?: string
}

export const KbdKey = React.forwardRef<HTMLElement, KbdKey.Props>(
  function KbdKey(props, forwardedRef) {
    const { label, children, render, className, style, ...rest } = props

    const state: KbdKey.State = React.useMemo(() => ({}), [])
    const renderedChildren = children ?? label

    return useRender({
      render,
      ref: forwardedRef,
      state,
      props: {
        ...rest,
        [KbdKeyDataAttributes.key]: '',
        className,
        style,
        children: renderedChildren,
      },
      defaultTagName: 'kbd',
    })
  },
)

export namespace KbdKey {
  export type State = KbdKeyState
  export interface Props extends KbdKeyProps {}
}
