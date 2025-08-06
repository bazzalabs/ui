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
          (_prev: FiltersState, _next: FiltersState) => {},
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
            onFiltersChange: mockHandler, // Custom style: 2 parameters
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
        )

        // Verify it was called with exactly 2 parameters
        expect(mockHandler.mock.calls[0]).toHaveLength(2)
      })

      it('should provide correct prev and next values when removing filters', () => {
        const mockHandler = vi.fn(
          (_prev: FiltersState, _next: FiltersState) => {},
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
        )
      })

      it('should provide correct prev and next values when completely removing a filter', () => {
        const mockHandler = vi.fn(
          (_prev: FiltersState, _next: FiltersState) => {},
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
        const customHandler = (_prev: FiltersState, _next: FiltersState) => {} // length = 2

        expect(reactDispatchHandler.length).toBe(1)
        expect(customHandler.length).toBe(2)
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

      it('should handle functions with 3+ parameters as custom handlers', () => {
        const mockHandler = vi.fn()
        // Create a function with 3 parameters (should be treated as custom)
        const threeParamHandler = (
          prev: FiltersState,
          next: FiltersState,
          extra: any,
        ) => mockHandler(prev, next, extra)

        const { result } = renderHook(() =>
          useDataTableFilters({
            strategy: 'client',
            data,
            columnsConfig,
            options,
            filters: [],
            // @ts-expect-error testing with three params
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
          undefined, // extra parameter gets undefined
        )
      })

      it('should properly handle function updates with custom handlers', () => {
        const mockHandler = vi.fn(
          (_prev: FiltersState, _next: FiltersState) => {},
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
        (_prev: FiltersState, _next: FiltersState) => {},
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
