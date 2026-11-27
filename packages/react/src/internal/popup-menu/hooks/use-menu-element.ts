'use client'

import { ElementRegistry, type ElementRole } from '@bazza-ui/menu-core'
import * as React from 'react'
import { useMaybeOpenChain } from '../contexts/open-chain-context.js'
import type { OpenChainStore } from '../store/OpenChainStore.js'

// One registry per menu tree, kept by the tree's OpenChainStore (one per root,
// shared by its submenus) so it stays off the published types.
const registries = new WeakMap<OpenChainStore, ElementRegistry>()

/**
 * The element registry of the menu tree `openChain` belongs to. Its root sets
 * the exempt elements (see `usePopupMenuRoot`).
 */
export function getElementRegistry(openChain: OpenChainStore): ElementRegistry {
  let registry = registries.get(openChain)
  if (!registry) {
    registry = new ElementRegistry()
    registries.set(openChain, registry)
  }
  return registry
}

/**
 * A ref callback that registers the element it receives with the menu tree's
 * element registry, as `role`, for as long as it's attached. A popup passes
 * the id of the surface it opens with.
 */
export function useMenuElement(
  role: ElementRole,
  surfaceId?: string,
): React.RefCallback<Element> {
  const openChain = useMaybeOpenChain()
  const removeRef = React.useRef<(() => void) | undefined>(undefined)
  return React.useCallback(
    (element: Element | null) => {
      removeRef.current?.()
      removeRef.current =
        element && openChain
          ? getElementRegistry(openChain).add(role, element, surfaceId)
          : undefined
    },
    [openChain, role, surfaceId],
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
  const openChain = useMaybeOpenChain()
  return (event) => {
    if (openChain) getElementRegistry(openChain).claim(event.nativeEvent)
    handler?.(event)
  }
}
