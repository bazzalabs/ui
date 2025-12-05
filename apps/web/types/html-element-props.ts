/**
 * Standard HTML element prop types for documentation.
 * These are extracted to allow TypeDiff to show only unique props
 * when a component extends standard HTML elements.
 */
import type { ComponentPropsWithRef } from 'react'

/**
 * Standard props for a `<div>` element.
 * Use with TypeDiff to filter out inherited div props.
 */
export type DivProps = ComponentPropsWithRef<'div'>

/**
 * Standard props for a `<button>` element.
 * Use with TypeDiff to filter out inherited button props.
 */
export type ButtonProps = ComponentPropsWithRef<'button'>

/**
 * Standard props for a `<span>` element.
 * Use with TypeDiff to filter out inherited span props.
 */
export type SpanProps = ComponentPropsWithRef<'span'>

/**
 * Standard props for an `<input>` element.
 * Use with TypeDiff to filter out inherited input props.
 */
export type InputProps = ComponentPropsWithRef<'input'>

/**
 * Standard props for an `<a>` (anchor) element.
 * Use with TypeDiff to filter out inherited anchor props.
 */
export type AnchorProps = ComponentPropsWithRef<'a'>
