import type * as React from 'react'

/**
 * Render function that receives props and state, returns a React element.
 */
export type ComponentRenderFn<Props, State> = (
  props: Props,
  state: State,
) => React.ReactElement<unknown>

/**
 * HTML props with ref support.
 */
export type HTMLProps<T = any> = React.HTMLAttributes<T> & {
  ref?: React.Ref<T> | undefined
}

/**
 * Props shared by all Bazza UI components.
 * Includes className (string or state-based function), render prop, and style (object or state-based function).
 */
export type ComponentProps<
  ElementType extends React.ElementType,
  State,
  RenderFunctionProps = HTMLProps,
> = Omit<
  React.ComponentPropsWithRef<ElementType>,
  'className' | 'color' | 'defaultValue' | 'defaultChecked'
> & {
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component's state.
   */
  className?: string | ((state: State) => string | undefined)

  /**
   * Allows you to replace the component's HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render?: ComponentRenderFn<RenderFunctionProps, State> | React.ReactElement

  /**
   * Style applied to the element, or a function that
   * returns a style object based on the component's state.
   */
  style?:
    | React.CSSProperties
    | ((state: State) => React.CSSProperties | undefined)
}
