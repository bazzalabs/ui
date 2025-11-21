import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createColumnConfigHelper } from '../core/columns/index.js'
import { DEFAULT_OPERATORS, determineNewOperator } from '../core/operators.js'
import type { FiltersState } from '../core/types.js'
import { useDataTableFilters } from '../hooks/use-data-table-filters.js'

// Dummy icon component for column configuration
const DummyIcon = <div />

// Define a dummy data type used for testing.
type TestData = {
  name: string
  status: string
}

// Sample data and column configurations.
const data: TestData[] = [
  { name: 'John', status: 'active' },
  { name: 'Jane', status: 'inactive' },
]

const helper = createColumnConfigHelper<TestData>()

const optionColumn = helper
  .option()
  .accessor((row) => row.status)
  .id('status')
  .displayName('Status')
  .icon(DummyIcon)
  .build()
const textColumn = helper
  .text()
  .accessor((row) => row.name)
  .id('name')
  .displayName('Name')
  .icon(DummyIcon)
  .build()

const columnsConfig = [optionColumn, textColumn] as const

// For option columns, supply static options that the hook uses.
const options = {
  status: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ],
}

describe('useDataTableFilters', () => {
  it('should add an option filter value via addFilterValue', () => {
    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
        options,
      }),
    )

    // Initially, no filters exist.
    expect(result.current.filters).toHaveLength(0)

    // Add a filter value for the option column.
    act(() => {
      result.current.actions.addFilterValue(optionColumn as any, ['active'])
    })

    expect(result.current.filters).toHaveLength(1)
    const filter = result.current.filters[0]
    expect(filter?.columnId).toBe('status')
    // For an option column with a single value, the default operator is expected to be "single".
    expect(filter?.values).toEqual(['active'])
    expect(filter?.operator).toBe(DEFAULT_OPERATORS.option.single)
  })

  it('should update an existing option filter when adding new values', () => {
    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
        options,
      }),
    )

    // Start by adding a single filter value.
    act(() => {
      result.current.actions.addFilterValue(optionColumn as any, ['active'])
    })
    // Adding the same value again should not result in duplicates.
    act(() => {
      result.current.actions.addFilterValue(optionColumn as any, ['active'])
    })
    expect(result.current.filters).toHaveLength(1)
    expect(result.current.filters[0]?.values).toEqual(['active'])

    // Add a different value.
    act(() => {
      result.current.actions.addFilterValue(optionColumn as any, ['inactive'])
    })
    expect(result.current.filters).toHaveLength(1)
    expect(result.current.filters[0]?.values).toEqual(['active', 'inactive'])
    // Multiple selected values should cause the operator to switch to "multiple".
    expect(result.current.filters[0]?.operator).toBe(
      DEFAULT_OPERATORS.option.multiple,
    )
  })

  it('should remove an option filter value using removeFilterValue', () => {
    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
        options,
      }),
    )

    // Add two filter values.
    act(() => {
      result.current.actions.addFilterValue(optionColumn as any, [
        'active',
        'inactive',
      ])
    })
    expect(result.current.filters[0]?.values).toEqual(['active', 'inactive'])

    // Remove one value.
    act(() => {
      result.current.actions.removeFilterValue(optionColumn as any, ['active'])
    })
    expect(result.current.filters[0]?.values).toEqual(['inactive'])

    // Remove the last value; the filter should then be removed.
    act(() => {
      result.current.actions.removeFilterValue(optionColumn as any, [
        'inactive',
      ])
    })
    expect(result.current.filters).toHaveLength(0)
  })

  it('should set a text filter value using setFilterValue', () => {
    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
      }),
    )

    // Set a filter for the text column.
    act(() => {
      result.current.actions.setFilterValue(textColumn as any, ['John'])
    })
    expect(result.current.filters).toHaveLength(1)
    const textFilter = result.current.filters.find((f) => f.columnId === 'name')
    expect(textFilter).toBeDefined()
    expect(textFilter!.values).toEqual(['John'])
    // The default operator for text columns should be "contains" (as defined in DEFAULT_OPERATORS).
    expect(textFilter!.operator).toBe(DEFAULT_OPERATORS.text.single)
  })

  it('should update the filter operator using setFilterOperator', () => {
    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
      }),
    )

    // First, set a filter for the text column.
    act(() => {
      result.current.actions.setFilterValue(textColumn as any, ['Jane'])
    })
    let filter = result.current.filters.find((f) => f.columnId === 'name')
    expect(filter).toBeDefined()
    expect(filter!.operator).toBe(DEFAULT_OPERATORS.text.single)

    // Update the operator explicitly.
    act(() => {
      result.current.actions.setFilterOperator('name', 'does not contain')
    })
    filter = result.current.filters.find((f) => f.columnId === 'name')
    expect(filter).toBeDefined()
    expect(filter!.operator).toBe('does not contain')
  })

  it('should remove a filter using removeFilter', () => {
    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
        options,
      }),
    )

    // Add filters for both the option and text columns.
    act(() => {
      result.current.actions.addFilterValue(optionColumn as any, ['active'])
      result.current.actions.setFilterValue(textColumn as any, ['John'])
    })

    expect(result.current.filters).toHaveLength(2)

    // Remove the text filter.
    act(() => {
      result.current.actions.removeFilter('name')
    })
    expect(result.current.filters).toHaveLength(1)
    expect(result.current.filters[0]?.columnId).toBe('status')
  })

  it('should remove all filters using removeAllFilters', () => {
    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
        options,
      }),
    )

    // Add multiple filters.
    act(() => {
      result.current.actions.addFilterValue(optionColumn as any, ['active'])
      result.current.actions.setFilterValue(textColumn as any, ['Jane'])
    })
    expect(result.current.filters).toHaveLength(2)

    // Remove all filters.
    act(() => {
      result.current.actions.removeAllFilters()
    })
    expect(result.current.filters).toHaveLength(0)
  })

  it('should use the default filters state if provided', () => {
    const defaultFilters = [
      {
        columnId: 'status',
        type: 'option',
        operator: 'is',
        values: ['active'],
      },
      {
        columnId: 'name',
        type: 'text',
        operator: 'contains',
        values: ['John'],
      },
    ]

    const { result } = renderHook(() =>
      useDataTableFilters({
        strategy: 'client',
        data,
        columnsConfig,
        options,
        defaultFilters,
      }),
    )

    expect(result.current.filters).toHaveLength(2)
    expect(result.current.filters[0]).toEqual(defaultFilters[0])
    expect(result.current.filters[1]).toEqual(defaultFilters[1])
  })

  describe('controlled state', () => {
    const defaultFilters = [
      {
        columnId: 'status',
        type: 'option',
        operator: 'is',
        values: ['active'],
      },
    ]

    it('should throw an error if only one of filters or onFiltersChange is provided', () => {
      const { result: externalResult } = renderHook(() =>
        useState<FiltersState>(defaultFilters),
      )

      expect(() =>
        renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: externalResult.current[0],
          }),
        ),
      ).toThrowError()

      expect(() =>
        renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            onFiltersChange: externalResult.current[1],
          }),
        ),
      ).toThrowError()

      expect(() =>
        renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: externalResult.current[0],
            onFiltersChange: externalResult.current[1],
          }),
        ),
      ).not.toThrowError()
    })

    it('should use the default value provided by the external state', () => {
      const { result } = renderHook(() => {
        const [filters, setFilters] = useState<FiltersState>(defaultFilters)
        return {
          filtersState: filters,
          ...useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters,
            onFiltersChange: setFilters,
          }),
        }
      })
      expect(result.current.filters).toHaveLength(1)
      expect(result.current.filters).toEqual(defaultFilters)
    })

    it('should update the external state when filters change', () => {
      const { result } = renderHook(() => {
        const [filters, setFilters] = useState<FiltersState>(defaultFilters)
        return {
          filtersState: filters,
          ...useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters,
            onFiltersChange: setFilters,
          }),
        }
      })

      act(() => {
        result.current.actions.addFilterValue(optionColumn as any, ['inactive'])
      })

      expect(result.current.filters).toHaveLength(1)
      expect(result.current.filters[0]?.values).toEqual(['active', 'inactive'])

      expect(result.current.filtersState).toHaveLength(1)
      expect(result.current.filtersState[0]?.values).toEqual([
        'active',
        'inactive',
      ])
    })
  })

  describe('onFiltersChange handler variants', () => {
    describe('React Dispatch style handler (single parameter)', () => {
      it('should call handler with only nextFilters when using React Dispatch signature', () => {
        const mockSetFilters = vi.fn()

        const { result } = renderHook(() => {
          const [filters, setFilters] = useState<FiltersState>([])
          return {
            filtersState: filters,
            setFilters,
            ...useDataTableFilters({
              strategy: 'client',
              data,
              columnsConfig,
              options,
              filters,
              onFiltersChange: mockSetFilters, // React Dispatch style: 1 parameter
            }),
          }
        })

        // Add a filter to trigger the handler
        act(() => {
          result.current.actions.addFilterValue(optionColumn as any, ['active'])
        })

        // Verify the handler was called with only nextFilters
        expect(mockSetFilters).toHaveBeenCalledTimes(1)
        expect(mockSetFilters).toHaveBeenCalledWith([
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ])

        // Verify it was NOT called with 2 parameters
        expect(mockSetFilters.mock.calls[0]).toHaveLength(1)
      })

      it('should work correctly with actual React setState', () => {
        const { result } = renderHook(() => {
          const [filters, setFilters] = useState<FiltersState>([])
          return {
            internalFilters: filters,
            ...useDataTableFilters({
              strategy: 'client',
              data,
              columnsConfig,
              options,
              filters,
              onFiltersChange: setFilters, // Direct React setState
            }),
          }
        })

        // Add a filter
        act(() => {
          result.current.actions.addFilterValue(optionColumn as any, ['active'])
        })

        // Verify state was updated correctly
        expect(result.current.internalFilters).toEqual([
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ])
      })

      it('should handle function updates correctly with React Dispatch', () => {
        const mockSetFilters = vi.fn()

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [
              {
                columnId: 'status',
                type: 'option',
                operator: 'is',
                values: ['active'],
              },
            ],
            onFiltersChange: mockSetFilters,
          }),
        )

        // Add another filter value (this uses a function update internally)
        act(() => {
          result.current.actions.addFilterValue(optionColumn as any, [
            'inactive',
          ])
        })

        // Verify the handler received the resolved next state
        expect(mockSetFilters).toHaveBeenCalledWith([
          {
            columnId: 'status',
            type: 'option',
            operator: 'is any of', // Should switch to multiple operator
            values: ['active', 'inactive'],
          },
        ])
      })
    })

    describe('Custom handler style (prev and next parameters)', () => {
      it('should call handler with both prevFilters and nextFilters when using custom signature', () => {
        const mockHandler = vi.fn(
          (_prev: FiltersState, _next: FiltersState, _context?: any) => {},
        )
        const initialFilters: FiltersState = [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ]

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: initialFilters,
            onFiltersChange: mockHandler, // Custom style: 3 parameters
          }),
        )

        // Add another filter value
        act(() => {
          result.current.actions.addFilterValue(optionColumn as any, [
            'inactive',
          ])
        })

        // Verify the handler was called with both prev and next
        expect(mockHandler).toHaveBeenCalledTimes(1)
        expect(mockHandler).toHaveBeenCalledWith(
          // prevFilters
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is',
              values: ['active'],
            },
          ],
          // nextFilters
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is any of',
              values: ['active', 'inactive'],
            },
          ],
          // context
          undefined,
        )

        // Verify it was called with exactly 2 parameters
        expect(mockHandler.mock.calls[0]).toHaveLength(3)
      })

      it('should provide correct prev and next values when removing filters', () => {
        const mockHandler = vi.fn(
          (_prev: FiltersState, _next: FiltersState, _context?: any) => {},
        )
        const initialFilters: FiltersState = [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is any of',
            values: ['active', 'inactive'],
          },
        ]

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: initialFilters,
            onFiltersChange: mockHandler,
          }),
        )

        // Remove a filter value
        act(() => {
          result.current.actions.removeFilterValue(optionColumn as any, [
            'inactive',
          ])
        })

        expect(mockHandler).toHaveBeenCalledWith(
          // prevFilters - had both values
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is any of',
              values: ['active', 'inactive'],
            },
          ],
          // nextFilters - only has 'active' and operator switched back to singular
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is',
              values: ['active'],
            },
          ],
          undefined,
        )
      })

      it('should provide correct prev and next values when completely removing a filter', () => {
        const mockHandler = vi.fn(
          (_prev: FiltersState, _next: FiltersState, _context: any) => {},
        )
        const initialFilters: FiltersState = [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
          {
            columnId: 'name',
            type: 'text',
            operator: 'contains',
            values: ['John'],
          },
        ]

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: initialFilters,
            onFiltersChange: mockHandler,
          }),
        )

        // Remove entire filter
        act(() => {
          result.current.actions.removeFilter('status')
        })

        expect(mockHandler).toHaveBeenCalledWith(
          // prevFilters - had 2 filters
          initialFilters,
          // nextFilters - only has 1 filter
          [
            {
              columnId: 'name',
              type: 'text',
              operator: 'contains',
              values: ['John'],
            },
          ],
          undefined,
        )
      })

      it('should work with mixed usage patterns in a real scenario', () => {
        const changes: Array<{ prev: FiltersState; next: FiltersState }> = []

        const { result } = renderHook(() => {
          const [filters, setFilters] = useState<FiltersState>([])
          return {
            externalFilters: filters,
            ...useDataTableFilters({
              strategy: 'client',
              data,
              columnsConfig,
              options,
              filters,
              onFiltersChange: (prev, next) => {
                changes.push({ prev, next })
                setFilters(next)
              },
            }),
          }
        })

        // Sequence of operations
        act(() => {
          // Add initial filter
          result.current.actions.addFilterValue(optionColumn as any, ['active'])
        })

        act(() => {
          // Add text filter
          result.current.actions.setFilterValue(textColumn as any, ['John'])
        })

        act(() => {
          // Remove all filters
          result.current.actions.removeAllFilters()
        })

        // Verify all changes were tracked correctly
        expect(changes).toHaveLength(3)

        // First change: empty to single filter
        expect(changes[0]).toEqual({
          prev: [],
          next: [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is',
              values: ['active'],
            },
          ],
        })

        // Second change: one filter to two filters
        expect(changes[1]?.prev).toHaveLength(1)
        expect(changes[1]?.next).toHaveLength(2)

        // Third change: two filters to empty
        expect(changes[2]?.prev).toHaveLength(2)
        expect(changes[2]?.next).toEqual([])
      })
    })

    describe('Handler detection and edge cases', () => {
      it('should correctly detect React Dispatch vs custom handler based on function.length', () => {
        // Test that our detection logic works
        const reactDispatchHandler = (_filters: FiltersState) => {} // length = 1
        const customHandler = (
          _prev: FiltersState,
          _next: FiltersState,
          _context?: any,
        ) => {} // length = 3

        expect(reactDispatchHandler.length).toBe(1)
        expect(customHandler.length).toBe(3)
      })

      it('should handle edge case with 0-parameter function as React Dispatch', () => {
        const mockHandler = vi.fn()
        // Create a function with 0 parameters (should be treated as React Dispatch)
        const zeroParamHandler = () => mockHandler()

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [],
            onFiltersChange: zeroParamHandler,
          }),
        )

        act(() => {
          result.current.actions.addFilterValue(optionColumn as any, ['active'])
        })

        // Should be called once (as React Dispatch style)
        expect(mockHandler).toHaveBeenCalledTimes(1)
      })

      it('should handle functions with 4+ parameters as custom handlers', () => {
        const mockHandler = vi.fn()
        // Create a function with 4 parameters (should be treated as custom)
        const threeParamHandler = (
          prev: FiltersState,
          next: FiltersState,
          context: any,
          extra: any,
        ) => mockHandler(prev, next, context, extra)

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [],
            // @ts-expect-error
            onFiltersChange: threeParamHandler,
          }),
        )

        act(() => {
          result.current.actions.addFilterValue(optionColumn as any, ['active'])
        })

        // Should be called with prev and next (custom style)
        expect(mockHandler).toHaveBeenCalledWith(
          [], // prev
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is',
              values: ['active'],
            },
          ], // next
          undefined, // context
          undefined, // extra parameter gets undefined
        )
      })

      it('should properly handle function updates with custom handlers', () => {
        const mockHandler = vi.fn(
          (_prev: FiltersState, _next: FiltersState, _context: any) => {},
        )
        const initialFilters: FiltersState = [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ]

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: initialFilters,
            onFiltersChange: mockHandler,
          }),
        )

        // This internally uses a function update: setFilters(prev => ...)
        act(() => {
          result.current.actions.setFilterOperator('status', 'is not')
        })

        expect(mockHandler).toHaveBeenCalledWith(
          initialFilters, // prev
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is not',
              values: ['active'],
            },
          ], // next
          undefined, // context
        )
      })
    })

    describe('Type safety and integration', () => {
      it('should work seamlessly with useState when using React Dispatch style', () => {
        const { result } = renderHook(() => {
          const [filters, setFilters] = useState<FiltersState>([])

          // This should compile without TypeScript errors
          const hook = useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters,
            onFiltersChange: setFilters, // Direct React setter
          })

          return { filters, hook }
        })

        act(() => {
          result.current.hook.actions.addFilterValue(optionColumn as any, [
            'active',
          ])
        })

        expect(result.current.filters).toEqual([
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ])
      })

      it('should allow custom logic with prev/next handler style', () => {
        const analyticsEvents: Array<{
          type: string
          prev: number
          next: number
        }> = []

        const { result } = renderHook(() => {
          const [filters, setFilters] = useState<FiltersState>([])

          return useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters,
            onFiltersChange: (prev, next) => {
              // Custom analytics logic
              analyticsEvents.push({
                type:
                  next.length > prev.length
                    ? 'filter_added'
                    : next.length < prev.length
                      ? 'filter_removed'
                      : 'filter_modified',
                prev: prev.length,
                next: next.length,
              })

              // Still update the state
              setFilters(next)
            },
          })
        })

        // Add filter
        act(() => {
          result.current.actions.addFilterValue(optionColumn as any, ['active'])
        })

        // Add another filter type
        act(() => {
          result.current.actions.setFilterValue(textColumn as any, ['John'])
        })

        // Remove one filter
        act(() => {
          result.current.actions.removeFilter('status')
        })

        expect(analyticsEvents).toEqual([
          { type: 'filter_added', prev: 0, next: 1 },
          { type: 'filter_added', prev: 1, next: 2 },
          { type: 'filter_removed', prev: 2, next: 1 },
        ])
      })
    })
  })

  describe('Batch actions', () => {
    it('should execute multiple filter operations atomically', () => {
      const { result } = renderHook(() =>
        useDataTableFilters({
          strategy: 'client',
          data,
          columnsConfig,
          options,
        }),
      )

      // Initially, no filters exist
      expect(result.current.filters).toHaveLength(0)

      // Use batch to add multiple filters at once
      act(() => {
        result.current.actions.batch((batch) => {
          batch.addFilterValue(optionColumn as any, ['active'])
          batch.setFilterValue(textColumn as any, ['John'])
        })
      })

      // Both filters should be added in a single state update
      expect(result.current.filters).toHaveLength(2)
      expect(result.current.filters[0]?.columnId).toBe('status')
      expect(result.current.filters[0]?.values).toEqual(['active'])
      expect(result.current.filters[1]?.columnId).toBe('name')
      expect(result.current.filters[1]?.values).toEqual(['John'])
    })

    it('should work with controlled state and onFiltersChange', () => {
      const mockHandler = vi.fn()
      const { result } = renderHook(() => {
        const [filters, setFilters] = useState<FiltersState>([])
        return {
          externalFilters: filters,
          ...useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters,
            onFiltersChange: (prev, next) => {
              mockHandler(prev, next)
              setFilters(next)
            },
          }),
        }
      })

      act(() => {
        result.current.actions.batch((batch) => {
          batch.addFilterValue(optionColumn as any, ['active'])
          batch.setFilterValue(textColumn as any, ['Jane'])
          batch.setFilterOperator('status', 'is not')
        })
      })

      // Should trigger onFiltersChange only once with the final result
      expect(mockHandler).toHaveBeenCalledTimes(1)
      expect(mockHandler).toHaveBeenCalledWith(
        [], // prev (empty)
        [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is not', // Updated by setFilterOperator
            values: ['active'],
          },
          {
            columnId: 'name',
            type: 'text',
            operator: 'contains',
            values: ['Jane'],
          },
        ], // next (final state)
      )
    })

    it('should handle complex batch operations with operator transitions', () => {
      const { result } = renderHook(() =>
        useDataTableFilters({
          strategy: 'client',
          data,
          columnsConfig,
          options,
        }),
      )

      act(() => {
        result.current.actions.batch((batch) => {
          // Add single value (should use 'is' operator)
          batch.addFilterValue(optionColumn as any, ['active'])
          // Add another value (should transition to 'is any of')
          batch.addFilterValue(optionColumn as any, ['inactive'])
          // Add a third filter type
          batch.setFilterValue(textColumn as any, ['test'])
        })
      })

      expect(result.current.filters).toHaveLength(2)

      const statusFilter = result.current.filters.find(
        (f) => f.columnId === 'status',
      )
      expect(statusFilter?.operator).toBe('is any of') // Should transition to multiple
      expect(statusFilter?.values).toEqual(['active', 'inactive'])

      const nameFilter = result.current.filters.find(
        (f) => f.columnId === 'name',
      )
      expect(nameFilter?.operator).toBe('contains')
      expect(nameFilter?.values).toEqual(['test'])
    })

    it('should handle removal operations in batch', () => {
      const initialFilters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is any of',
          values: ['active', 'inactive'],
        },
        {
          columnId: 'name',
          type: 'text',
          operator: 'contains',
          values: ['John'],
        },
      ]

      const { result } = renderHook(() =>
        useDataTableFilters({
          strategy: 'client',
          data,
          columnsConfig,
          options,
          defaultFilters: initialFilters,
        }),
      )

      act(() => {
        result.current.actions.batch((batch) => {
          // Remove one value from multi-select (should transition operator)
          batch.removeFilterValue(optionColumn as any, ['inactive'])
          // Remove entire text filter
          batch.removeFilter('name')
        })
      })

      expect(result.current.filters).toHaveLength(1)

      const remainingFilter = result.current.filters[0]
      expect(remainingFilter?.columnId).toBe('status')
      expect(remainingFilter?.operator).toBe('is') // Should transition back to single
      expect(remainingFilter?.values).toEqual(['active'])
    })

    it('should handle mixed add/remove operations correctly', () => {
      const { result } = renderHook(() =>
        useDataTableFilters({
          strategy: 'client',
          data,
          columnsConfig,
          options,
          defaultFilters: [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is',
              values: ['active'],
            },
          ],
        }),
      )

      act(() => {
        result.current.actions.batch((batch) => {
          // Remove existing filter
          batch.removeFilter('status')
          // Add new filter for different column
          batch.setFilterValue(textColumn as any, ['batch-test'])
          // Add back option filter with different value
          batch.addFilterValue(optionColumn as any, ['inactive'])
        })
      })

      expect(result.current.filters).toHaveLength(2)

      const statusFilter = result.current.filters.find(
        (f) => f.columnId === 'status',
      )
      expect(statusFilter?.values).toEqual(['inactive'])

      const nameFilter = result.current.filters.find(
        (f) => f.columnId === 'name',
      )
      expect(nameFilter?.values).toEqual(['batch-test'])
    })

    it('should handle removeAllFilters in batch with subsequent operations', () => {
      const initialFilters: FiltersState = [
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['active'],
        },
        {
          columnId: 'name',
          type: 'text',
          operator: 'contains',
          values: ['John'],
        },
      ]

      const { result } = renderHook(() =>
        useDataTableFilters({
          strategy: 'client',
          data,
          columnsConfig,
          options,
          defaultFilters: initialFilters,
        }),
      )

      act(() => {
        result.current.actions.batch((batch) => {
          // Clear all existing filters
          batch.removeAllFilters()
          // Add new filters
          batch.addFilterValue(optionColumn as any, ['inactive'])
          batch.setFilterValue(textColumn as any, ['Jane'])
        })
      })

      expect(result.current.filters).toHaveLength(2)

      const statusFilter = result.current.filters.find(
        (f) => f.columnId === 'status',
      )
      expect(statusFilter?.values).toEqual(['inactive'])

      const nameFilter = result.current.filters.find(
        (f) => f.columnId === 'name',
      )
      expect(nameFilter?.values).toEqual(['Jane'])
    })

    it('should maintain transaction isolation (changes only apply after batch completes)', () => {
      const mockHandler = vi.fn(
        (_prev: FiltersState, _next: FiltersState, _context: any) => {},
      )
      const { result } = renderHook(() => {
        const [filters] = useState<FiltersState>([])
        return {
          externalFilters: filters,
          ...useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters,
            onFiltersChange: mockHandler,
          }),
        }
      })

      act(() => {
        result.current.actions.batch((batch) => {
          // These operations should not trigger individual state updates
          batch.addFilterValue(optionColumn as any, ['active'])
          batch.setFilterValue(textColumn as any, ['John'])
          batch.addFilterValue(optionColumn as any, ['inactive']) // Should transition operator
        })
      })

      // Handler should be called only once with the final state
      expect(mockHandler).toHaveBeenCalledTimes(1)
      expect(mockHandler).toHaveBeenCalledWith(
        [], // prev (empty)
        [
          {
            columnId: 'status',
            type: 'option',
            operator: 'is any of', // Final operator after all operations
            values: ['active', 'inactive'], // Final values after all operations
          },
          {
            columnId: 'name',
            type: 'text',
            operator: 'contains',
            values: ['John'],
          },
        ], // next (final state)
        undefined, // context
      )
    })

    it('should work with React Dispatch style handlers', () => {
      const mockSetFilters = vi.fn()
      const { result } = renderHook(() =>
        useDataTableFilters({
          strategy: 'client',
          data,
          columnsConfig,
          options,
          filters: [],
          onFiltersChange: mockSetFilters, // React Dispatch style (1 parameter)
        }),
      )

      act(() => {
        result.current.actions.batch((batch) => {
          batch.addFilterValue(optionColumn as any, ['active'])
          batch.setFilterValue(textColumn as any, ['test'])
        })
      })

      // Should be called once with just the final state
      expect(mockSetFilters).toHaveBeenCalledTimes(1)
      expect(mockSetFilters).toHaveBeenCalledWith([
        {
          columnId: 'status',
          type: 'option',
          operator: 'is',
          values: ['active'],
        },
        {
          columnId: 'name',
          type: 'text',
          operator: 'contains',
          values: ['test'],
        },
      ])

      // Verify it was called with exactly 1 parameter
      expect(mockSetFilters.mock.calls[0]).toHaveLength(1)
    })

    it('should handle empty batch operations', () => {
      const { result } = renderHook(() =>
        useDataTableFilters({
          strategy: 'client',
          data,
          columnsConfig,
          options,
          defaultFilters: [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is',
              values: ['active'],
            },
          ],
        }),
      )

      const initialLength = result.current.filters.length

      act(() => {
        result.current.actions.batch(() => {
          // Do nothing in the batch
        })
      })

      // State should remain unchanged
      expect(result.current.filters).toHaveLength(initialLength)
      expect(result.current.filters[0]?.values).toEqual(['active'])
    })

    it('should handle operations that cancel each other out', () => {
      const { result } = renderHook(() =>
        useDataTableFilters({
          strategy: 'client',
          data,
          columnsConfig,
          options,
        }),
      )

      act(() => {
        result.current.actions.batch((batch) => {
          // Add a filter
          batch.addFilterValue(optionColumn as any, ['active'])
          // Then immediately remove it
          batch.removeFilterValue(optionColumn as any, ['active'])
          // Add a different filter
          batch.setFilterValue(textColumn as any, ['test'])
          // Then remove that too
          batch.removeFilter('name')
        })
      })

      // Final state should be empty since operations cancelled out
      expect(result.current.filters).toHaveLength(0)
    })

    it('should work with complex state transitions', () => {
      const { result } = renderHook(() =>
        useDataTableFilters({
          strategy: 'client',
          data,
          columnsConfig,
          options,
          defaultFilters: [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is any of',
              values: ['active', 'inactive'],
            },
          ],
        }),
      )

      act(() => {
        result.current.actions.batch((batch) => {
          // Remove one value (should transition from 'is any of' to 'is')
          batch.removeFilterValue(optionColumn as any, ['inactive'])
          // Change operator
          batch.setFilterOperator('status', 'is not')
          // Add a completely different filter
          batch.setFilterValue(textColumn as any, ['complex-test'])
        })
      })

      expect(result.current.filters).toHaveLength(2)

      const statusFilter = result.current.filters.find(
        (f) => f.columnId === 'status',
      )
      expect(statusFilter?.operator).toBe('is not') // Final operator
      expect(statusFilter?.values).toEqual(['active']) // After removal

      const nameFilter = result.current.filters.find(
        (f) => f.columnId === 'name',
      )
      expect(nameFilter?.operator).toBe('contains')
      expect(nameFilter?.values).toEqual(['complex-test'])
    })

    it('should maintain proper transaction semantics with controlled state', () => {
      const stateChanges: FiltersState[] = []
      const { result } = renderHook(() => {
        const [filters, setFilters] = useState<FiltersState>([])

        return {
          externalFilters: filters,
          ...useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters,
            onFiltersChange: (_prev, next) => {
              stateChanges.push(next)
              setFilters(next)
            },
          }),
        }
      })

      // Perform individual operations (should create multiple state changes)
      act(() => {
        result.current.actions.addFilterValue(optionColumn as any, ['active'])
      })

      act(() => {
        result.current.actions.setFilterValue(textColumn as any, ['individual'])
      })

      // Reset for batch test
      act(() => {
        result.current.actions.removeAllFilters()
      })

      const individualOperationsCount = stateChanges.length

      // Now do the same operations in a batch (should create only one state change)
      act(() => {
        result.current.actions.batch((batch) => {
          batch.addFilterValue(optionColumn as any, ['active'])
          batch.setFilterValue(textColumn as any, ['batched'])
        })
      })

      // Should have added only 1 more state change (the batch result)
      expect(stateChanges).toHaveLength(individualOperationsCount + 1)

      // Final state should have both filters
      const finalState = stateChanges[stateChanges.length - 1]
      expect(finalState).toHaveLength(2)
      expect(finalState?.find((f) => f.columnId === 'status')?.values).toEqual([
        'active',
      ])
      expect(finalState?.find((f) => f.columnId === 'name')?.values).toEqual([
        'batched',
      ])
    })

    it('should handle batch operations with React Dispatch style handler', () => {
      const mockSetFilters = vi.fn()
      const { result } = renderHook(() => {
        const [filters] = useState<FiltersState>([])

        return useDataTableFilters({
          strategy: 'client',
          data,
          columnsConfig,
          options,
          filters,
          onFiltersChange: mockSetFilters, // Single parameter React Dispatch style
        })
      })

      act(() => {
        result.current.actions.batch((batch) => {
          batch.addFilterValue(optionColumn as any, ['active', 'inactive'])
          batch.setFilterValue(textColumn as any, ['dispatch-test'])
        })
      })

      // Should be called once with the final state
      expect(mockSetFilters).toHaveBeenCalledTimes(1)
      expect(mockSetFilters).toHaveBeenCalledWith([
        {
          columnId: 'status',
          type: 'option',
          operator: 'is any of', // Multiple values
          values: ['active', 'inactive'],
        },
        {
          columnId: 'name',
          type: 'text',
          operator: 'contains',
          values: ['dispatch-test'],
        },
      ])

      // Verify single parameter call
      expect(mockSetFilters.mock.calls[0]).toHaveLength(1)
    })

    it('should handle batch operations that result in no filters', () => {
      const { result } = renderHook(() =>
        useDataTableFilters({
          strategy: 'client',
          data,
          columnsConfig,
          options,
          defaultFilters: [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is',
              values: ['active'],
            },
          ],
        }),
      )

      act(() => {
        result.current.actions.batch((batch) => {
          batch.removeAllFilters()
          // Add and then immediately remove
          batch.addFilterValue(optionColumn as any, ['inactive'])
          batch.removeFilterValue(optionColumn as any, ['inactive'])
        })
      })

      expect(result.current.filters).toHaveLength(0)
    })

    it('should support nested batch-like patterns (batch within transaction)', () => {
      const { result } = renderHook(() =>
        useDataTableFilters({
          strategy: 'client',
          data,
          columnsConfig,
          options,
        }),
      )

      act(() => {
        result.current.actions.batch((batch) => {
          // Simulate complex business logic that might group operations
          const statusOperations = () => {
            batch.addFilterValue(optionColumn as any, ['active'])
            batch.addFilterValue(optionColumn as any, ['inactive'])
          }

          const textOperations = () => {
            batch.setFilterValue(textColumn as any, ['nested'])
          }

          // Execute grouped operations
          statusOperations()
          textOperations()
        })
      })

      expect(result.current.filters).toHaveLength(2)
      expect(
        result.current.filters.find((f) => f.columnId === 'status')?.values,
      ).toEqual(['active', 'inactive'])
      expect(
        result.current.filters.find((f) => f.columnId === 'name')?.values,
      ).toEqual(['nested'])
    })

    it('should preserve all filter properties during batch operations', () => {
      const { result } = renderHook(() =>
        useDataTableFilters({
          strategy: 'client',
          data,
          columnsConfig,
          options,
        }),
      )

      act(() => {
        result.current.actions.batch((batch) => {
          batch.setFilterValue(optionColumn as any, ['active', 'inactive'])
          batch.setFilterValue(textColumn as any, ['properties-test'])
        })
      })

      const statusFilter = result.current.filters.find(
        (f) => f.columnId === 'status',
      )
      const nameFilter = result.current.filters.find(
        (f) => f.columnId === 'name',
      )

      // Verify all properties are correctly set
      expect(statusFilter).toEqual({
        columnId: 'status',
        type: 'option',
        operator: 'is any of',
        values: ['active', 'inactive'],
      })

      expect(nameFilter).toEqual({
        columnId: 'name',
        type: 'text',
        operator: 'contains',
        values: ['properties-test'],
      })
    })
  })

  describe('Actions context', () => {
    // Test data setup
    type TestContext = {
      userId: string
      action: string
      timestamp: Date
      metadata?: Record<string, any>
    }

    const createTestContext = (
      action: string,
      metadata?: Record<string, any>,
    ): TestContext => ({
      userId: 'test-user-123',
      action,
      timestamp: new Date(),
      metadata,
    })

    describe('Individual Action Context Passing', () => {
      it('should pass context through addFilterValue with custom handler', () => {
        const mockHandler = vi.fn(
          (
            _prev: FiltersState,
            _next: FiltersState,
            _context?: TestContext,
          ) => {},
        )
        const testContext = createTestContext('add_filter_value', {
          column: 'status',
        })

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [],
            onFiltersChange: mockHandler,
          }),
        )

        act(() => {
          result.current.actions.addFilterValue(
            optionColumn as any,
            ['active'],
            testContext,
          )
        })

        expect(mockHandler).toHaveBeenCalledWith(
          [], // prev
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is',
              values: ['active'],
            },
          ], // next
          testContext, // context
        )
      })

      it('should pass context through removeFilterValue', () => {
        const mockHandler = vi.fn(
          (
            _prev: FiltersState,
            _next: FiltersState,
            _context?: TestContext,
          ) => {},
        )
        const testContext = createTestContext('remove_filter_value')

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [
              {
                columnId: 'status',
                type: 'option',
                operator: 'is any of',
                values: ['active', 'inactive'],
              },
            ],
            onFiltersChange: mockHandler,
          }),
        )

        act(() => {
          result.current.actions.removeFilterValue(
            optionColumn as any,
            ['inactive'],
            testContext,
          )
        })

        expect(mockHandler).toHaveBeenCalledWith(
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is any of',
              values: ['active', 'inactive'],
            },
          ], // prev
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is',
              values: ['active'],
            },
          ], // next
          testContext, // context
        )
      })

      it('should pass context through setFilterValue', () => {
        const mockHandler = vi.fn(
          (
            _prev: FiltersState,
            _next: FiltersState,
            _context?: TestContext,
          ) => {},
        )
        const testContext = createTestContext('set_filter_value', {
          filterType: 'text',
        })

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            filters: [],
            onFiltersChange: mockHandler,
          }),
        )

        act(() => {
          result.current.actions.setFilterValue(
            textColumn as any,
            ['John'],
            testContext,
          )
        })

        expect(mockHandler).toHaveBeenCalledWith(
          [], // prev
          [
            {
              columnId: 'name',
              type: 'text',
              operator: 'contains',
              values: ['John'],
            },
          ], // next
          testContext, // context
        )
      })

      it('should pass context through setFilterOperator', () => {
        const mockHandler = vi.fn(
          (
            _prev: FiltersState,
            _next: FiltersState,
            _context?: TestContext,
          ) => {},
        )
        const testContext = createTestContext('set_filter_operator')

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            filters: [
              {
                columnId: 'name',
                type: 'text',
                operator: 'contains',
                values: ['John'],
              },
            ],
            onFiltersChange: mockHandler,
          }),
        )

        act(() => {
          result.current.actions.setFilterOperator(
            'name',
            'does not contain',
            testContext,
          )
        })

        expect(mockHandler).toHaveBeenCalledWith(
          [
            {
              columnId: 'name',
              type: 'text',
              operator: 'contains',
              values: ['John'],
            },
          ], // prev
          [
            {
              columnId: 'name',
              type: 'text',
              operator: 'does not contain',
              values: ['John'],
            },
          ], // next
          testContext, // context
        )
      })

      it('should pass context through removeFilter', () => {
        const mockHandler = vi.fn(
          (
            _prev: FiltersState,
            _next: FiltersState,
            _context?: TestContext,
          ) => {},
        )
        const testContext = createTestContext('remove_filter', {
          columnId: 'status',
        })

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [
              {
                columnId: 'status',
                type: 'option',
                operator: 'is',
                values: ['active'],
              },
              {
                columnId: 'name',
                type: 'text',
                operator: 'contains',
                values: ['John'],
              },
            ],
            onFiltersChange: mockHandler,
          }),
        )

        act(() => {
          result.current.actions.removeFilter('status', testContext)
        })

        expect(mockHandler).toHaveBeenCalledWith(
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is',
              values: ['active'],
            },
            {
              columnId: 'name',
              type: 'text',
              operator: 'contains',
              values: ['John'],
            },
          ], // prev
          [
            {
              columnId: 'name',
              type: 'text',
              operator: 'contains',
              values: ['John'],
            },
          ], // next
          testContext, // context
        )
      })

      it('should pass context through removeAllFilters', () => {
        const mockHandler = vi.fn(
          (
            _prev: FiltersState,
            _next: FiltersState,
            _context?: TestContext,
          ) => {},
        )
        const testContext = createTestContext('remove_all_filters')

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [
              {
                columnId: 'status',
                type: 'option',
                operator: 'is',
                values: ['active'],
              },
            ],
            onFiltersChange: mockHandler,
          }),
        )

        act(() => {
          result.current.actions.removeAllFilters(testContext)
        })

        expect(mockHandler).toHaveBeenCalledWith(
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is',
              values: ['active'],
            },
          ], // prev
          [], // next
          testContext, // context
        )
      })
    })

    describe('Batch Action Context Passing', () => {
      it('should pass context through batch operations', () => {
        const mockHandler = vi.fn(
          (
            _prev: FiltersState,
            _next: FiltersState,
            _context?: TestContext,
          ) => {},
        )
        const testContext = createTestContext('batch_operation', {
          operations: ['add_filter', 'set_filter', 'set_operator'],
          batchSize: 3,
        })

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [],
            onFiltersChange: mockHandler,
          }),
        )

        act(() => {
          result.current.actions.batch((batch) => {
            batch.addFilterValue(optionColumn as any, ['active'])
            batch.setFilterValue(textColumn as any, ['John'])
            batch.setFilterOperator('status', 'is not')
          }, testContext)
        })

        // Batch operations should trigger handler only once with the final context
        expect(mockHandler).toHaveBeenCalledTimes(1)
        expect(mockHandler).toHaveBeenCalledWith(
          [], // prev
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is not', // Changed by setFilterOperator
              values: ['active'],
            },
            {
              columnId: 'name',
              type: 'text',
              operator: 'contains',
              values: ['John'],
            },
          ], // next
          testContext, // context
        )
      })

      it('should handle complex batch operations with context', () => {
        const mockHandler = vi.fn(
          (
            _prev: FiltersState,
            _next: FiltersState,
            _context?: TestContext,
          ) => {},
        )
        const testContext = createTestContext('complex_batch', {
          description: 'Reset and rebuild filters',
          operations: ['remove_all', 'add_new_filters'],
        })

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [
              {
                columnId: 'status',
                type: 'option',
                operator: 'is',
                values: ['inactive'],
              },
            ],
            onFiltersChange: mockHandler,
          }),
        )

        act(() => {
          result.current.actions.batch((batch) => {
            // Clear all existing filters
            batch.removeAllFilters()
            // Add new filters
            batch.addFilterValue(optionColumn as any, ['active', 'pending'])
            batch.setFilterValue(textColumn as any, ['batch-test'])
          }, testContext)
        })

        expect(mockHandler).toHaveBeenCalledTimes(1)
        expect(mockHandler).toHaveBeenCalledWith(
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is',
              values: ['inactive'],
            },
          ], // prev
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is any of', // Multiple values
              values: ['active', 'pending'],
            },
            {
              columnId: 'name',
              type: 'text',
              operator: 'contains',
              values: ['batch-test'],
            },
          ], // next
          testContext, // context
        )
      })
    })

    describe('Context with Different Handler Types', () => {
      it('should not pass context to React Dispatch style handlers', () => {
        const mockSetFilters = vi.fn()
        const testContext = createTestContext('dispatch_style')

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [],
            onFiltersChange: mockSetFilters, // React Dispatch style (1 parameter)
          }),
        )

        act(() => {
          result.current.actions.addFilterValue(
            optionColumn as any,
            ['active'],
            testContext,
          )
        })

        // React Dispatch style should only receive the new filters state
        expect(mockSetFilters).toHaveBeenCalledTimes(1)
        expect(mockSetFilters).toHaveBeenCalledWith([
          {
            columnId: 'status',
            type: 'option',
            operator: 'is',
            values: ['active'],
          },
        ])

        // Verify it was called with exactly 1 parameter (no context)
        expect(mockSetFilters.mock.calls[0]).toHaveLength(1)
      })

      it('should pass context to custom handlers even with React setState', () => {
        const receivedContexts: (TestContext | undefined)[] = []
        const { result } = renderHook(() => {
          const [filters, setFilters] = useState<FiltersState>([])

          return {
            externalFilters: filters,
            ...useDataTableFilters({
              strategy: 'client',
              data,
              columnsConfig,
              options,
              filters,
              onFiltersChange: (_prev, next, context?: TestContext) => {
                receivedContexts.push(context)
                setFilters(next)
              },
            }),
          }
        })

        const testContext1 = createTestContext('first_action')
        const testContext2 = createTestContext('second_action')

        act(() => {
          result.current.actions.addFilterValue(
            optionColumn as any,
            ['active'],
            testContext1,
          )
        })

        act(() => {
          result.current.actions.setFilterValue(
            textColumn as any,
            ['test'],
            testContext2,
          )
        })

        expect(receivedContexts).toHaveLength(2)
        expect(receivedContexts[0]).toEqual(testContext1)
        expect(receivedContexts[1]).toEqual(testContext2)

        // Verify the state was updated correctly
        expect(result.current.externalFilters).toHaveLength(2)
      })
    })

    describe('Context Edge Cases and Validation', () => {
      it('should handle undefined context gracefully', () => {
        const mockHandler = vi.fn(
          (
            _prev: FiltersState,
            _next: FiltersState,
            _context?: TestContext,
          ) => {},
        )

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [],
            onFiltersChange: mockHandler,
          }),
        )

        act(() => {
          // Pass undefined context explicitly
          result.current.actions.addFilterValue(
            optionColumn as any,
            ['active'],
            undefined,
          )
        })

        expect(mockHandler).toHaveBeenCalledWith(
          [], // prev
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is',
              values: ['active'],
            },
          ], // next
          undefined, // context
        )
      })

      it('should handle no context parameter (implicit undefined)', () => {
        const mockHandler = vi.fn(
          (
            _prev: FiltersState,
            _next: FiltersState,
            _context?: TestContext,
          ) => {},
        )

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [],
            onFiltersChange: mockHandler,
          }),
        )

        act(() => {
          // Don't pass context parameter at all
          result.current.actions.addFilterValue(optionColumn as any, ['active'])
        })

        expect(mockHandler).toHaveBeenCalledWith(
          [], // prev
          [
            {
              columnId: 'status',
              type: 'option',
              operator: 'is',
              values: ['active'],
            },
          ], // next
          undefined, // context (implicit)
        )
      })

      it('should handle different context types', () => {
        type StringContext = string
        type NumberContext = number
        type ObjectContext = { message: string; priority: number }

        const mockHandler = vi.fn(
          (_prev: FiltersState, _next: FiltersState, _context?: any) => {},
        )

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [],
            onFiltersChange: mockHandler,
          }),
        )

        // Test string context
        act(() => {
          result.current.actions.addFilterValue(
            optionColumn as any,
            ['active'],
            'string-context' as StringContext,
          )
        })

        // Test number context
        act(() => {
          result.current.actions.setFilterValue(
            textColumn as any,
            ['test'],
            42 as NumberContext,
          )
        })

        // Test object context
        act(() => {
          result.current.actions.removeFilter('name', {
            message: 'Removing text filter',
            priority: 1,
          } as ObjectContext)
        })

        expect(mockHandler).toHaveBeenCalledTimes(3)
        // @ts-expect-error
        expect(mockHandler.mock.calls[0][2]).toBe('string-context')
        // @ts-expect-error
        expect(mockHandler.mock.calls[1][2]).toBe(42)
        // @ts-expect-error
        expect(mockHandler.mock.calls[2][2]).toEqual({
          message: 'Removing text filter',
          priority: 1,
        })
      })

      it('should allow mutation context', () => {
        const mockHandler = vi.fn(
          (_prev: FiltersState, _next: FiltersState, context?: TestContext) => {
            // Try to mutate the context (should not affect original)
            if (context) {
              context.userId = 'mutated-id'
              context.metadata = { mutated: true }
            }
          },
        )

        const originalContext = createTestContext('immutability_test', {
          nested: { value: 'unchanged' },
        })

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [],
            onFiltersChange: mockHandler,
          }),
        )

        act(() => {
          result.current.actions.addFilterValue(
            optionColumn as any,
            ['active'],
            originalContext,
          )
        })

        // Verify the original context object was not mutated by the handler
        expect(originalContext.userId).toBe('mutated-id')
        expect(originalContext.metadata?.mutated).toBe(true)
      })
    })

    describe('Real-world Context Usage Scenarios', () => {
      it('should support audit logging context', () => {
        const auditLogs: Array<{
          action: string
          userId: string
          timestamp: Date
          filterState: { before: number; after: number }
          metadata?: any
        }> = []

        const { result } = renderHook(() => {
          const [filters, setFilters] = useState<FiltersState>([])

          return {
            currentFilters: filters,
            ...useDataTableFilters({
              strategy: 'client',
              data,
              columnsConfig,
              options,
              filters,
              onFiltersChange: (prev, next, context?: TestContext) => {
                // Audit logging logic
                if (context) {
                  auditLogs.push({
                    action: context.action,
                    userId: context.userId,
                    timestamp: context.timestamp,
                    filterState: {
                      before: prev.length,
                      after: next.length,
                    },
                    metadata: context.metadata,
                  })
                }
                setFilters(next)
              },
            }),
          }
        })

        // Simulate user interactions with audit context
        act(() => {
          result.current.actions.addFilterValue(
            optionColumn as any,
            ['active'],
            createTestContext('add_status_filter', {
              ui_component: 'status_dropdown',
              user_action: 'click',
            }),
          )
        })

        act(() => {
          result.current.actions.setFilterValue(
            textColumn as any,
            ['John'],
            createTestContext('search_names', {
              ui_component: 'search_input',
              user_action: 'type',
              search_term: 'John',
            }),
          )
        })

        act(() => {
          result.current.actions.removeAllFilters(
            createTestContext('clear_all_filters', {
              ui_component: 'clear_button',
              user_action: 'click',
              reason: 'reset_search',
            }),
          )
        })

        expect(auditLogs).toHaveLength(3)

        expect(auditLogs[0]).toMatchObject({
          action: 'add_status_filter',
          userId: 'test-user-123',
          filterState: { before: 0, after: 1 },
          metadata: {
            ui_component: 'status_dropdown',
            user_action: 'click',
          },
        })

        expect(auditLogs[1]).toMatchObject({
          action: 'search_names',
          filterState: { before: 1, after: 2 },
          metadata: {
            search_term: 'John',
          },
        })

        expect(auditLogs[2]).toMatchObject({
          action: 'clear_all_filters',
          filterState: { before: 2, after: 0 },
          metadata: {
            reason: 'reset_search',
          },
        })
      })

      it('should support undo/redo context', () => {
        type UndoContext = {
          operation: 'undo' | 'redo'
          operationId: string
        }

        const operationHistory: Array<{
          id: string
          type: string
          context?: UndoContext
          state: FiltersState
        }> = []

        const { result } = renderHook(() => {
          const [filters, setFilters] = useState<FiltersState>([])

          return useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters,
            onFiltersChange: (_prev, next, context?: UndoContext) => {
              operationHistory.push({
                id: `op-${Date.now()}-${Math.random()}`,
                type: context?.operation || 'normal',
                context,
                state: next,
              })
              setFilters(next)
            },
          })
        })

        // Normal operation
        act(() => {
          result.current.actions.addFilterValue(optionColumn as any, ['active'])
        })

        // Undo operation
        act(() => {
          result.current.actions.removeAllFilters({
            operation: 'undo',
            operationId: 'undo-001',
          })
        })

        // Redo operation
        act(() => {
          result.current.actions.addFilterValue(
            optionColumn as any,
            ['active'],
            {
              operation: 'redo',
              operationId: 'redo-001',
            },
          )
        })

        expect(operationHistory).toHaveLength(3)
        expect(operationHistory[0]?.type).toBe('normal')
        expect(operationHistory[1]?.type).toBe('undo')
        expect(operationHistory[1]?.context?.operationId).toBe('undo-001')
        expect(operationHistory[2]?.type).toBe('redo')
        expect(operationHistory[2]?.context?.operationId).toBe('redo-001')
      })

      it('should support analytics and feature flag context', () => {
        type AnalyticsContext = {
          event: string
          properties: Record<string, any>
          featureFlags: Record<string, boolean>
          experimentId?: string
        }

        const analyticsEvents: AnalyticsContext[] = []

        const { result } = renderHook(() => {
          const [filters, setFilters] = useState<FiltersState>([])

          return useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters,
            onFiltersChange: (_prev, next, context?: AnalyticsContext) => {
              if (context) {
                analyticsEvents.push(context)
              }
              setFilters(next)
            },
          })
        })

        act(() => {
          result.current.actions.batch(
            (batch) => {
              batch.addFilterValue(optionColumn as any, ['active', 'inactive'])
              batch.setFilterValue(textColumn as any, ['experiment'])
            },
            {
              event: 'filters_applied_batch',
              properties: {
                filter_count: 2,
                batch_size: 2,
                total_filter_values: 3,
              },
              featureFlags: {
                new_filter_ui: true,
                advanced_search: false,
              },
              experimentId: 'exp-batch-filters-v2',
            },
          )
        })

        expect(analyticsEvents).toHaveLength(1)
        expect(analyticsEvents[0]).toMatchObject({
          event: 'filters_applied_batch',
          properties: {
            filter_count: 2,
            batch_size: 2,
          },
          featureFlags: {
            new_filter_ui: true,
            advanced_search: false,
          },
          experimentId: 'exp-batch-filters-v2',
        })
      })
    })

    describe('Context Performance and Memory', () => {
      it('should not cause memory leaks with large context objects', () => {
        const mockHandler = vi.fn((_prev, _next, _context) => {})
        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [],
            onFiltersChange: mockHandler,
          }),
        )

        // Create a large context object
        const largeContext = {
          userId: 'test-user',
          action: 'performance_test',
          timestamp: new Date(),
          largeData: new Array(1000).fill(0).map((_, i) => ({
            id: i,
            value: `item-${i}`,
            metadata: { nested: { deep: { value: `nested-${i}` } } },
          })),
        }

        // Perform multiple operations with large context
        act(() => {
          for (let i = 0; i < 10; i++) {
            result.current.actions.addFilterValue(
              optionColumn as any,
              [`value-${i}`],
              { ...largeContext, iteration: i },
            )
          }
        })

        // Should handle large contexts without issues
        expect(mockHandler).toHaveBeenCalledTimes(10)
        // @ts-expect-error
        expect(mockHandler.mock.calls[9][2].iteration).toBe(9)
        // @ts-expect-error
        expect(mockHandler.mock.calls[9][2].largeData).toHaveLength(1000)
      })

      it('should handle rapid successive calls with different contexts', () => {
        const receivedContexts: any[] = []
        const { result } = renderHook(() => {
          const [filters, setFilters] = useState<FiltersState>([])

          return useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters,
            onFiltersChange: (_prev, next, context) => {
              receivedContexts.push(context)
              setFilters(next)
            },
          })
        })

        act(() => {
          // Rapid successive calls with different contexts
          Promise.all([
            result.current.actions.addFilterValue(optionColumn as any, ['a'], {
              id: 1,
            }),
            result.current.actions.addFilterValue(optionColumn as any, ['b'], {
              id: 2,
            }),
            result.current.actions.addFilterValue(optionColumn as any, ['c'], {
              id: 3,
            }),
          ])
        })

        // All contexts should be preserved correctly
        expect(receivedContexts).toHaveLength(3)
        expect(receivedContexts.map((c) => c.id)).toEqual([1, 2, 3])
      })
    })
  })
  describe('Faceted options', () => {
    // Test data for faceted options testing
    type FacetedTestData = {
      id: number
      status: string
      category: string[]
      age: number
      score: bigint
    }

    const facetedData: FacetedTestData[] = [
      {
        id: 1,
        status: 'active',
        category: ['electronics'],
        age: 25,
        score: 100n,
      },
      { id: 2, status: 'inactive', category: ['books'], age: 30, score: 200n },
      {
        id: 3,
        status: 'pending',
        category: ['electronics', 'books'],
        age: 35,
        score: 150n,
      },
    ]

    const facetedHelper = createColumnConfigHelper<FacetedTestData>()

    // Column configurations for faceted testing
    const statusColumn = facetedHelper
      .option()
      .accessor((row) => row.status)
      .id('status')
      .displayName('Status')
      .build()

    const categoryColumn = facetedHelper
      .multiOption()
      .accessor((row) => row.category)
      .id('category')
      .displayName('Category')
      .build()

    const ageColumn = facetedHelper
      .number()
      .accessor((row) => row.age)
      .id('age')
      .displayName('Age')
      .build()

    const scoreColumn = facetedHelper
      .bigint()
      .accessor((row) => row.score)
      .id('score')
      .displayName('Score')
      .build()

    const facetedColumnsConfig = [
      statusColumn,
      categoryColumn,
      ageColumn,
      scoreColumn,
    ] as const

    describe('option', () => {
      it('should inject valid faceted options into option column config', () => {
        const staticOptions = {
          status: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'pending', label: 'Pending' },
          ],
        }

        const faceted = {
          status: new Map([
            ['active', 5],
            ['inactive', 3],
            ['pending', 2],
          ]),
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [statusColumn],
            options: staticOptions,
            faceted,
          }),
        )

        const statusCol = result.current.columns.find((c) => c.id === 'status')
        expect(statusCol).toBeDefined()

        // Verify faceted options are accessible via getFacetedUniqueValues
        const facetedUniqueValues = statusCol?.getFacetedUniqueValues()
        expect(facetedUniqueValues).toBeInstanceOf(Map)
        expect(facetedUniqueValues?.get('active')).toBe(5)
        expect(facetedUniqueValues?.get('inactive')).toBe(3)
        expect(facetedUniqueValues?.get('pending')).toBe(2)
      })

      it('should populate counts in options from faceted data', () => {
        const staticOptions = {
          status: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'pending', label: 'Pending' },
          ],
        }

        const faceted = {
          status: new Map([
            ['active', 10],
            ['inactive', 7],
            ['pending', 4],
          ]),
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [statusColumn],
            options: staticOptions,
            faceted,
          }),
        )

        const statusCol = result.current.columns.find((c) => c.id === 'status')
        const optionsWithCounts = statusCol?.getOptions()

        expect(optionsWithCounts).toBeDefined()
        expect(
          optionsWithCounts?.find((o) => o.value === 'active')?.count,
        ).toBe(10)
        expect(
          optionsWithCounts?.find((o) => o.value === 'inactive')?.count,
        ).toBe(7)
        expect(
          optionsWithCounts?.find((o) => o.value === 'pending')?.count,
        ).toBe(4)
      })

      it('should use faceted options instead of computing from data in server strategy', () => {
        const staticOptions = {
          status: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
        }

        // Faceted data has different counts than what's in the actual data array
        const faceted = {
          status: new Map([
            ['active', 100], // Much higher than actual data
            ['inactive', 50],
          ]),
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server', // Server strategy should use faceted, not compute
            data: facetedData, // Only has 1 active, 1 inactive in actual data
            columnsConfig: [statusColumn],
            options: staticOptions,
            faceted,
          }),
        )

        const statusCol = result.current.columns.find((c) => c.id === 'status')
        const facetedUniqueValues = statusCol?.getFacetedUniqueValues()

        // Should return the injected faceted values, NOT computed from data
        expect(facetedUniqueValues?.get('active')).toBe(100)
        expect(facetedUniqueValues?.get('inactive')).toBe(50)

        // Verify options also use faceted counts
        const optionsWithCounts = statusCol?.getOptions()
        expect(
          optionsWithCounts?.find((o) => o.value === 'active')?.count,
        ).toBe(100)
        expect(
          optionsWithCounts?.find((o) => o.value === 'inactive')?.count,
        ).toBe(50)
      })

      it('should default to count 0 for options not in faceted data', () => {
        const staticOptions = {
          status: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'archived', label: 'Archived' }, // Not in faceted data
          ],
        }

        const faceted = {
          status: new Map([
            ['active', 5],
            ['inactive', 3],
            // 'archived' is missing
          ]),
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [statusColumn],
            options: staticOptions,
            faceted,
          }),
        )

        const statusCol = result.current.columns.find((c) => c.id === 'status')
        const optionsWithCounts = statusCol?.getOptions()

        expect(
          optionsWithCounts?.find((o) => o.value === 'archived')?.count,
        ).toBe(0)
      })

      it('should ignore invalid faceted options (not a Map)', () => {
        const staticOptions = {
          status: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
        }

        // Invalid: array instead of Map
        const invalidFaceted = {
          status: ['active', 'inactive'],
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [statusColumn],
            options: staticOptions,
            faceted: invalidFaceted as any,
          }),
        )

        const statusCol = result.current.columns.find((c) => c.id === 'status')

        // Check the column config directly - facetedOptions should not be set
        expect(statusCol?.facetedOptions).toBeUndefined()
      })

      it('should ignore faceted options with non-string keys', () => {
        const staticOptions = {
          status: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
        }

        // Invalid: Map with number keys
        const invalidFaceted = {
          status: new Map([
            [1, 5],
            [2, 3],
          ]),
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [statusColumn],
            options: staticOptions,
            faceted: invalidFaceted as any,
          }),
        )

        const statusCol = result.current.columns.find((c) => c.id === 'status')

        // Check the column config directly - facetedOptions should not be set
        expect(statusCol?.facetedOptions).toBeUndefined()
      })

      it('should ignore faceted options with non-number values', () => {
        const staticOptions = {
          status: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
        }

        // Invalid: Map with string values instead of numbers
        const invalidFaceted = {
          status: new Map([
            ['active', '5'],
            ['inactive', '3'],
          ]),
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [statusColumn],
            options: staticOptions,
            faceted: invalidFaceted as any,
          }),
        )

        const statusCol = result.current.columns.find((c) => c.id === 'status')

        // Check the column config directly - facetedOptions should not be set
        expect(statusCol?.facetedOptions).toBeUndefined()
      })
    })

    describe('multi-option', () => {
      it('should inject valid faceted options into multiOption column config', () => {
        const staticOptions = {
          category: [
            { value: 'electronics', label: 'Electronics' },
            { value: 'books', label: 'Books' },
            { value: 'clothing', label: 'Clothing' },
          ],
        }

        const faceted = {
          category: new Map([
            ['electronics', 8],
            ['books', 12],
            ['clothing', 5],
          ]),
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [categoryColumn],
            options: staticOptions,
            faceted,
          }),
        )

        const categoryCol = result.current.columns.find(
          (c) => c.id === 'category',
        )
        expect(categoryCol).toBeDefined()

        const facetedUniqueValues = categoryCol?.getFacetedUniqueValues()
        expect(facetedUniqueValues).toBeInstanceOf(Map)
        expect(facetedUniqueValues?.get('electronics')).toBe(8)
        expect(facetedUniqueValues?.get('books')).toBe(12)
        expect(facetedUniqueValues?.get('clothing')).toBe(5)
      })

      it('should populate counts in multiOption options from faceted data', () => {
        const staticOptions = {
          category: [
            { value: 'electronics', label: 'Electronics' },
            { value: 'books', label: 'Books' },
          ],
        }

        const faceted = {
          category: new Map([
            ['electronics', 15],
            ['books', 20],
          ]),
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [categoryColumn],
            options: staticOptions,
            faceted,
          }),
        )

        const categoryCol = result.current.columns.find(
          (c) => c.id === 'category',
        )
        const optionsWithCounts = categoryCol?.getOptions()

        expect(
          optionsWithCounts?.find((o) => o.value === 'electronics')?.count,
        ).toBe(15)
        expect(optionsWithCounts?.find((o) => o.value === 'books')?.count).toBe(
          20,
        )
      })

      it('should use faceted options instead of computing from data for multiOption', () => {
        const staticOptions = {
          category: [
            { value: 'electronics', label: 'Electronics' },
            { value: 'books', label: 'Books' },
          ],
        }

        // Faceted data with counts that don't match actual data
        const faceted = {
          category: new Map([
            ['electronics', 500], // Much higher than actual
            ['books', 300],
          ]),
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [categoryColumn],
            options: staticOptions,
            faceted,
          }),
        )

        const categoryCol = result.current.columns.find(
          (c) => c.id === 'category',
        )
        const facetedUniqueValues = categoryCol?.getFacetedUniqueValues()

        // Should use injected faceted values, not compute from data
        expect(facetedUniqueValues?.get('electronics')).toBe(500)
        expect(facetedUniqueValues?.get('books')).toBe(300)
      })

      it('should ignore invalid faceted options for multiOption columns', () => {
        const staticOptions = {
          category: [
            { value: 'electronics', label: 'Electronics' },
            { value: 'books', label: 'Books' },
          ],
        }

        // Invalid: object instead of Map
        const invalidFaceted = {
          category: { electronics: 5, books: 3 },
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [categoryColumn],
            options: staticOptions,
            faceted: invalidFaceted as any,
          }),
        )

        const categoryCol = result.current.columns.find(
          (c) => c.id === 'category',
        )

        // Check the column config directly - facetedOptions should not be set
        expect(categoryCol?.facetedOptions).toBeUndefined()
      })
    })

    describe('number', () => {
      it('should inject valid min/max tuple into number column config', () => {
        const faceted = {
          age: [18, 65] as [number, number],
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [ageColumn],
            faceted,
          }),
        )

        const ageCol = result.current.columns.find((c) => c.id === 'age')
        expect(ageCol).toBeDefined()

        const minMax = ageCol?.getFacetedMinMaxValues()
        expect(minMax).toEqual([18, 65])
      })

      it('should use faceted min/max instead of computing from data', () => {
        // Faceted min/max that doesn't match actual data
        const faceted = {
          age: [0, 100] as [number, number], // Wider range than actual data (25-35)
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData, // Actual ages: 25, 30, 35
            columnsConfig: [ageColumn],
            faceted,
          }),
        )

        const ageCol = result.current.columns.find((c) => c.id === 'age')
        const minMax = ageCol?.getFacetedMinMaxValues()

        // Should use injected values, not compute from data
        expect(minMax).toEqual([0, 100])
      })

      it('should ignore invalid min/max tuple (not an array)', () => {
        const invalidFaceted = {
          age: 50, // Invalid: number instead of tuple
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [ageColumn],
            faceted: invalidFaceted as any,
          }),
        )

        const ageCol = result.current.columns.find((c) => c.id === 'age')
        const minMax = ageCol?.getFacetedMinMaxValues()

        // Should return undefined when not properly injected
        expect(minMax).toBeUndefined()
      })

      it('should ignore invalid min/max tuple (wrong length)', () => {
        const invalidFaceted = {
          age: [18, 65, 100], // Invalid: 3 elements instead of 2
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [ageColumn],
            faceted: invalidFaceted as any,
          }),
        )

        const ageCol = result.current.columns.find((c) => c.id === 'age')
        const minMax = ageCol?.getFacetedMinMaxValues()

        expect(minMax).toBeUndefined()
      })

      it('should ignore invalid min/max tuple (wrong type - strings)', () => {
        const invalidFaceted = {
          age: ['18', '65'], // Invalid: strings instead of numbers
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [ageColumn],
            faceted: invalidFaceted as any,
          }),
        )

        const ageCol = result.current.columns.find((c) => c.id === 'age')
        const minMax = ageCol?.getFacetedMinMaxValues()

        expect(minMax).toBeUndefined()
      })

      it('should ignore invalid min/max tuple (bigint instead of number)', () => {
        const invalidFaceted = {
          age: [18n, 65n], // Invalid: bigint instead of number
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [ageColumn],
            faceted: invalidFaceted as any,
          }),
        )

        const ageCol = result.current.columns.find((c) => c.id === 'age')
        const minMax = ageCol?.getFacetedMinMaxValues()

        expect(minMax).toBeUndefined()
      })
    })

    describe('bigint', () => {
      it('should inject valid min/max tuple into bigint column config', () => {
        const faceted = {
          score: [0n, 1000n] as [bigint, bigint],
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [scoreColumn],
            faceted,
          }),
        )

        const scoreCol = result.current.columns.find((c) => c.id === 'score')
        expect(scoreCol).toBeDefined()

        const minMax = scoreCol?.getFacetedMinMaxValues()
        expect(minMax).toEqual([0n, 1000n])
      })

      it('should use faceted min/max instead of computing from data for bigint', () => {
        const faceted = {
          score: [50n, 500n] as [bigint, bigint], // Different from actual data (100n-200n)
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData, // Actual scores: 100n, 200n, 150n
            columnsConfig: [scoreColumn],
            faceted,
          }),
        )

        const scoreCol = result.current.columns.find((c) => c.id === 'score')
        const minMax = scoreCol?.getFacetedMinMaxValues()

        // Should use injected values
        expect(minMax).toEqual([50n, 500n])
      })

      it('should ignore invalid min/max tuple for bigint (not an array)', () => {
        const invalidFaceted = {
          score: 100n, // Invalid: single bigint instead of tuple
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [scoreColumn],
            faceted: invalidFaceted as any,
          }),
        )

        const scoreCol = result.current.columns.find((c) => c.id === 'score')
        const minMax = scoreCol?.getFacetedMinMaxValues()

        expect(minMax).toBeUndefined()
      })

      it('should ignore invalid min/max tuple for bigint (wrong type - numbers)', () => {
        const invalidFaceted = {
          score: [0, 1000], // Invalid: numbers instead of bigints
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [scoreColumn],
            faceted: invalidFaceted as any,
          }),
        )

        const scoreCol = result.current.columns.find((c) => c.id === 'score')
        const minMax = scoreCol?.getFacetedMinMaxValues()

        expect(minMax).toBeUndefined()
      })

      it('should ignore invalid min/max tuple for bigint (mixed types)', () => {
        const invalidFaceted = {
          score: [0n, 1000], // Invalid: mixed bigint and number
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [scoreColumn],
            faceted: invalidFaceted as any,
          }),
        )

        const scoreCol = result.current.columns.find((c) => c.id === 'score')
        const minMax = scoreCol?.getFacetedMinMaxValues()

        expect(minMax).toBeUndefined()
      })
    })

    describe('Kitchen sink (multiple columns with injected faceted options)', () => {
      it('should inject faceted options for all supported column types simultaneously', () => {
        const staticOptions = {
          status: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
          category: [
            { value: 'electronics', label: 'Electronics' },
            { value: 'books', label: 'Books' },
          ],
        }

        const faceted = {
          status: new Map([
            ['active', 10],
            ['inactive', 5],
          ]),
          category: new Map([
            ['electronics', 7],
            ['books', 8],
          ]),
          age: [20, 60] as [number, number],
          score: [100n, 500n] as [bigint, bigint],
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: facetedColumnsConfig,
            options: staticOptions,
            faceted,
          }),
        )

        // Verify option column
        const statusCol = result.current.columns.find((c) => c.id === 'status')
        expect(statusCol?.getFacetedUniqueValues()?.get('active')).toBe(10)

        // Verify multiOption column
        const categoryCol = result.current.columns.find(
          (c) => c.id === 'category',
        )
        expect(categoryCol?.getFacetedUniqueValues()?.get('electronics')).toBe(
          7,
        )

        // Verify number column
        const ageCol = result.current.columns.find((c) => c.id === 'age')
        expect(ageCol?.getFacetedMinMaxValues()).toEqual([20, 60])

        // Verify bigint column
        const scoreCol = result.current.columns.find((c) => c.id === 'score')
        expect(scoreCol?.getFacetedMinMaxValues()).toEqual([100n, 500n])
      })

      it('should handle partial faceted options (some columns have faceted data, others do not)', () => {
        const staticOptions = {
          status: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
          category: [{ value: 'electronics', label: 'Electronics' }],
        }

        // Only provide faceted data for some columns
        const faceted = {
          status: new Map([['active', 5]]),
          // category, age, and score are omitted
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: facetedColumnsConfig,
            options: staticOptions,
            faceted,
          }),
        )

        const statusCol = result.current.columns.find((c) => c.id === 'status')
        const categoryCol = result.current.columns.find(
          (c) => c.id === 'category',
        )
        const ageCol = result.current.columns.find((c) => c.id === 'age')

        // Status should have faceted data
        expect(statusCol?.getFacetedUniqueValues()?.get('active')).toBe(5)

        // Category should not have faceted data (check column config)
        expect(categoryCol?.facetedOptions).toBeUndefined()

        // Age should not have min/max
        expect(ageCol?.min).toBeUndefined()
        expect(ageCol?.max).toBeUndefined()
      })

      it('should handle mixed valid and invalid faceted options', () => {
        const staticOptions = {
          status: [{ value: 'active', label: 'Active' }],
          category: [{ value: 'electronics', label: 'Electronics' }],
        }

        const faceted = {
          status: new Map([['active', 5]]), // Valid
          category: ['electronics', 'books'], // Invalid: array instead of Map
          age: [20, 60] as [number, number], // Valid
          score: [100], // Invalid: wrong tuple length
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: facetedColumnsConfig,
            options: staticOptions,
            faceted: faceted as any,
          }),
        )

        // Valid ones should work
        const statusCol = result.current.columns.find((c) => c.id === 'status')
        expect(statusCol?.getFacetedUniqueValues()?.get('active')).toBe(5)

        const ageCol = result.current.columns.find((c) => c.id === 'age')
        expect(ageCol?.getFacetedMinMaxValues()).toEqual([20, 60])

        // Invalid ones should be undefined - check column config directly
        const categoryCol = result.current.columns.find(
          (c) => c.id === 'category',
        )
        expect(categoryCol?.facetedOptions).toBeUndefined()

        const scoreCol = result.current.columns.find((c) => c.id === 'score')
        expect(scoreCol?.min).toBeUndefined()
        expect(scoreCol?.max).toBeUndefined()
      })
    })

    describe('Client vs. server strategy behavior', () => {
      it('should use faceted options in server strategy', () => {
        const staticOptions = {
          status: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
        }

        const faceted = {
          status: new Map([
            ['active', 100],
            ['inactive', 50],
          ]),
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [statusColumn],
            options: staticOptions,
            faceted,
          }),
        )

        const statusCol = result.current.columns.find((c) => c.id === 'status')
        const facetedValues = statusCol?.getFacetedUniqueValues()

        // Server strategy should use faceted data
        expect(facetedValues?.get('active')).toBe(100)
        expect(facetedValues?.get('inactive')).toBe(50)
      })

      it('should compute from data in client strategy even when faceted is provided', () => {
        const staticOptions = {
          status: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'pending', label: 'Pending' },
          ],
        }

        // Provide faceted data with different counts
        const faceted = {
          status: new Map([
            ['active', 100],
            ['inactive', 50],
            ['pending', 25],
          ]),
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client', // Client strategy
            data: facetedData, // Has 1 active, 1 inactive, 1 pending
            columnsConfig: [statusColumn],
            options: staticOptions,
            faceted, // This should be ignored in client mode
          }),
        )

        const statusCol = result.current.columns.find((c) => c.id === 'status')
        const facetedValues = statusCol?.getFacetedUniqueValues()

        // Client strategy should compute from actual data, not use faceted
        expect(facetedValues?.get('active')).toBe(1)
        expect(facetedValues?.get('inactive')).toBe(1)
        expect(facetedValues?.get('pending')).toBe(1)
      })

      it('should return undefined for number min/max in server strategy without faceted data', () => {
        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [ageColumn],
            // No faceted parameter provided
          }),
        )

        const ageCol = result.current.columns.find((c) => c.id === 'age')
        const minMax = ageCol?.getFacetedMinMaxValues()

        // Server strategy without faceted data should return undefined
        expect(minMax).toBeUndefined()
      })

      it('should compute min/max from data in client strategy', () => {
        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data: facetedData, // Ages: 25, 30, 35
            columnsConfig: [ageColumn],
          }),
        )

        const ageCol = result.current.columns.find((c) => c.id === 'age')
        const minMax = ageCol?.getFacetedMinMaxValues()

        // Client strategy should compute from data
        expect(minMax).toEqual([25, 35])
      })
    })

    describe('Edge cases & integration', () => {
      it('should handle empty faceted Map', () => {
        const staticOptions = {
          status: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
        }

        const faceted = {
          status: new Map<string, number>(), // Empty Map
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [statusColumn],
            options: staticOptions,
            faceted,
          }),
        )

        const statusCol = result.current.columns.find((c) => c.id === 'status')
        const facetedValues = statusCol?.getFacetedUniqueValues()
        const options = statusCol?.getOptions()

        expect(facetedValues).toBeInstanceOf(Map)
        expect(facetedValues?.size).toBe(0)

        // Options should all have count 0
        expect(options?.every((o) => o.count === 0)).toBe(true)
      })

      it('should handle faceted data with zero counts', () => {
        const staticOptions = {
          status: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
        }

        const faceted = {
          status: new Map([
            ['active', 0],
            ['inactive', 0],
          ]),
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [statusColumn],
            options: staticOptions,
            faceted,
          }),
        )

        const statusCol = result.current.columns.find((c) => c.id === 'status')
        const options = statusCol?.getOptions()

        expect(options?.find((o) => o.value === 'active')?.count).toBe(0)
        expect(options?.find((o) => o.value === 'inactive')?.count).toBe(0)
      })

      it('should handle negative min/max values for number columns', () => {
        const faceted = {
          age: [-10, -5] as [number, number],
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [ageColumn],
            faceted,
          }),
        )

        const ageCol = result.current.columns.find((c) => c.id === 'age')
        const minMax = ageCol?.getFacetedMinMaxValues()

        expect(minMax).toEqual([-10, -5])
      })

      it('should handle same min and max values', () => {
        const faceted = {
          age: [30, 30] as [number, number],
        }

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'server',
            data: facetedData,
            columnsConfig: [ageColumn],
            faceted,
          }),
        )

        const ageCol = result.current.columns.find((c) => c.id === 'age')
        const minMax = ageCol?.getFacetedMinMaxValues()

        expect(minMax).toEqual([30, 30])
      })

      it('should work correctly when faceted options change dynamically', () => {
        const staticOptions = {
          status: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
        }

        const { result, rerender } = renderHook(
          ({ faceted }) =>
            useDataTableFilters({
              strategy: 'server',
              data: facetedData,
              columnsConfig: [statusColumn],
              options: staticOptions,
              faceted,
            }),
          {
            initialProps: {
              faceted: {
                status: new Map([
                  ['active', 10],
                  ['inactive', 5],
                ]),
              },
            },
          },
        )

        let statusCol = result.current.columns.find((c) => c.id === 'status')
        expect(statusCol?.getFacetedUniqueValues()?.get('active')).toBe(10)

        // Update faceted data
        rerender({
          faceted: {
            status: new Map([
              ['active', 20],
              ['inactive', 15],
            ]),
          },
        })

        statusCol = result.current.columns.find((c) => c.id === 'status')
        expect(statusCol?.getFacetedUniqueValues()?.get('active')).toBe(20)
        expect(statusCol?.getFacetedUniqueValues()?.get('inactive')).toBe(15)
      })
    })
  })
})

describe('determineNewOperator function', () => {
  it('should return the same operator when the number of values does not change', () => {
    const newOp = determineNewOperator('text', ['foo'], ['bar'], 'contains')
    expect(newOp).toBe('contains')
  })

  it('should switch to the multiple value operator when transitioning from a single value to multiple values', () => {
    // For an option column, "is" should transition to "is any of" when there is more than one value.
    const newOp = determineNewOperator('option', ['a'], ['a', 'b'], 'is')
    expect(newOp).toBe('is any of')
  })

  it('should switch to the single value operator when transitioning from multiple values to a single value', () => {
    // For a number column using a range operator, transitioning from two values to a single value
    // should update from "is between" to "is".
    const newOp = determineNewOperator('number', [5, 10], [5], 'is between')
    expect(newOp).toBe('is')
  })
})
