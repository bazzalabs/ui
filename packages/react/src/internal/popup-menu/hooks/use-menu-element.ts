'use client'

import type { ElementRole } from '@bazza-ui/menu-core'
import * as React from 'react'
import { useMaybeMenuTree } from '../contexts/menu-tree-context.js'

/**
 * A ref callback that registers the element it receives with the menu tree's
 * element registry, as `role`, for as long as it's attached. A popup passes
 * the id of the surface it opens with.
 */
export function useMenuElement(
  role: ElementRole,
  surfaceId?: string,
): React.RefCallback<Element> {
  const tree = useMaybeMenuTree()
  const removeRef = React.useRef<(() => void) | undefined>(undefined)
  return React.useCallback(
    (element: Element | null) => {
      removeRef.current?.()
      removeRef.current =
        element && tree
          ? tree.elements.add(role, element, surfaceId)
          : undefined
    },
    [tree, role, surfaceId],
  )
}

/**
 * An `onPointerDownCapture` handler for a part whose content may portal out of
 * its element (a consumer's popover opened from a menu item): it claims the
 * press for the menu tree, so the press isn't an outside one, then calls
 * `handler`.
 */
export function usePressClaim<E extends Element>(
  handler: React.PointerEventHandler<E> | undefined,
): React.PointerEventHandler<E> {
  const tree = useMaybeMenuTree()
  return (event) => {
    if (tree) tree.elements.claim(event.nativeEvent)
    handler?.(event)
  }
}
