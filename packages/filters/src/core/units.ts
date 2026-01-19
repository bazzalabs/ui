import ms, { type StringValue } from 'ms'

/**
 * Supported duration units for number columns.
 * These determine how values are stored and converted.
 */
export type DurationUnit =
  | 'ms'
  | 'milliseconds'
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'

/**
 * Configuration for number column units.
 * Used in ColumnMeta to specify how numeric values should be interpreted.
 */
export interface NumberUnitConfig {
  /**
   * The base unit that the column stores values in.
   * For example, if your column stores duration in minutes, set this to 'minutes'.
   * When a user types "1hr", it will be converted to 60 minutes.
   */
  unit: DurationUnit
}

/**
 * Result of parsing a number input with optional unit conversion.
 */
export interface ParsedNumberInput {
  /** The parsed numeric value, converted to the target base unit */
  value: number
  /** Whether the input contained a duration unit (e.g., "1hr" vs "60") */
  hasDurationUnit: boolean
  /** Whether a range was detected (e.g., "5-10" or "5..10") */
  isRange: boolean
  /** For ranges, the min and max values */
  rangeValues?: [number, number]
}

/**
 * Divisors to convert from milliseconds to each target unit.
 */
const MS_DIVISORS: Record<DurationUnit, number> = {
  ms: 1,
  milliseconds: 1,
  seconds: 1_000,
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
}

/**
 * Parses a single value that might have a duration unit.
 * Returns the value converted to the specified base unit.
 *
 * @param input - The input string (e.g., "1hr", "30", "2.5d")
 * @param baseUnit - The target unit to convert to
 * @returns The parsed value and whether it contained a duration unit
 */
function parseSingleValue(
  input: string,
  baseUnit: DurationUnit,
): { value: number; hasDurationUnit: boolean } | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // First, try parsing with ms library for duration strings
  // We cast to StringValue since at runtime ms() accepts any string
  // and returns undefined for invalid input
  const msValue = ms(trimmed as StringValue)
  if (msValue !== undefined && typeof msValue === 'number') {
    // Check if input actually had a duration unit or was just a plain number
    // ms('100') returns 100, but that's just a plain number
    const hasDurationUnit = /[a-zA-Z]/.test(trimmed)
    const convertedValue = msValue / MS_DIVISORS[baseUnit]
    return { value: convertedValue, hasDurationUnit }
  }

  // Fallback: try parsing as plain number
  const plainNumber = Number.parseFloat(trimmed)
  if (!Number.isNaN(plainNumber)) {
    return { value: plainNumber, hasDurationUnit: false }
  }

  return null
}

/**
 * Parses a number input string, handling:
 * - Plain numbers: "42", "3.14"
 * - Duration units: "1hr", "30min", "2d", "5s"
 * - Range syntax: "5-10", "5..10", "5 to 10"
 *
 * The result is converted to the specified base unit.
 *
 * @param input - The input string to parse
 * @param baseUnit - The target unit to convert to (defaults to 'ms')
 * @returns ParsedNumberInput or null if parsing fails
 *
 * @example
 * // Plain number
 * parseNumberInput('42', 'minutes') // { value: 42, hasDurationUnit: false, isRange: false }
 *
 * // Duration with unit (converted to minutes)
 * parseNumberInput('1hr', 'minutes') // { value: 60, hasDurationUnit: true, isRange: false }
 *
 * // Range
 * parseNumberInput('5-10', 'minutes') // { value: 5, hasDurationUnit: false, isRange: true, rangeValues: [5, 10] }
 */
export function parseNumberInput(
  input: string,
  baseUnit: DurationUnit = 'ms',
): ParsedNumberInput | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Check for range patterns: "5-10", "5..10", "5 to 10"
  // Be careful not to match negative numbers like "-5"
  const rangePatterns = [
    /^(.+?)\.\.(.+)$/, // "5..10"
    /^(.+?)\s+to\s+(.+)$/i, // "5 to 10"
    /^([^-]+)-(.+)$/, // "5-10" but not "-5" (must have something before the dash)
  ]

  for (const pattern of rangePatterns) {
    const match = trimmed.match(pattern)
    if (match) {
      const [, minStr, maxStr] = match
      if (minStr && maxStr) {
        const minResult = parseSingleValue(minStr, baseUnit)
        const maxResult = parseSingleValue(maxStr, baseUnit)

        if (minResult && maxResult) {
          // Ensure min <= max
          const [min, max] =
            minResult.value <= maxResult.value
              ? [minResult.value, maxResult.value]
              : [maxResult.value, minResult.value]

          return {
            value: min,
            hasDurationUnit:
              minResult.hasDurationUnit || maxResult.hasDurationUnit,
            isRange: true,
            rangeValues: [min, max],
          }
        }
      }
    }
  }

  // Not a range, parse as single value
  const singleResult = parseSingleValue(trimmed, baseUnit)
  if (singleResult) {
    return {
      value: singleResult.value,
      hasDurationUnit: singleResult.hasDurationUnit,
      isRange: false,
    }
  }

  return null
}

/**
 * Formats a number value with its unit for display.
 * Used to show the converted value in filter menu items.
 *
 * @param value - The numeric value
 * @param unit - The unit to display
 * @returns Formatted string like "60 minutes" or "2 hours"
 */
export function formatNumberWithUnit(
  value: number,
  unit: DurationUnit,
): string {
  // For clean display, use appropriate abbreviations
  const unitLabels: Record<DurationUnit, string> = {
    ms: 'ms',
    milliseconds: 'ms',
    seconds: 's',
    minutes: 'min',
    hours: 'hr',
    days: 'd',
  }

  // Round to reasonable precision to avoid floating point noise
  const roundedValue = Math.round(value * 1000) / 1000

  return `${roundedValue}${unitLabels[unit]}`
}

/**
 * Converts a value from one duration unit to another.
 *
 * @param value - The value to convert
 * @param fromUnit - The source unit
 * @param toUnit - The target unit
 * @returns The converted value
 */
export function convertDuration(
  value: number,
  fromUnit: DurationUnit,
  toUnit: DurationUnit,
): number {
  // Convert to milliseconds first, then to target unit
  const msValue = value * MS_DIVISORS[fromUnit]
  return msValue / MS_DIVISORS[toUnit]
}
