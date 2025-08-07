import { bench, describe } from 'vitest'
import type { FilterModel } from '../core/types.js'
import {
  booleanFilterFn,
  dateFilterFn,
  multiOptionFilterFn,
  numberFilterFn,
  optionFilterFn,
  textFilterFn,
} from '../lib/filter-fns.js'
import {
  BENCHMARK_SIZES,
  generateBooleanValues,
  generateDateValues,
  generateMultiOptionValues,
  generateNumberValues,
  generateOptionValues,
  generateTextValues,
} from './benchmark-utils.js'

describe('Filter Functions Performance', () => {
  const benchmarkSize = BENCHMARK_SIZES.medium

  // Generate test data
  const textValues = generateTextValues(benchmarkSize)
  const numberValues = generateNumberValues(benchmarkSize)
  const dateValues = generateDateValues(benchmarkSize)
  const booleanValues = generateBooleanValues(benchmarkSize)
  const optionValues = generateOptionValues(benchmarkSize)
  const multiOptionValues = generateMultiOptionValues(benchmarkSize)

  describe('textFilterFn', () => {
    const filters = {
      contains: {
        columnId: 'test',
        type: 'text',
        operator: 'contains',
        values: ['test'],
      } as FilterModel<'text'>,
      doesNotContain: {
        columnId: 'test',
        type: 'text',
        operator: 'does not contain',
        values: ['test'],
      } as FilterModel<'text'>,
    }

    bench('textFilterFn - contains operator', () => {
      textValues.forEach((value) => textFilterFn(value, filters.contains))
    })

    bench('textFilterFn - does not contain operator', () => {
      textValues.forEach((value) => textFilterFn(value, filters.doesNotContain))
    })
  })

  describe('numberFilterFn', () => {
    const filters = {
      is: {
        columnId: 'test',
        type: 'number',
        operator: 'is',
        values: [500],
      } as FilterModel<'number'>,
      isBetween: {
        columnId: 'test',
        type: 'number',
        operator: 'is between',
        values: [250, 750],
      } as FilterModel<'number'>,
      isGreaterThan: {
        columnId: 'test',
        type: 'number',
        operator: 'is greater than',
        values: [500],
      } as FilterModel<'number'>,
    }

    bench('numberFilterFn - is operator', () => {
      numberValues.forEach((value) => numberFilterFn(value, filters.is))
    })

    bench('numberFilterFn - is between operator', () => {
      numberValues.forEach((value) => numberFilterFn(value, filters.isBetween))
    })

    bench('numberFilterFn - is greater than operator', () => {
      numberValues.forEach((value) =>
        numberFilterFn(value, filters.isGreaterThan),
      )
    })
  })

  describe('dateFilterFn', () => {
    const referenceDate = new Date('2024-06-01')
    const filters = {
      is: {
        columnId: 'test',
        type: 'date',
        operator: 'is',
        values: [referenceDate],
      } as FilterModel<'date'>,
      isBetween: {
        columnId: 'test',
        type: 'date',
        operator: 'is between',
        values: [new Date('2024-01-01'), new Date('2024-12-31')],
      } as FilterModel<'date'>,
      isBefore: {
        columnId: 'test',
        type: 'date',
        operator: 'is before',
        values: [referenceDate],
      } as FilterModel<'date'>,
    }

    bench('dateFilterFn - is operator', () => {
      dateValues.forEach((value) => dateFilterFn(value, filters.is))
    })

    bench('dateFilterFn - is between operator', () => {
      dateValues.forEach((value) => dateFilterFn(value, filters.isBetween))
    })

    bench('dateFilterFn - is before operator', () => {
      dateValues.forEach((value) => dateFilterFn(value, filters.isBefore))
    })
  })

  describe('booleanFilterFn', () => {
    const filters = {
      is: {
        columnId: 'test',
        type: 'boolean',
        operator: 'is',
        values: [true],
      } as FilterModel<'boolean'>,
      isNot: {
        columnId: 'test',
        type: 'boolean',
        operator: 'is not',
        values: [true],
      } as FilterModel<'boolean'>,
    }

    bench('booleanFilterFn - is operator', () => {
      booleanValues.forEach((value) => booleanFilterFn(value, filters.is))
    })

    bench('booleanFilterFn - is not operator', () => {
      booleanValues.forEach((value) => booleanFilterFn(value, filters.isNot))
    })
  })

  describe('optionFilterFn', () => {
    const filters = {
      is: {
        columnId: 'test',
        type: 'option',
        operator: 'is',
        values: ['active'],
      } as FilterModel<'option'>,
      isAnyOf: {
        columnId: 'test',
        type: 'option',
        operator: 'is any of',
        values: ['active', 'pending'],
      } as FilterModel<'option'>,
      isNot: {
        columnId: 'test',
        type: 'option',
        operator: 'is not',
        values: ['cancelled'],
      } as FilterModel<'option'>,
    }

    bench('optionFilterFn - is operator', () => {
      optionValues.forEach((value) => optionFilterFn(value, filters.is))
    })

    bench('optionFilterFn - is any of operator', () => {
      optionValues.forEach((value) => optionFilterFn(value, filters.isAnyOf))
    })

    bench('optionFilterFn - is not operator', () => {
      optionValues.forEach((value) => optionFilterFn(value, filters.isNot))
    })
  })

  describe('multiOptionFilterFn', () => {
    const filters = {
      include: {
        columnId: 'test',
        type: 'multiOption',
        operator: 'include',
        values: ['frontend'],
      } as FilterModel<'multiOption'>,
      includeAnyOf: {
        columnId: 'test',
        type: 'multiOption',
        operator: 'include any of',
        values: ['frontend', 'backend'],
      } as FilterModel<'multiOption'>,
      includeAllOf: {
        columnId: 'test',
        type: 'multiOption',
        operator: 'include all of',
        values: ['frontend', 'testing'],
      } as FilterModel<'multiOption'>,
    }

    bench('multiOptionFilterFn - include operator', () => {
      multiOptionValues.forEach((value) =>
        multiOptionFilterFn(value, filters.include),
      )
    })

    bench('multiOptionFilterFn - include any of operator', () => {
      multiOptionValues.forEach((value) =>
        multiOptionFilterFn(value, filters.includeAnyOf),
      )
    })

    bench('multiOptionFilterFn - include all of operator', () => {
      multiOptionValues.forEach((value) =>
        multiOptionFilterFn(value, filters.includeAllOf),
      )
    })
  })

  describe('Filter Functions Comparison', () => {
    // Create a consolidated benchmark comparing all filter functions
    const textFilter = {
      columnId: 'test',
      type: 'text',
      operator: 'contains',
      values: ['test'],
    } as FilterModel<'text'>

    const numberFilter = {
      columnId: 'test',
      type: 'number',
      operator: 'is between',
      values: [250, 750],
    } as FilterModel<'number'>

    const booleanFilter = {
      columnId: 'test',
      type: 'boolean',
      operator: 'is',
      values: [true],
    } as FilterModel<'boolean'>

    const optionFilter = {
      columnId: 'test',
      type: 'option',
      operator: 'is any of',
      values: ['active', 'pending'],
    } as FilterModel<'option'>

    bench('All filter functions combined', () => {
      for (let i = 0; i < Math.min(textValues.length, 100); i++) {
        textFilterFn(textValues[i]!, textFilter)
        numberFilterFn(numberValues[i]!, numberFilter)
        booleanFilterFn(booleanValues[i]!, booleanFilter)
        optionFilterFn(optionValues[i]!, optionFilter)
      }
    })
  })
})
