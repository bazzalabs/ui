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

    if (defaults.surface) {
      result.surface = { ...result.surface, ...defaults.surface }
    }

    if (defaults.item) {
      result.item = { ...result.item, ...defaults.item }
    }

    if (defaults.virtualization) {
      result.virtualization = {
        ...result.virtualization,
        ...defaults.virtualization,
      }
    }
  }

  return result
}
