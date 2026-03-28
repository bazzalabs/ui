/**
 * Resolve a display label from an object value.
 * Auto-detects { label } shape if no custom function is provided.
 *
 * @param value - The value to convert to a label
 * @param itemToStringLabel - Optional custom function to extract the label
 * @returns The string label for display
 */
export function resolveLabel<Value>(
  value: Value,
  itemToStringLabel?: (value: Value) => string,
): string {
  if (value == null) return ''
  if (itemToStringLabel) return itemToStringLabel(value)

  // Auto-detect { label } shape
  if (typeof value === 'object' && 'label' in value) {
    const label = (value as Record<string, unknown>).label
    if (typeof label === 'string') return label
  }

  return String(value)
}

/**
 * Serialize an object value for form submission.
 * Auto-detects { value } shape if no custom function is provided.
 *
 * @param value - The value to serialize
 * @param itemToStringValue - Optional custom function to serialize the value
 * @returns The string value for form submission
 */
export function stringifyAsValue<Value>(
  value: Value,
  itemToStringValue?: (value: Value) => string,
): string {
  if (value == null) return ''
  if (itemToStringValue) return itemToStringValue(value)

  // Auto-detect { value } shape
  if (typeof value === 'object' && 'value' in value) {
    return String((value as Record<string, unknown>).value)
  }

  return String(value)
}
