import type { MenuNodeDefaults } from '../types.js'

/**
 * Merges multiple MenuNodeDefaults objects together.
 * Later values override earlier ones (rightmost wins).
 *
 * @example
 * ```ts
 * const result = mergeDefaults(
 *   { item: { closeOnSelect: true } },
 *   { item: { onSelect: myHandler } },
 *   { surface: { vimBindings: false } }
 * )
 * // Result: {
 * //   item: { closeOnSelect: true, onSelect: myHandler },
 * //   surface: { vimBindings: false }
 * // }
 * ```
 */
export function mergeDefaults<T = unknown>(
  ...defaultsList: (MenuNodeDefaults<T> | undefined)[]
): MenuNodeDefaults<T> {
  const result: MenuNodeDefaults<T> = {}

  for (const defaults of defaultsList) {
    if (!defaults) continue

    // Only merge surface if it has actual properties
    if (defaults.surface && Object.keys(defaults.surface).length > 0) {
      result.surface = { ...result.surface, ...defaults.surface }
    }

    // Only merge item if it has actual properties
    if (defaults.item && Object.keys(defaults.item).length > 0) {
      result.item = { ...result.item, ...defaults.item }
    }

    // Only merge virtualization if it has actual properties
    if (
      defaults.virtualization &&
      Object.keys(defaults.virtualization).length > 0
    ) {
      result.virtualization = {
        ...result.virtualization,
        ...defaults.virtualization,
      }
    }
  }

  return result
}
