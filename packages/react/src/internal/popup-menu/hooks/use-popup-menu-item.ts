'use client'

// ============================================================================
// usePopupMenuItem Hook - Wrapper around internal/listbox useListboxItem
// ============================================================================
// This wrapper adds aim-guard support and close-on-click behavior for popup menus

import * as React from 'react'
import {
  type UseListboxItemParams,
  type UseListboxItemReturn,
  useListboxContext,
  useListboxItem,
} from '../../listbox/index.js'
import { useMaybePopupMenuContext } from '../contexts/popup-menu-context.js'
import { useAimGuard } from './use-aim-guard.js'

export interface UsePopupMenuItemParams
  extends Omit<UseListboxItemParams, 'aimGuard' | 'onAfterSelect'> {
  /**
   * Whether clicking this item should close the menu.
   * @default true
   */
  closeOnClick?: boolean
}

export interface UsePopupMenuItemReturn extends UseListboxItemReturn {
  /** Whether this item is effectively disabled (item disabled OR menu disabled). */
  disabled: boolean
}

/**
 * Hook that provides all shared logic for navigatable/highlightable popup menu items.
 * This is a thin wrapper around useListboxItem that automatically adds aim-guard
 * support and handles close-on-click behavior.
 *
 * @see useListboxItem for full documentation
 */
export function usePopupMenuItem(
  params: UsePopupMenuItemParams,
): UsePopupMenuItemReturn {
  const { closeOnClick = true, disabled = false, ...rest } = params
  const { aimGuardActiveRef, guardedDepthRef } = useAimGuard()
  const { closeAll } = useListboxContext()
  const popupMenuContext = useMaybePopupMenuContext()

  const menuDisabled = popupMenuContext?.disabled ?? false
  const effectiveDisabled = disabled || menuDisabled

  // Create aim guard refs object for the listbox hook
  const aimGuard = React.useMemo(
    () => ({
      aimGuardActiveRef,
      guardedDepthRef,
    }),
    [aimGuardActiveRef, guardedDepthRef],
  )

  // Handle after-select behavior (close menu if closeOnClick is true)
  const handleAfterSelect = React.useCallback(
    (_itemId: string) => {
      if (closeOnClick) {
        closeAll()
      }
    },
    [closeOnClick, closeAll],
  )

  const item = useListboxItem({
    ...rest,
    disabled: effectiveDisabled,
    aimGuard,
    closeOnClick,
    onAfterSelect: handleAfterSelect,
  })

  return React.useMemo(
    () => ({
      ...item,
      disabled: effectiveDisabled,
    }),
    [item, effectiveDisabled],
  )
}
