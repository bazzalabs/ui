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
import { useAimGuard } from './use-aim-guard.js'

export interface UsePopupMenuItemParams
  extends Omit<UseListboxItemParams, 'aimGuard' | 'onAfterSelect'> {
  /**
   * Whether clicking this item should close the menu.
   * @default true
   */
  closeOnClick?: boolean
}

export type UsePopupMenuItemReturn = UseListboxItemReturn

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
  const { closeOnClick = true, ...rest } = params
  const { aimGuardActiveRef, guardedDepthRef } = useAimGuard()
  const { closeAll } = useListboxContext()

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
    (itemId: string) => {
      if (closeOnClick) {
        closeAll()
      }
    },
    [closeOnClick, closeAll],
  )

  return useListboxItem({
    ...rest,
    aimGuard,
    closeOnClick,
    onAfterSelect: handleAfterSelect,
  })
}
