'use client'

import type { AimGuardRefs } from '../../listbox/hooks/use-listbox-item.js'
import {
  type MenuTreeTier,
  useMaybeMenuTreeTier,
} from '../contexts/menu-tree-context.js'

const IDLE_REFS: AimGuardRefs = {
  aimGuardActiveRef: { current: false },
  guardedDepthRef: { current: null },
}

const refsByTier = new WeakMap<MenuTreeTier, AimGuardRefs>()

/**
 * The tree's aim guard as the listbox's rows read it (`AimGuardRefs`): refs
 * that read the guard's state when read, so a row reads it current in its
 * handler, and reads it idle while the tree has none (no submenu trigger
 * has made it).
 */
export function useAimGuardRefs(): AimGuardRefs {
  const tier = useMaybeMenuTreeTier()
  if (!tier) return IDLE_REFS
  let refs = refsByTier.get(tier)
  if (!refs) {
    refs = {
      aimGuardActiveRef: {
        get current() {
          return tier.aimGuard?.getSnapshot().active ?? false
        },
      },
      guardedDepthRef: {
        get current() {
          return tier.aimGuard?.getSnapshot().depth ?? null
        },
      },
    }
    refsByTier.set(tier, refs)
  }
  return refs
}
