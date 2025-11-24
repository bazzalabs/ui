import { createMultiSelect } from './create-multi-select.js'

/**
 * Default MultiSelect component with standard theme.
 * Allows selecting multiple values from a list.
 * 
 * @example
 * ```tsx
 * <MultiSelect
 *   value={['apple', 'banana']}
 *   onValueChange={setValues}
 *   items={[
 *     { value: 'apple', label: 'Apple' },
 *     { value: 'banana', label: 'Banana' },
 *     { value: 'cherry', label: 'Cherry' },
 *   ]}
 * />
 * ```
 * 
 * @example
 * With max constraint:
 * ```tsx
 * <MultiSelect
 *   value={values}
 *   onValueChange={setValues}
 *   items={items}
 *   max={3}
 * />
 * ```
 */
export const MultiSelect = createMultiSelect()
