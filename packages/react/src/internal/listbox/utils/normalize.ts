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
