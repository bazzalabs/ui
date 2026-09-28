import type * as React from 'react'

/**
 * A `className` prop: a string, or a function of the part's state.
 */
export type StateClassName<State> =
  | string
  | ((state: State) => string | undefined)
  | undefined

/**
 * A `style` prop: a style object, or a function of the part's state.
 */
export type StateStyle<State> =
  | React.CSSProperties
  | ((state: State) => React.CSSProperties | undefined)
  | undefined

/**
 * Resolves a `className` prop against the part's state.
 *
 * Base UI's `useRender` only resolves `className` functions passed at the top
 * level of its parameters, not inside `props`. Parts that merge `className`
 * into `props` must resolve it first, or the function reaches the DOM.
 */
export function resolveClassName<State>(
  className: StateClassName<State>,
  state: State,
): string | undefined {
  return typeof className === 'function' ? className(state) : className
}

/**
 * Resolves a `style` prop against the part's state.
 *
 * See {@link resolveClassName} for why this is needed before `useRender`.
 */
export function resolveStyle<State>(
  style: StateStyle<State>,
  state: State,
): React.CSSProperties | undefined {
  return typeof style === 'function' ? style(state) : style
}

/**
 * Combines a consumer `style` prop with internal styles without resolving it.
 *
 * Use this when forwarding `style` to a Base UI component, which resolves
 * `style` functions with its own state. Spreading a function (`{ ...style }`)
 * would silently drop it, so a function `style` stays a function here.
 *
 * @param style The consumer's `style` prop.
 * @param build Builds the final style from the resolved consumer style.
 */
export function composeStyle<State>(
  style: StateStyle<State>,
  build: (style: React.CSSProperties | undefined) => React.CSSProperties,
): React.CSSProperties | ((state: State) => React.CSSProperties) {
  if (typeof style === 'function') {
    return (state: State) => build(style(state))
  }
  return build(style)
}
