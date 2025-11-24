import { createSelect } from './create-select.js'

/**
 * Default Select component with standard theme.
 * 
 * @example
 * ```tsx
 * <Select
 *   value={value}
 *   onValueChange={setValue}
 *   items={[
 *     { value: 'apple', label: 'Apple' },
 *     { value: 'banana', label: 'Banana' },
 *   ]}
 * />
 * ```
 * 
 * @example
 * With form integration:
 * ```tsx
 * <form>
 *   <Select
 *     name="fruit"
 *     required
 *     items={fruits}
 *   />
 * </form>
 * ```
 */
export const Select = createSelect()
