import { describe, expect, it } from 'vitest'
import type { FilterModel } from '../core/types.js'
import { bigIntFilterFn, numberFilterFn } from '../lib/filter-fns.js'
import { getValidBigInt } from '../lib/helpers.js'

describe('lib/filter-fns', () => {
  describe('numberFilterFn', () => {
    describe('is operator', () => {
      it('should return true when value equals filter value', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is',
          values: [5],
        }
        expect(numberFilterFn(5, filter)).toBe(true)
        expect(numberFilterFn(5.0, filter)).toBe(true)
      })

      it('should return false when value does not equal filter value', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is',
          values: [5],
        }
        expect(numberFilterFn(4.99, filter)).toBe(false)
        expect(numberFilterFn(5.01, filter)).toBe(false)
        expect(numberFilterFn(0, filter)).toBe(false)
      })

      it('should handle decimal values correctly', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is',
          values: [2.5],
        }
        expect(numberFilterFn(2.5, filter)).toBe(true)
        expect(numberFilterFn(2.4999, filter)).toBe(false)
        expect(numberFilterFn(2.5001, filter)).toBe(false)
      })
    })

    describe('is not operator', () => {
      it('should return false when value equals filter value', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is not',
          values: [5],
        }
        expect(numberFilterFn(5, filter)).toBe(false)
      })

      it('should return true when value does not equal filter value', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is not',
          values: [5],
        }
        expect(numberFilterFn(4.99, filter)).toBe(true)
        expect(numberFilterFn(5.01, filter)).toBe(true)
        expect(numberFilterFn(0, filter)).toBe(true)
      })
    })

    describe('is greater than operator', () => {
      it('should return true when value is greater than filter value', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is greater than',
          values: [5],
        }
        expect(numberFilterFn(5.01, filter)).toBe(true)
        expect(numberFilterFn(10, filter)).toBe(true)
        expect(numberFilterFn(100, filter)).toBe(true)
      })

      it('should return false when value is less than or equal to filter value', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is greater than',
          values: [5],
        }
        expect(numberFilterFn(5, filter)).toBe(false)
        expect(numberFilterFn(4.99, filter)).toBe(false)
        expect(numberFilterFn(0, filter)).toBe(false)
        expect(numberFilterFn(-10, filter)).toBe(false)
      })
    })

    describe('is greater than or equal to operator', () => {
      it('should return true when value is greater than or equal to filter value', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is greater than or equal to',
          values: [5],
        }
        expect(numberFilterFn(5, filter)).toBe(true)
        expect(numberFilterFn(5.01, filter)).toBe(true)
        expect(numberFilterFn(10, filter)).toBe(true)
      })

      it('should return false when value is less than filter value', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is greater than or equal to',
          values: [5],
        }
        expect(numberFilterFn(4.99, filter)).toBe(false)
        expect(numberFilterFn(0, filter)).toBe(false)
        expect(numberFilterFn(-10, filter)).toBe(false)
      })
    })

    describe('is less than operator', () => {
      it('should return true when value is less than filter value', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is less than',
          values: [5],
        }
        expect(numberFilterFn(4.99, filter)).toBe(true)
        expect(numberFilterFn(0, filter)).toBe(true)
        expect(numberFilterFn(-10, filter)).toBe(true)
      })

      it('should return false when value is greater than or equal to filter value', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is less than',
          values: [5],
        }
        expect(numberFilterFn(5, filter)).toBe(false)
        expect(numberFilterFn(5.01, filter)).toBe(false)
        expect(numberFilterFn(10, filter)).toBe(false)
      })
    })

    describe('is less than or equal to operator', () => {
      it('should return true when value is less than or equal to filter value', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is less than or equal to',
          values: [5],
        }
        expect(numberFilterFn(5, filter)).toBe(true)
        expect(numberFilterFn(4.99, filter)).toBe(true)
        expect(numberFilterFn(0, filter)).toBe(true)
        expect(numberFilterFn(-10, filter)).toBe(true)
      })

      it('should return false when value is greater than filter value', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is less than or equal to',
          values: [5],
        }
        expect(numberFilterFn(5.01, filter)).toBe(false)
        expect(numberFilterFn(10, filter)).toBe(false)
        expect(numberFilterFn(100, filter)).toBe(false)
      })
    })

    describe('is between operator', () => {
      it('should return true when value is within the range (inclusive)', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is between',
          values: [0, 2.5],
        }

        // Test boundary values
        expect(numberFilterFn(0, filter)).toBe(true) // Lower bound
        expect(numberFilterFn(2.5, filter)).toBe(true) // Upper bound

        // Test values within range
        expect(numberFilterFn(0.5, filter)).toBe(true)
        expect(numberFilterFn(1.0, filter)).toBe(true)
        expect(numberFilterFn(2.0, filter)).toBe(true)
        expect(numberFilterFn(2.4999, filter)).toBe(true)
      })

      it('should return false when value is outside the range', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is between',
          values: [0, 2.5],
        }

        // Test values below range
        expect(numberFilterFn(-0.01, filter)).toBe(false)
        expect(numberFilterFn(-0.58, filter)).toBe(false)
        expect(numberFilterFn(-0.61, filter)).toBe(false)
        expect(numberFilterFn(-0.65, filter)).toBe(false)
        expect(numberFilterFn(-10, filter)).toBe(false)

        // Test values above range
        expect(numberFilterFn(2.5001, filter)).toBe(false)
        expect(numberFilterFn(2.94, filter)).toBe(false)
        expect(numberFilterFn(4.4, filter)).toBe(false)
        expect(numberFilterFn(4.6, filter)).toBe(false)
        expect(numberFilterFn(10, filter)).toBe(false)
      })

      it('should handle negative ranges correctly', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is between',
          values: [-10, -5],
        }

        expect(numberFilterFn(-10, filter)).toBe(true) // Lower bound
        expect(numberFilterFn(-5, filter)).toBe(true) // Upper bound
        expect(numberFilterFn(-7.5, filter)).toBe(true) // Within range
        expect(numberFilterFn(-4.99, filter)).toBe(false) // Above range
        expect(numberFilterFn(-10.01, filter)).toBe(false) // Below range
        expect(numberFilterFn(0, filter)).toBe(false) // Way above range
      })

      it('should handle single value edge case', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is between',
          values: [5, 5], // Same lower and upper bound
        }

        expect(numberFilterFn(5, filter)).toBe(true)
        expect(numberFilterFn(4.99, filter)).toBe(false)
        expect(numberFilterFn(5.01, filter)).toBe(false)
      })

      it('should return true when bounds are undefined', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is between',
          values: [undefined as any, undefined as any],
        }

        expect(numberFilterFn(5, filter)).toBe(true)
        expect(numberFilterFn(-10, filter)).toBe(true)
        expect(numberFilterFn(100, filter)).toBe(true)
      })

      it('should handle reversed bounds correctly', () => {
        // This tests if the function handles bounds in wrong order
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is between',
          values: [10, 5], // Upper bound first, lower bound second
        }

        // The function should still work logically with the bounds as provided
        // 10 >= 10 && 10 <= 5 = true && false = false
        expect(numberFilterFn(10, filter)).toBe(true)
        // 5 >= 10 && 5 <= 5 = false && true = false
        expect(numberFilterFn(5, filter)).toBe(true)
        // 7 >= 10 && 7 <= 5 = false && false = false
        expect(numberFilterFn(7, filter)).toBe(true)
      })
    })

    describe('is not between operator', () => {
      it('should return false when value is within the range (inclusive)', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is not between',
          values: [0, 2.5],
        }

        // Test boundary values
        expect(numberFilterFn(0, filter)).toBe(false) // Lower bound
        expect(numberFilterFn(2.5, filter)).toBe(false) // Upper bound

        // Test values within range
        expect(numberFilterFn(0.5, filter)).toBe(false)
        expect(numberFilterFn(1.0, filter)).toBe(false)
        expect(numberFilterFn(2.0, filter)).toBe(false)
      })

      it('should return true when value is outside the range', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is not between',
          values: [0, 2.5],
        }

        // Test values below range
        expect(numberFilterFn(-0.01, filter)).toBe(true)
        expect(numberFilterFn(-10, filter)).toBe(true)

        // Test values above range
        expect(numberFilterFn(2.5001, filter)).toBe(true)
        expect(numberFilterFn(10, filter)).toBe(true)
      })

      it('should return true when bounds are undefined', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is not between',
          values: [undefined as any, undefined as any],
        }

        expect(numberFilterFn(5, filter)).toBe(true)
        expect(numberFilterFn(-10, filter)).toBe(true)
        expect(numberFilterFn(100, filter)).toBe(true)
      })
    })

    describe('edge cases and error conditions', () => {
      it('should return true when filter is null/undefined', () => {
        expect(numberFilterFn(5, null as any)).toBe(true)
        expect(numberFilterFn(5, undefined as any)).toBe(true)
      })

      it('should return true when filter values array is empty', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is',
          values: [],
        }

        expect(numberFilterFn(5, filter)).toBe(true)
      })

      it('should return true when filter values property is undefined', () => {
        const filter = {
          columnId: 'test',
          type: 'number' as const,
          operator: 'is' as const,
          values: undefined as any,
        }

        expect(numberFilterFn(5, filter)).toBe(true)
      })

      it('should return true when first filter value is undefined', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is',
          values: [undefined as any],
        }

        expect(numberFilterFn(5, filter)).toBe(true)
      })

      it('should handle zero values correctly', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is',
          values: [0],
        }

        expect(numberFilterFn(0, filter)).toBe(true)
        expect(numberFilterFn(-0, filter)).toBe(true) // -0 === 0 in JavaScript
      })

      it('should handle NaN values', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is',
          values: [Number.NaN],
        }

        expect(numberFilterFn(Number.NaN, filter)).toBe(true)
      })

      it('should handle Infinity values', () => {
        const filter: FilterModel<'number'> = {
          columnId: 'test',
          type: 'number',
          operator: 'is',
          values: [Number.POSITIVE_INFINITY],
        }

        expect(numberFilterFn(Number.POSITIVE_INFINITY, filter)).toBe(true)
        expect(numberFilterFn(Number.NEGATIVE_INFINITY, filter)).toBe(false)
        expect(numberFilterFn(1000000, filter)).toBe(false)
      })
    })

    it('specific failing cases from Fused', () => {
      const filter: FilterModel<'number'> = {
        columnId: 'test',
        type: 'number',
        operator: 'is between',
        values: [0, 2.5],
      }

      // These are the exact values from the user's logs that were incorrectly returning true
      expect(numberFilterFn(4.4, filter)).toBe(false) // Should be false, was true
      expect(numberFilterFn(0.57, filter)).toBe(true) // Should be true
      expect(numberFilterFn(0.39, filter)).toBe(true) // Should be true
      expect(numberFilterFn(1.7, filter)).toBe(true) // Should be true
      expect(numberFilterFn(1.5, filter)).toBe(true) // Should be true
      expect(numberFilterFn(0.8, filter)).toBe(true) // Should be true
      expect(numberFilterFn(1.19, filter)).toBe(true) // Should be true
      expect(numberFilterFn(2.15, filter)).toBe(true) // Should be true
      expect(numberFilterFn(0.78, filter)).toBe(true) // Should be true
      expect(numberFilterFn(1.3, filter)).toBe(true) // Should be true
      expect(numberFilterFn(1.48, filter)).toBe(true) // Should be true
      expect(numberFilterFn(1.4, filter)).toBe(true) // Should be true
      expect(numberFilterFn(1.27, filter)).toBe(true) // Should be true
      expect(numberFilterFn(1.18, filter)).toBe(true) // Should be true
      expect(numberFilterFn(1.88999999, filter)).toBe(true) // Should be true
      expect(numberFilterFn(-0.58, filter)).toBe(false) // Should be false, was true
      expect(numberFilterFn(1.9, filter)).toBe(true) // Should be true
      expect(numberFilterFn(0.32, filter)).toBe(true) // Should be true
      expect(numberFilterFn(1.07, filter)).toBe(true) // Should be true
      expect(numberFilterFn(2.33, filter)).toBe(true) // Should be true
      expect(numberFilterFn(0.05, filter)).toBe(true) // Should be true
      expect(numberFilterFn(1.8, filter)).toBe(true) // Should be true
      expect(numberFilterFn(1.6, filter)).toBe(true) // Should be true
      expect(numberFilterFn(4.6, filter)).toBe(false) // Should be false, was true
      expect(numberFilterFn(-0.61, filter)).toBe(false) // Should be false, was true
      expect(numberFilterFn(2.1, filter)).toBe(true) // Should be true
      expect(numberFilterFn(0.7, filter)).toBe(true) // Should be true
      expect(numberFilterFn(2.94, filter)).toBe(false) // Should be false, was true
      expect(numberFilterFn(1, filter)).toBe(true) // Should be true
      expect(numberFilterFn(0.63, filter)).toBe(true) // Should be true
      expect(numberFilterFn(0.84, filter)).toBe(true) // Should be true
      expect(numberFilterFn(-0.65, filter)).toBe(false) // Should be false, was true
    })
  }),
    describe('lib/filter-fns bigint support', () => {
      describe('getValidBigInt', () => {
        it('should return bigint for valid bigint values', () => {
          expect(getValidBigInt(123n)).toBe(123n)
          expect(getValidBigInt(-456n)).toBe(-456n)
          expect(getValidBigInt(0n)).toBe(0n)
        })

        it('should convert numbers to bigint', () => {
          expect(getValidBigInt(123)).toBe(123n)
          expect(getValidBigInt(-456)).toBe(-456n)
          expect(getValidBigInt(0)).toBe(0n)
        })

        it('should convert string numbers to bigint', () => {
          expect(getValidBigInt('123')).toBe(123n)
          expect(getValidBigInt('-456')).toBe(-456n)
          expect(getValidBigInt('0')).toBe(0n)
          expect(getValidBigInt('9007199254740992')).toBe(9007199254740992n)
        })

        it('should return undefined for invalid values', () => {
          expect(getValidBigInt(null)).toBeUndefined()
          expect(getValidBigInt(undefined)).toBeUndefined()
          expect(getValidBigInt('not a number')).toBeUndefined()
          expect(getValidBigInt('123.45')).toBeUndefined()
          expect(getValidBigInt({})).toBeUndefined()
          expect(getValidBigInt([])).toBeUndefined()
          expect(getValidBigInt(Number.NaN)).toBeUndefined()
        })

        it('should handle very large string numbers', () => {
          const largeNumber = '12345678901234567890123456789'
          expect(getValidBigInt(largeNumber)).toBe(BigInt(largeNumber))
        })
      })

      describe('bigintFilterFn', () => {
        describe('is operator', () => {
          it('should return true when value equals filter value', () => {
            const filter: FilterModel<'bigint'> = {
              columnId: 'test',
              type: 'bigint',
              operator: 'is',
              values: [123n],
            }
            expect(bigIntFilterFn(123n, filter)).toBe(true)
            expect(bigIntFilterFn(0n, filter)).toBe(false)
          })

          it('should handle very large values', () => {
            const largeValue = BigInt('9007199254740992123456789')
            const filter: FilterModel<'bigint'> = {
              columnId: 'test',
              type: 'bigint',
              operator: 'is',
              values: [largeValue],
            }
            expect(bigIntFilterFn(largeValue, filter)).toBe(true)
            expect(bigIntFilterFn(largeValue + 1n, filter)).toBe(false)
          })
        })

        describe('is not operator', () => {
          it('should return false when value equals filter value', () => {
            const filter: FilterModel<'bigint'> = {
              columnId: 'test',
              type: 'bigint',
              operator: 'is not',
              values: [123n],
            }
            expect(bigIntFilterFn(123n, filter)).toBe(false)
            expect(bigIntFilterFn(124n, filter)).toBe(true)
          })
        })

        describe('is greater than operator', () => {
          it('should return true when value is greater than filter value', () => {
            const filter: FilterModel<'bigint'> = {
              columnId: 'test',
              type: 'bigint',
              operator: 'is greater than',
              values: [100n],
            }
            expect(bigIntFilterFn(101n, filter)).toBe(true)
            expect(bigIntFilterFn(100n, filter)).toBe(false)
            expect(bigIntFilterFn(99n, filter)).toBe(false)
          })

          it('should handle very large values', () => {
            const baseValue = BigInt(Number.MAX_SAFE_INTEGER) * 2n
            const filter: FilterModel<'bigint'> = {
              columnId: 'test',
              type: 'bigint',
              operator: 'is greater than',
              values: [baseValue],
            }
            expect(bigIntFilterFn(baseValue + 1n, filter)).toBe(true)
            expect(bigIntFilterFn(baseValue, filter)).toBe(false)
          })

          it('should handle negative values', () => {
            const filter: FilterModel<'bigint'> = {
              columnId: 'test',
              type: 'bigint',
              operator: 'is greater than',
              values: [-100n],
            }
            expect(bigIntFilterFn(-99n, filter)).toBe(true)
            expect(bigIntFilterFn(-100n, filter)).toBe(false)
            expect(bigIntFilterFn(-101n, filter)).toBe(false)
          })
        })

        describe('is between operator', () => {
          it('should return true when value is within range', () => {
            const filter: FilterModel<'bigint'> = {
              columnId: 'test',
              type: 'bigint',
              operator: 'is between',
              values: [10n, 20n],
            }
            expect(bigIntFilterFn(10n, filter)).toBe(true) // Lower bound
            expect(bigIntFilterFn(15n, filter)).toBe(true) // Middle
            expect(bigIntFilterFn(20n, filter)).toBe(true) // Upper bound
            expect(bigIntFilterFn(9n, filter)).toBe(false) // Below
            expect(bigIntFilterFn(21n, filter)).toBe(false) // Above
          })

          it('should handle reversed bounds', () => {
            const filter: FilterModel<'bigint'> = {
              columnId: 'test',
              type: 'bigint',
              operator: 'is between',
              values: [20n, 10n], // Reversed
            }
            expect(bigIntFilterFn(15n, filter)).toBe(true)
            expect(bigIntFilterFn(9n, filter)).toBe(false)
            expect(bigIntFilterFn(21n, filter)).toBe(false)
          })

          it('should handle very large ranges', () => {
            const min = BigInt('-99999999999999999999')
            const max = BigInt('99999999999999999999')
            const filter: FilterModel<'bigint'> = {
              columnId: 'test',
              type: 'bigint',
              operator: 'is between',
              values: [min, max],
            }
            expect(bigIntFilterFn(0n, filter)).toBe(true)
            expect(bigIntFilterFn(min, filter)).toBe(true)
            expect(bigIntFilterFn(max, filter)).toBe(true)
            expect(bigIntFilterFn(min - 1n, filter)).toBe(false)
            expect(bigIntFilterFn(max + 1n, filter)).toBe(false)
          })

          it('should handle negative ranges', () => {
            const filter: FilterModel<'bigint'> = {
              columnId: 'test',
              type: 'bigint',
              operator: 'is between',
              values: [-20n, -10n],
            }
            expect(bigIntFilterFn(-15n, filter)).toBe(true)
            expect(bigIntFilterFn(-20n, filter)).toBe(true)
            expect(bigIntFilterFn(-10n, filter)).toBe(true)
            expect(bigIntFilterFn(-21n, filter)).toBe(false)
            expect(bigIntFilterFn(-9n, filter)).toBe(false)
          })
        })

        describe('edge cases', () => {
          it('should return true when filter is null/undefined', () => {
            expect(bigIntFilterFn(123n, null as any)).toBe(true)
            expect(bigIntFilterFn(123n, undefined as any)).toBe(true)
          })

          it('should return true when filter values array is empty', () => {
            const filter: FilterModel<'bigint'> = {
              columnId: 'test',
              type: 'bigint',
              operator: 'is',
              values: [],
            }
            expect(bigIntFilterFn(123n, filter)).toBe(true)
          })

          it('should return true when filter values property is undefined', () => {
            const filter = {
              columnId: 'test',
              type: 'bigint' as const,
              operator: 'is' as const,
              values: undefined as any,
            }
            expect(bigIntFilterFn(123n, filter)).toBe(true)
          })

          it('should return false when input data is not bigint', () => {
            const filter: FilterModel<'bigint'> = {
              columnId: 'test',
              type: 'bigint',
              operator: 'is',
              values: [123n],
            }
            expect(bigIntFilterFn('not a bigint' as any, filter)).toBe(false)
            expect(bigIntFilterFn(123 as any, filter)).toBe(false)
            expect(bigIntFilterFn(null as any, filter)).toBe(false)
          })

          it('should handle zero values correctly', () => {
            const filter: FilterModel<'bigint'> = {
              columnId: 'test',
              type: 'bigint',
              operator: 'is',
              values: [0n],
            }
            expect(bigIntFilterFn(0n, filter)).toBe(true)
            expect(bigIntFilterFn(-0n, filter)).toBe(true) // -0n === 0n
          })
        })

        describe('all operators comprehensive test', () => {
          const testValue = 100n
          const largerValue = 200n
          const smallerValue = 50n

          // Fix: Use values that properly test the range operations
          const rangeMin = 75n // Between smallerValue and testValue
          const rangeMax = 150n // Between testValue and largerValue

          const operators = [
            'is',
            'is not',
            'is greater than',
            'is greater than or equal to',
            'is less than',
            'is less than or equal to',
            'is between',
            'is not between',
          ] as const

          operators.forEach((operator) => {
            it(`should handle ${operator} operator correctly`, () => {
              let filter: FilterModel<'bigint'>
              let expectedResults: boolean[]

              switch (operator) {
                case 'is':
                  filter = {
                    columnId: 'test',
                    type: 'bigint',
                    operator,
                    values: [testValue],
                  }
                  expectedResults = [true, false, false]
                  break
                case 'is not':
                  filter = {
                    columnId: 'test',
                    type: 'bigint',
                    operator,
                    values: [testValue],
                  }
                  expectedResults = [false, true, true]
                  break
                case 'is greater than':
                  filter = {
                    columnId: 'test',
                    type: 'bigint',
                    operator,
                    values: [testValue],
                  }
                  expectedResults = [false, true, false]
                  break
                case 'is greater than or equal to':
                  filter = {
                    columnId: 'test',
                    type: 'bigint',
                    operator,
                    values: [testValue],
                  }
                  expectedResults = [true, true, false]
                  break
                case 'is less than':
                  filter = {
                    columnId: 'test',
                    type: 'bigint',
                    operator,
                    values: [testValue],
                  }
                  expectedResults = [false, false, true]
                  break
                case 'is less than or equal to':
                  filter = {
                    columnId: 'test',
                    type: 'bigint',
                    operator,
                    values: [testValue],
                  }
                  expectedResults = [true, false, true]
                  break
                case 'is between':
                  // Range [75n, 150n] - testValue (100n) is inside, others are outside
                  filter = {
                    columnId: 'test',
                    type: 'bigint',
                    operator,
                    values: [rangeMin, rangeMax],
                  }
                  expectedResults = [true, false, false] // 100n is in range, 200n and 50n are out
                  break
                case 'is not between':
                  // Range [75n, 150n] - testValue (100n) is inside, others are outside
                  filter = {
                    columnId: 'test',
                    type: 'bigint',
                    operator,
                    values: [rangeMin, rangeMax],
                  }
                  expectedResults = [false, true, true] // 100n is in range (so false), 200n and 50n are out (so true)
                  break
                default:
                  throw new Error(`Unhandled operator: ${operator}`)
              }

              const testValues = [testValue, largerValue, smallerValue]
              testValues.forEach((value, index) => {
                expect(bigIntFilterFn(value, filter)).toBe(
                  expectedResults[index],
                )
              })
            })
          })
        })
      })
    })
})
