import * as React from 'react'
import type { Iconish } from '../types.js'
import { cn } from './cn.js'

/** True when the ReactNode is an element that carries `propName`. */
export function isElementWithProp(node: React.ReactNode, propName: string) {
  return React.isValidElement(node) && propName in (node.props as any)
}

/** True when any descendant element carries `propName`. */
export function hasDescendantWithProp(
  node: React.ReactNode,
  propName: string,
): boolean {
  if (!node) return false
  if (Array.isArray(node))
    return node.some((n) => hasDescendantWithProp(n, propName))
  if (React.isValidElement(node)) {
    if (propName in (node.props as any)) return true
    const ch = (node.props as any)?.children
    return hasDescendantWithProp(ch, propName)
  }
  return false
}

/** Render an icon from heterogeneous inputs (node, element, component). */
export function renderIcon(icon?: Iconish, className?: string) {
  if (!icon) return null
  if (typeof icon === 'string') return icon
  if (React.isValidElement(icon)) {
    const prev = (icon.props as any)?.className
    return React.cloneElement(icon as any, { className: cn(prev, className) })
  }
  const Comp = icon as React.ElementType
  return <Comp className={className} />
}
