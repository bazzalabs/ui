import * as React from 'react'
import type { GroupNode } from '../types.js'

export interface MenuGroupPrimitiveProps<T> {
  /** Reference to the group element */
  ref?: React.Ref<HTMLDivElement>
  /** Group node */
  node: GroupNode<T>
  /** Additional className */
  className?: string
  /** Children */
  children: React.ReactNode
}

/**
 * Primitive menu group component that provides:
 * - role="group" for accessibility
 * - aria-labelledby for group heading
 * - Proper data attributes
 */
export function MenuGroupPrimitive<T>({
  ref,
  node,
  className,
  children,
}: MenuGroupPrimitiveProps<T>) {
  const groupId = `menu-group-${node.id}`
  const headingId = node.heading ? `${groupId}-heading` : undefined

  return (
    <div
      ref={ref}
      role="group"
      id={groupId}
      aria-labelledby={headingId}
      data-menu-group=""
      data-menu-group-id={node.id}
      data-variant={node.variant}
      className={className}
    >
      {children}
    </div>
  )
}
