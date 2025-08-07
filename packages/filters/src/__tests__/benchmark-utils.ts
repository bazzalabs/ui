import { lorem } from '@ndaidong/txtgen'
import { sub } from 'date-fns'
import { nanoid } from 'nanoid'
import { randomInteger, sample } from 'remeda'
import { isAnyOf } from '../lib/array.js'
import {
  calculateEndDate,
  ISSUE_LABELS,
  ISSUE_STATUSES,
  type Issue,
  type IssueLabel,
  USERS,
} from './benchmark-data.js'

/**
 * Benchmark utilities for generating test data of various sizes
 */

export interface BenchmarkDataSizes {
  small: number
  medium: number
  large: number
  xlarge: number
  '2xlarge': number
}

export const BENCHMARK_SIZES: BenchmarkDataSizes = {
  small: 100,
  medium: 1_000,
  large: 10_000,
  xlarge: 100_000,
  '2xlarge': 1_000_000,
}

/**
 * Generate a random issue for benchmarking
 */
export function generateBenchmarkIssue(): Issue {
  const title = lorem(2, 6)
  const description = lorem(4, 12)

  const labelsCount = randomInteger(0, 3)
  const labels =
    labelsCount > 0
      ? (sample(ISSUE_LABELS, labelsCount) as IssueLabel[])
      : undefined

  let [assignee] = sample(USERS, 1)
  if (!assignee) throw new Error('No assignee found')
  assignee = Math.random() > 0.3 ? assignee : undefined

  const [status] = sample(ISSUE_STATUSES, 1)
  if (!status) throw new Error('No status found')

  const startDate = isAnyOf(status.id, ['backlog', 'todo'])
    ? undefined
    : sub(new Date(), { days: randomInteger(10, 60) })

  const endDate =
    !startDate || status.id !== 'done' ? undefined : calculateEndDate(startDate)

  const estimatedHours = randomInteger(1, 16)
  const isUrgent = Math.random() > 0.9

  return {
    id: nanoid(),
    title,
    description,
    status,
    labels,
    assignee,
    startDate,
    endDate,
    estimatedHours,
    isUrgent,
  }
}

export function generateBenchmarkDatasets(
  sizes: Array<keyof BenchmarkDataSizes> = Object.keys(
    BENCHMARK_SIZES,
  ) as Array<keyof BenchmarkDataSizes>,
): Record<keyof BenchmarkDataSizes, Issue[]> {
  const datasets = {} as Record<keyof BenchmarkDataSizes, Issue[]>
  sizes.forEach((key) => {
    datasets[key] = []
  })

  // find maximum count needed
  const maxCount = Math.max(...sizes.map((key) => BENCHMARK_SIZES[key]))

  for (let i = 0; i < maxCount; i++) {
    const issue = generateBenchmarkIssue()
    sizes.forEach((key) => {
      if (i < BENCHMARK_SIZES[key]) datasets[key].push(issue)
    })
  }

  return datasets
}

/**
 * Generate text values for benchmarking text filters
 */
export function generateTextValues(count: number): string[] {
  return Array.from({ length: count }, () => lorem(1, 4))
}

/**
 * Generate number values for benchmarking number filters
 */
export function generateNumberValues(count: number): number[] {
  return Array.from({ length: count }, () => Math.random() * 1000)
}

/**
 * Generate date values for benchmarking date filters
 */
export function generateDateValues(count: number): Date[] {
  return Array.from({ length: count }, () =>
    sub(new Date(), { days: randomInteger(0, 365) }),
  )
}

/**
 * Generate boolean values for benchmarking boolean filters
 */
export function generateBooleanValues(count: number): boolean[] {
  return Array.from({ length: count }, () => Math.random() > 0.5)
}

/**
 * Generate option values for benchmarking option filters
 */
export function generateOptionValues(count: number): string[] {
  const options = ['active', 'inactive', 'pending', 'completed', 'cancelled']
  return Array.from(
    { length: count },
    () => options[Math.floor(Math.random() * options.length)]!,
  )
}

/**
 * Generate multi-option values for benchmarking multi-option filters
 */
export function generateMultiOptionValues(count: number): string[][] {
  const allOptions = [
    'frontend',
    'backend',
    'database',
    'api',
    'testing',
    'documentation',
  ]
  return Array.from({ length: count }, () => {
    const numOptions = randomInteger(1, 4)
    return sample(allOptions, numOptions)
  })
}

/**
 * Warm up function to ensure JIT compilation
 */
export function warmUp<T>(fn: () => T, iterations = 1000): void {
  for (let i = 0; i < iterations; i++) {
    fn()
  }
}

generateBenchmarkDatasets()
