/**
 * Normalizes a value string for use in filtering and identification.
 * Trims leading/trailing whitespace to match cmdk's behavior.
 *
 * @param value - The value to normalize
 * @returns The trimmed value, or empty string if value is nullish
 */
export function normalizeValue(value: string | undefined | null): string {
  return value?.trim() ?? ''
}

/**
 * Remove diacritics/accents from a string so unaccented queries match accented
 * content (e.g. "cafe" matches "café", "municao" matches "munição").
 *
 * Uses Unicode NFD decomposition and strips combining marks. Characters that
 * do not decompose into a base letter plus a combining mark (e.g. "ø", "ł")
 * are intentionally left unchanged.
 *
 * @param value - The value to fold
 * @returns The value with combining diacritical marks removed
 */
export function deburr(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

/**
 * Converts a value string to a URL-safe slug for use in IDs.
 * - Trims whitespace
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes non-alphanumeric characters (except hyphens)
 * - Collapses multiple hyphens into one
 * - Removes leading/trailing hyphens
 *
 * @example
 * slugify("User Settings") // "user-settings"
 * slugify("  Hello World!  ") // "hello-world"
 * slugify("Café & Co.") // "caf-co"
 *
 * @param value - The value to slugify
 * @returns The slugified value, or empty string if value is nullish
 */
export function slugify(value: string | undefined | null): string {
  if (!value) return ''

  return (
    value
      .trim()
      .toLowerCase()
      // Replace spaces with hyphens
      .replace(/\s+/g, '-')
      // Remove non-alphanumeric characters (except hyphens)
      .replace(/[^a-z0-9-]/g, '')
      // Collapse multiple hyphens into one
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-|-$/g, '')
  )
}
