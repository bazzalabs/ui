import { describe, expect, it } from 'vitest'
import { resolveLabel, stringifyAsValue } from './resolve-value-label.js'

describe('resolve-value-label utilities', () => {
  describe('resolveLabel', () => {
    describe('with primitive values', () => {
      it('returns string value as-is', () => {
        expect(resolveLabel('apple')).toBe('apple')
        expect(resolveLabel('Banana Fruit')).toBe('Banana Fruit')
      })

      it('converts numbers to string', () => {
        expect(resolveLabel(42)).toBe('42')
        expect(resolveLabel(3.14)).toBe('3.14')
      })

      it('converts booleans to string', () => {
        expect(resolveLabel(true)).toBe('true')
        expect(resolveLabel(false)).toBe('false')
      })

      it('returns empty string for null', () => {
        expect(resolveLabel(null)).toBe('')
      })

      it('returns empty string for undefined', () => {
        expect(resolveLabel(undefined)).toBe('')
      })
    })

    describe('with { label } shaped objects', () => {
      it('auto-detects and uses the label property', () => {
        expect(resolveLabel({ label: 'Apple' })).toBe('Apple')
        expect(resolveLabel({ id: 1, label: 'Banana' })).toBe('Banana')
        expect(resolveLabel({ value: 'cherry', label: 'Cherry Fruit' })).toBe(
          'Cherry Fruit',
        )
      })

      it('falls back to String() if label is not a string', () => {
        expect(resolveLabel({ label: 123 })).toBe('[object Object]')
        expect(resolveLabel({ label: null })).toBe('[object Object]')
      })

      it('falls back to String() if label property is missing', () => {
        expect(resolveLabel({ id: 1, name: 'Apple' })).toBe('[object Object]')
      })
    })

    describe('with custom itemToStringLabel function', () => {
      it('uses the custom function for string values', () => {
        const customLabel = (v: string) => v.toUpperCase()
        expect(resolveLabel('apple', customLabel)).toBe('APPLE')
      })

      it('uses the custom function for object values', () => {
        interface Fruit {
          id: number
          name: string
        }
        const customLabel = (v: Fruit) => `${v.name} (ID: ${v.id})`
        expect(resolveLabel({ id: 1, name: 'Apple' }, customLabel)).toBe(
          'Apple (ID: 1)',
        )
      })

      it('takes precedence over auto-detected label property', () => {
        const customLabel = (v: { label: string }) =>
          `Custom: ${v.label.toUpperCase()}`
        expect(resolveLabel({ label: 'Apple' }, customLabel)).toBe(
          'Custom: APPLE',
        )
      })
    })

    describe('edge cases', () => {
      it('handles empty string label', () => {
        expect(resolveLabel({ label: '' })).toBe('')
      })

      it('handles arrays', () => {
        expect(resolveLabel(['apple', 'banana'])).toBe('apple,banana')
      })
    })
  })

  describe('stringifyAsValue', () => {
    describe('with primitive values', () => {
      it('returns string value as-is', () => {
        expect(stringifyAsValue('apple')).toBe('apple')
        expect(stringifyAsValue('banana_123')).toBe('banana_123')
      })

      it('converts numbers to string', () => {
        expect(stringifyAsValue(42)).toBe('42')
        expect(stringifyAsValue(0)).toBe('0')
      })

      it('converts booleans to string', () => {
        expect(stringifyAsValue(true)).toBe('true')
        expect(stringifyAsValue(false)).toBe('false')
      })

      it('returns empty string for null', () => {
        expect(stringifyAsValue(null)).toBe('')
      })

      it('returns empty string for undefined', () => {
        expect(stringifyAsValue(undefined)).toBe('')
      })
    })

    describe('with { value } shaped objects', () => {
      it('auto-detects and uses the value property', () => {
        expect(stringifyAsValue({ value: 'apple' })).toBe('apple')
        expect(stringifyAsValue({ value: 123 })).toBe('123')
        expect(stringifyAsValue({ value: 'cherry', label: 'Cherry' })).toBe(
          'cherry',
        )
      })

      it('converts non-string value property to string', () => {
        expect(stringifyAsValue({ value: 42 })).toBe('42')
        expect(stringifyAsValue({ value: true })).toBe('true')
      })

      it('falls back to String() if value property is missing', () => {
        expect(stringifyAsValue({ id: 1, name: 'Apple' })).toBe(
          '[object Object]',
        )
      })
    })

    describe('with custom itemToStringValue function', () => {
      it('uses the custom function for string values', () => {
        const customValue = (v: string) => v.toLowerCase()
        expect(stringifyAsValue('APPLE', customValue)).toBe('apple')
      })

      it('uses the custom function for object values', () => {
        interface Fruit {
          id: number
          name: string
        }
        const customValue = (v: Fruit) => String(v.id)
        expect(stringifyAsValue({ id: 123, name: 'Apple' }, customValue)).toBe(
          '123',
        )
      })

      it('takes precedence over auto-detected value property', () => {
        const customValue = (v: { value: string }) => `custom-${v.value}`
        expect(stringifyAsValue({ value: 'apple' }, customValue)).toBe(
          'custom-apple',
        )
      })
    })

    describe('edge cases', () => {
      it('handles empty string value', () => {
        expect(stringifyAsValue({ value: '' })).toBe('')
      })

      it('handles null value property', () => {
        expect(stringifyAsValue({ value: null })).toBe('null')
      })
    })
  })

  describe('real-world scenarios', () => {
    describe('standard { value, label } objects', () => {
      const fruits = [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
        { value: 'cherry', label: 'Cherry Fruit' },
      ]

      it('stringifyAsValue extracts the value for form submission', () => {
        expect(stringifyAsValue(fruits[0])).toBe('apple')
        expect(stringifyAsValue(fruits[1])).toBe('banana')
        expect(stringifyAsValue(fruits[2])).toBe('cherry')
      })

      it('resolveLabel extracts the label for display', () => {
        expect(resolveLabel(fruits[0])).toBe('Apple')
        expect(resolveLabel(fruits[1])).toBe('Banana')
        expect(resolveLabel(fruits[2])).toBe('Cherry Fruit')
      })
    })

    describe('custom object shapes with explicit functions', () => {
      interface User {
        id: number
        firstName: string
        lastName: string
        email: string
      }

      const users: User[] = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        },
      ]

      const userToStringValue = (u: User) => String(u.id)
      const userToStringLabel = (u: User) => `${u.firstName} ${u.lastName}`

      it('serializes user ID for form submission', () => {
        expect(stringifyAsValue(users[0], userToStringValue)).toBe('1')
        expect(stringifyAsValue(users[1], userToStringValue)).toBe('2')
      })

      it('displays full name for user label', () => {
        expect(resolveLabel(users[0], userToStringLabel)).toBe('John Doe')
        expect(resolveLabel(users[1], userToStringLabel)).toBe('Jane Smith')
      })
    })

    describe('registry key usage pattern', () => {
      // This pattern is used in Select/Combobox for itemTextRegistry
      const itemTextRegistry = new Map<string, string>()

      it('can use stringifyAsValue as map key for object values', () => {
        const fruit = { value: 'apple', label: 'Apple' }

        // Register text using serialized key
        const key = stringifyAsValue(fruit)
        itemTextRegistry.set(key, 'Apple Fruit Display Text')

        // Later, look up using the same serialization
        const lookupKey = stringifyAsValue({
          value: 'apple',
          label: 'Different',
        })
        expect(itemTextRegistry.get(lookupKey)).toBe('Apple Fruit Display Text')
      })
    })

    describe('multi-select value serialization', () => {
      it('serializes array of objects for hidden form inputs', () => {
        const selectedFruits = [
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana' },
        ]

        const serializedValues = selectedFruits.map((f) => stringifyAsValue(f))
        expect(serializedValues).toEqual(['apple', 'banana'])
      })
    })
  })
})
