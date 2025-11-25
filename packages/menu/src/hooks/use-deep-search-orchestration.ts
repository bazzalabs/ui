/**
 * @deprecated This file is deprecated. Please import from './use-menu.js' instead.
 *
 * This file maintains backwards compatibility for existing imports.
 * It will be removed in a future major version.
 */

import { type UseMenuConfig, type UseMenuResult, useMenu } from './use-menu.js'

/**
 * @deprecated Use `UseMenuConfig` from './use-menu.js' instead.
 */
export type DeepSearchOrchestrationConfig<T> = UseMenuConfig<T>

/**
 * @deprecated Use `UseMenuResult` from './use-menu.js' instead.
 */
export type DeepSearchOrchestrationResult<T> = UseMenuResult<T>

/**
 * @deprecated Use `useMenu` from './use-menu.js' instead.
 *
 * Centralized hook for orchestrating deep search across nested submenus.
 *
 * This is now an alias for `useMenu`. Please update your imports:
 * ```tsx
 * // Old
 * import { useDeepSearchOrchestration } from '@bazza-ui/menu'
 *
 * // New
 * import { useMenu } from '@bazza-ui/menu'
 * ```
 */
export const useDeepSearchOrchestration = useMenu
