import { bench, describe } from 'vitest'
import type { FiltersState } from '../core/types.js'
import { filterData } from '../lib/helpers.js'
import {
  BENCHMARK_SIZES,
  type BenchmarkDataSizes,
  generateBenchmarkDatasets,
} from './benchmark-utils.js'

const datasets = Object.entries(generateBenchmarkDatasets()) as [
  keyof BenchmarkDataSizes,
  unknown[],
][]

const scenarios = Object.entries({
  singleTextFilter: [
    {
      columnId: 'title',
      type: 'text',
      operator: 'contains',
      values: ['Fix'],
    },
  ] as FiltersState,

  singleNumberFilter: [
    {
      columnId: 'estimatedHours',
      type: 'number',
      operator: 'is between',
      values: [5, 10],
    },
  ] as FiltersState,

  singleOptionFilter: [
    {
      columnId: 'status',
      type: 'option',
      operator: 'is',
      values: ['active'],
    },
  ] as FiltersState,

  multipleMixedFilters: [
    {
      columnId: 'title',
      type: 'text',
      operator: 'contains',
      values: ['Fix'],
    },
    {
      columnId: 'estimatedHours',
      type: 'number',
      operator: 'is greater than',
      values: [5],
    },
    {
      columnId: 'isUrgent',
      type: 'boolean',
      operator: 'is',
      values: [true],
    },
  ] as FiltersState,

  complexMultipleFilters: [
    {
      columnId: 'title',
      type: 'text',
      operator: 'contains',
      values: ['API'],
    },
    {
      columnId: 'estimatedHours',
      type: 'number',
      operator: 'is between',
      values: [3, 12],
    },
    {
      columnId: 'status',
      type: 'option',
      operator: 'is any of',
      values: ['active', 'in-progress'],
    },
    {
      columnId: 'labels',
      type: 'multiOption',
      operator: 'include any of',
      values: ['Backend', 'API'],
    },
  ] as FiltersState,
}) as [string, FiltersState][]

describe.each(datasets)('Dataset size: %s', (sizeKey, dataset) => {
  const humanCount = BENCHMARK_SIZES[sizeKey].toLocaleString()

  describe.each(scenarios)('%s', (scenarioName, filters) => {
    bench(`${scenarioName}`, () => {
      filterData(dataset, filters)
    })
  })
})
