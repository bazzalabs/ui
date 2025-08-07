import { bench, describe } from 'vitest'
import { ColumnDataService } from '../core/columns/column-data-service.js'
import { createColumnConfigHelper } from '../core/columns/index.js'
import { ISSUE_STATUSES, type Issue } from './benchmark-data.js'
import {
  BENCHMARK_SIZES,
  type BenchmarkDataSizes,
  generateBenchmarkDatasets,
} from './benchmark-utils.js'

describe('Column Options Inference Performance', () => {
  const datasets = generateBenchmarkDatasets()
  const helper = createColumnConfigHelper<Issue>()

  // Column configurations for different data types
  const columnConfigs = {
    // Simple option column (status)
    statusColumn: helper
      .option()
      .id('status')
      .accessor((row) => row.status.id)
      .displayName('Status')
      .build(),

    // Complex option column with transform (assignee)
    assigneeColumn: helper
      .option()
      .accessor((row) => row.assignee)
      .id('assignee')
      .displayName('Assignee')
      .transformValueToOptionFn((user) => ({
        value: user.id,
        label: user.name,
      }))
      .build(),

    // Multi-option column (labels)
    labelsColumn: helper
      .multiOption()
      .accessor((row) => row.labels || [])
      .id('labels')
      .displayName('Labels')
      .transformValueToOptionFn((label) => ({
        value: label.id,
        label: label.name,
      }))
      .build(),

    // Static options column (status with predefined options)
    statusWithStaticOptions: helper
      .option()
      .accessor((row) => row.status.id)
      .id('status')
      .displayName('Status')
      .options(ISSUE_STATUSES.map((s) => ({ value: s.id, label: s.name })))
      .build(),
  }

  // Benchmark option inference for different dataset sizes
  Object.entries(datasets).forEach(([sizeKey, dataset]) => {
    const size = BENCHMARK_SIZES[sizeKey as keyof BenchmarkDataSizes]

    describe(`Dataset size: ${sizeKey} (${size.toLocaleString()} items)`, () => {
      const dataService = new ColumnDataService(dataset, 'client')

      bench(`Status options inference - ${sizeKey}`, () => {
        dataService.computeTransformedOptions(columnConfigs.statusColumn)
      })

      bench(`Assignee options inference with transform - ${sizeKey}`, () => {
        dataService.computeTransformedOptions(columnConfigs.assigneeColumn)
      })

      bench(
        `Labels multi-options inference with transform - ${sizeKey}`,
        () => {
          dataService.computeTransformedOptions(columnConfigs.labelsColumn)
        },
      )

      bench(`Status with static options - ${sizeKey}`, () => {
        dataService.computeTransformedOptions(
          columnConfigs.statusWithStaticOptions,
        )
      })
    })
  })

  // Comparative benchmarks for different column types on medium dataset
  describe('Column Type Comparison - Medium Dataset', () => {
    const dataset = datasets.medium
    const dataService = new ColumnDataService(dataset, 'client')

    bench('Simple option column (no transform)', () => {
      dataService.computeTransformedOptions(columnConfigs.statusColumn)
    })

    bench('Option column with value transform', () => {
      dataService.computeTransformedOptions(columnConfigs.assigneeColumn)
    })

    bench('Multi-option column with value transform', () => {
      dataService.computeTransformedOptions(columnConfigs.labelsColumn)
    })

    bench('Static options (no data inference)', () => {
      dataService.computeTransformedOptions(
        columnConfigs.statusWithStaticOptions,
      )
    })
  })

  // Benchmark different parts of the option computation pipeline
  describe('Option Computation Pipeline - Large Dataset', () => {
    const dataset = datasets.large
    const dataService = new ColumnDataService(dataset, 'client')
    const column = columnConfigs.labelsColumn

    bench('Base options computation (Step 1)', () => {
      dataService.computeBaseOptions(column)
    })

    bench('Ordered options with counts (Step 2)', () => {
      dataService.computeOrderedOptions(column)
    })

    bench('Transformed options (Step 3)', () => {
      dataService.computeTransformedOptions(column)
    })

    bench('Get raw values only', () => {
      dataService.getValues(column)
    })

    bench('Faceted unique values computation', () => {
      const values = dataService.getValues(column)
      dataService.computeFacetedUniqueValues(column, values as any)
    })
  })

  // Benchmark with ordering functions
  describe('Option Ordering Performance - Medium Dataset', () => {
    const dataset = datasets.medium
    const dataService = new ColumnDataService(dataset, 'client')

    const columnWithCountOrdering = helper
      .option()
      .accessor((row) => row.status.id)
      .id('status')
      .displayName('Status')
      .orderFn('count', 'desc')
      .build()

    const columnWithLabelOrdering = helper
      .option()
      .accessor((row) => row.status.id)
      .id('status')
      .displayName('Status')
      .orderFn('label', 'asc')
      .build()

    const columnWithMultipleOrdering = helper
      .option()
      .accessor((row) => row.status.id)
      .id('status')
      .displayName('Status')
      .orderFn(['count', 'desc'], ['label', 'asc'])
      .build()

    bench('No ordering', () => {
      dataService.computeTransformedOptions(columnConfigs.statusColumn)
    })

    bench('Count-based ordering', () => {
      dataService.computeTransformedOptions(columnWithCountOrdering)
    })

    bench('Label-based ordering', () => {
      dataService.computeTransformedOptions(columnWithLabelOrdering)
    })

    bench('Multiple ordering criteria', () => {
      dataService.computeTransformedOptions(columnWithMultipleOrdering)
    })
  })

  // Memory efficiency tests
  describe('Memory Efficiency - Large Dataset', () => {
    const dataset = datasets.large

    bench('Multiple column inferences (simulating full table)', () => {
      const dataService = new ColumnDataService(dataset, 'client')

      // Simulate processing multiple columns like a real data table
      dataService.computeTransformedOptions(columnConfigs.statusColumn)
      dataService.computeTransformedOptions(columnConfigs.assigneeColumn)
      dataService.computeTransformedOptions(columnConfigs.labelsColumn)
    })

    bench('Repeated inference on same column', () => {
      const dataService = new ColumnDataService(dataset, 'client')

      // Simulate multiple calls to same column (should benefit from memoization)
      for (let i = 0; i < 10; i++) {
        dataService.computeTransformedOptions(columnConfigs.labelsColumn)
      }
    })
  })

  // Edge cases
  describe('Edge Cases', () => {
    bench('Empty dataset', () => {
      const dataService = new ColumnDataService([], 'client')
      dataService.computeTransformedOptions(columnConfigs.statusColumn)
    })

    bench('Dataset with many null/undefined values', () => {
      const sparseDataset = datasets.medium.map((issue) => ({
        ...issue,
        assignee: Math.random() > 0.8 ? issue.assignee : undefined,
        labels: Math.random() > 0.7 ? issue.labels : undefined,
      }))

      const dataService = new ColumnDataService(sparseDataset, 'client')
      dataService.computeTransformedOptions(columnConfigs.assigneeColumn)
    })

    bench('High cardinality options (many unique values)', () => {
      // Create dataset where each item has unique assignee
      const highCardinalityDataset = datasets.medium.map((issue, index) => ({
        ...issue,
        assignee: {
          id: `user-${index}`,
          name: `User ${index}`,
          picture: `/avatar-${index}.jpg`,
        },
      }))

      const dataService = new ColumnDataService(
        highCardinalityDataset,
        'client',
      )
      dataService.computeTransformedOptions(columnConfigs.assigneeColumn)
    })
  })
})
