// @bazza-ui/data-view — Default Operator Sets
// One operator set per built-in column data type, each with fully-implemented match functions.

import {
  endOfDay,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
  startOfDay,
} from 'date-fns'

import { intersection } from '../lib/array.js'
import {
  getValidBigInt,
  getValidNumber,
  isValidNumber,
} from '../lib/helpers.js'
import { defineOperators, type OperatorSet } from './operator-set.js'
import type { BuiltInColumnDataType } from './types.js'

// ── Text Operators ─────────────────────────────────────────

export const textOperators = defineOperators({
  contains: {
    label: 'contains',
    target: 'single',
    i18nKey: 'filters.text.contains',
    match: (cellValue: any, filterValues: any[]) => {
      if (filterValues.length === 0 || filterValues[0] === '') return true
      const query = String(filterValues[0]).toLowerCase()
      return String(cellValue).toLowerCase().includes(query)
    },
  },
  'does not contain': {
    label: 'does not contain',
    target: 'single',
    i18nKey: 'filters.text.doesNotContain',
    match: (cellValue: any, filterValues: any[]) => {
      if (filterValues.length === 0 || filterValues[0] === '') return true
      const query = String(filterValues[0]).toLowerCase()
      return !String(cellValue).toLowerCase().includes(query)
    },
  },
})

// ── Option Operators ───────────────────────────────────────

export const optionOperators = defineOperators<
  'is' | 'is not' | 'is any of' | 'is none of'
>(
  {
    is: {
      label: 'is',
      target: 'single',
      i18nKey: 'filters.option.is',
      singular: 'is any of',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0) return true
        if (cellValue == null) return false
        const input = String(cellValue).toLowerCase()
        return filterValues.some((v) => String(v).toLowerCase() === input)
      },
    },
    'is not': {
      label: 'is not',
      target: 'single',
      i18nKey: 'filters.option.isNot',
      singular: 'is none of',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0) return true
        if (cellValue == null) return false
        const input = String(cellValue).toLowerCase()
        return !filterValues.some((v) => String(v).toLowerCase() === input)
      },
    },
    'is any of': {
      label: 'is any of',
      target: 'multiple',
      i18nKey: 'filters.option.isAnyOf',
      plural: 'is',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0) return true
        if (cellValue == null) return false
        const input = String(cellValue).toLowerCase()
        return filterValues.some((v) => String(v).toLowerCase() === input)
      },
    },
    'is none of': {
      label: 'is none of',
      target: 'multiple',
      i18nKey: 'filters.option.isNoneOf',
      plural: 'is not',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0) return true
        if (cellValue == null) return false
        const input = String(cellValue).toLowerCase()
        return !filterValues.some((v) => String(v).toLowerCase() === input)
      },
    },
  },
  { defaultSingle: 'is', defaultMultiple: 'is any of' },
)

// ── Multi-Option Operators ─────────────────────────────────

export const multiOptionOperators = defineOperators<
  | 'include'
  | 'exclude'
  | 'include any of'
  | 'include all of'
  | 'exclude if any of'
  | 'exclude if all'
>(
  {
    include: {
      label: 'include',
      target: 'single',
      i18nKey: 'filters.multiOption.include',
      singular: 'include any of',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0 || filterValues[0] === '') return true
        if (!Array.isArray(cellValue)) return false
        return intersection(cellValue, filterValues).length > 0
      },
    },
    exclude: {
      label: 'exclude',
      target: 'single',
      i18nKey: 'filters.multiOption.exclude',
      singular: 'exclude if any of',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0 || filterValues[0] === '') return true
        if (!Array.isArray(cellValue)) return false
        return intersection(cellValue, filterValues).length === 0
      },
    },
    'include any of': {
      label: 'include any of',
      target: 'multiple',
      i18nKey: 'filters.multiOption.includeAnyOf',
      plural: 'include',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0 || filterValues[0] === '') return true
        if (!Array.isArray(cellValue)) return false
        return intersection(cellValue, filterValues).length > 0
      },
    },
    'include all of': {
      label: 'include all of',
      target: 'multiple',
      i18nKey: 'filters.multiOption.includeAllOf',
      plural: 'include',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0 || filterValues[0] === '') return true
        if (!Array.isArray(cellValue)) return false
        return (
          intersection(cellValue, filterValues).length === filterValues.length
        )
      },
    },
    'exclude if any of': {
      label: 'exclude if any of',
      target: 'multiple',
      i18nKey: 'filters.multiOption.excludeIfAnyOf',
      plural: 'exclude',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0 || filterValues[0] === '') return true
        if (!Array.isArray(cellValue)) return false
        return !(intersection(cellValue, filterValues).length > 0)
      },
    },
    'exclude if all': {
      label: 'exclude if all',
      target: 'multiple',
      i18nKey: 'filters.multiOption.excludeIfAll',
      plural: 'exclude',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0 || filterValues[0] === '') return true
        if (!Array.isArray(cellValue)) return false
        return !(
          intersection(cellValue, filterValues).length === filterValues.length
        )
      },
    },
  },
  { defaultSingle: 'include', defaultMultiple: 'include any of' },
)

// ── Number Operators ───────────────────────────────────────

export const numberOperators = defineOperators<
  | 'is'
  | 'is not'
  | 'is greater than'
  | 'is greater than or equal to'
  | 'is less than'
  | 'is less than or equal to'
  | 'is between'
  | 'is not between'
>(
  {
    is: {
      label: 'is',
      target: 'single',
      i18nKey: 'filters.number.is',
      singular: 'is between',
      match: (cellValue: any, filterValues: any[]) => {
        const filterVal = getValidNumber(filterValues[0])
        if (filterVal === undefined) return true
        const value = getValidNumber(cellValue)
        if (value === undefined) return false
        return value === filterVal
      },
    },
    'is not': {
      label: 'is not',
      target: 'single',
      i18nKey: 'filters.number.isNot',
      singular: 'is not between',
      match: (cellValue: any, filterValues: any[]) => {
        const filterVal = getValidNumber(filterValues[0])
        if (filterVal === undefined) return true
        const value = getValidNumber(cellValue)
        if (value === undefined) return false
        return value !== filterVal
      },
    },
    'is greater than': {
      label: 'is greater than',
      target: 'single',
      i18nKey: 'filters.number.greaterThan',
      singular: 'is between',
      match: (cellValue: any, filterValues: any[]) => {
        const filterVal = getValidNumber(filterValues[0])
        if (filterVal === undefined) return true
        const value = getValidNumber(cellValue)
        if (value === undefined) return false
        if (value === Number.POSITIVE_INFINITY) return true
        if (filterVal === Number.POSITIVE_INFINITY) return false
        return value > filterVal
      },
    },
    'is greater than or equal to': {
      label: 'is greater than or equal to',
      target: 'single',
      i18nKey: 'filters.number.greaterThanOrEqual',
      singular: 'is between',
      match: (cellValue: any, filterValues: any[]) => {
        const filterVal = getValidNumber(filterValues[0])
        if (filterVal === undefined) return true
        const value = getValidNumber(cellValue)
        if (value === undefined) return false
        if (value === Number.POSITIVE_INFINITY) return true
        if (filterVal === Number.POSITIVE_INFINITY) return false
        return value >= filterVal
      },
    },
    'is less than': {
      label: 'is less than',
      target: 'single',
      i18nKey: 'filters.number.lessThan',
      singular: 'is between',
      match: (cellValue: any, filterValues: any[]) => {
        const filterVal = getValidNumber(filterValues[0])
        if (filterVal === undefined) return true
        const value = getValidNumber(cellValue)
        if (value === undefined) return false
        if (value === Number.NEGATIVE_INFINITY) return true
        if (filterVal === Number.NEGATIVE_INFINITY) return false
        return value < filterVal
      },
    },
    'is less than or equal to': {
      label: 'is less than or equal to',
      target: 'single',
      i18nKey: 'filters.number.lessThanOrEqual',
      singular: 'is between',
      match: (cellValue: any, filterValues: any[]) => {
        const filterVal = getValidNumber(filterValues[0])
        if (filterVal === undefined) return true
        const value = getValidNumber(cellValue)
        if (value === undefined) return false
        if (value === Number.NEGATIVE_INFINITY) return true
        if (filterVal === Number.NEGATIVE_INFINITY) return false
        return value <= filterVal
      },
    },
    'is between': {
      label: 'is between',
      target: 'multiple',
      i18nKey: 'filters.number.isBetween',
      plural: 'is',
      match: (cellValue: any, filterValues: any[]) => {
        const a = getValidNumber(filterValues[0])
        const b = getValidNumber(filterValues[1])
        if (a === undefined || b === undefined) return true
        const value = getValidNumber(cellValue)
        if (value === undefined) return false
        const min = Math.min(a, b)
        const max = Math.max(a, b)
        return value >= min && value <= max
      },
    },
    'is not between': {
      label: 'is not between',
      target: 'multiple',
      i18nKey: 'filters.number.isNotBetween',
      plural: 'is not',
      match: (cellValue: any, filterValues: any[]) => {
        const a = getValidNumber(filterValues[0])
        const b = getValidNumber(filterValues[1])
        if (a === undefined || b === undefined) return true
        const value = getValidNumber(cellValue)
        if (value === undefined) return false
        const min = Math.min(a, b)
        const max = Math.max(a, b)
        return value < min || value > max
      },
    },
  },
  { defaultSingle: 'is', defaultMultiple: 'is between' },
)

// ── BigInt Operators ───────────────────────────────────────

export const bigIntOperators = defineOperators<
  | 'is'
  | 'is not'
  | 'is greater than'
  | 'is greater than or equal to'
  | 'is less than'
  | 'is less than or equal to'
  | 'is between'
  | 'is not between'
>(
  {
    is: {
      label: 'is',
      target: 'single',
      i18nKey: 'filters.number.is',
      singular: 'is between',
      match: (cellValue: any, filterValues: any[]) => {
        const filterVal = getValidBigInt(filterValues[0])
        if (filterVal === undefined) return true
        const value = getValidBigInt(cellValue)
        if (value === undefined) return false
        return value === filterVal
      },
    },
    'is not': {
      label: 'is not',
      target: 'single',
      i18nKey: 'filters.number.isNot',
      singular: 'is not between',
      match: (cellValue: any, filterValues: any[]) => {
        const filterVal = getValidBigInt(filterValues[0])
        if (filterVal === undefined) return true
        const value = getValidBigInt(cellValue)
        if (value === undefined) return false
        return value !== filterVal
      },
    },
    'is greater than': {
      label: 'is greater than',
      target: 'single',
      i18nKey: 'filters.number.greaterThan',
      singular: 'is between',
      match: (cellValue: any, filterValues: any[]) => {
        const filterVal = getValidBigInt(filterValues[0])
        if (filterVal === undefined) return true
        const value = getValidBigInt(cellValue)
        if (value === undefined) return false
        return value > filterVal
      },
    },
    'is greater than or equal to': {
      label: 'is greater than or equal to',
      target: 'single',
      i18nKey: 'filters.number.greaterThanOrEqual',
      singular: 'is between',
      match: (cellValue: any, filterValues: any[]) => {
        const filterVal = getValidBigInt(filterValues[0])
        if (filterVal === undefined) return true
        const value = getValidBigInt(cellValue)
        if (value === undefined) return false
        return value >= filterVal
      },
    },
    'is less than': {
      label: 'is less than',
      target: 'single',
      i18nKey: 'filters.number.lessThan',
      singular: 'is between',
      match: (cellValue: any, filterValues: any[]) => {
        const filterVal = getValidBigInt(filterValues[0])
        if (filterVal === undefined) return true
        const value = getValidBigInt(cellValue)
        if (value === undefined) return false
        return value < filterVal
      },
    },
    'is less than or equal to': {
      label: 'is less than or equal to',
      target: 'single',
      i18nKey: 'filters.number.lessThanOrEqual',
      singular: 'is between',
      match: (cellValue: any, filterValues: any[]) => {
        const filterVal = getValidBigInt(filterValues[0])
        if (filterVal === undefined) return true
        const value = getValidBigInt(cellValue)
        if (value === undefined) return false
        return value <= filterVal
      },
    },
    'is between': {
      label: 'is between',
      target: 'multiple',
      i18nKey: 'filters.number.isBetween',
      plural: 'is',
      match: (cellValue: any, filterValues: any[]) => {
        const a = getValidBigInt(filterValues[0])
        const b = getValidBigInt(filterValues[1])
        if (a === undefined || b === undefined) return true
        const value = getValidBigInt(cellValue)
        if (value === undefined) return false
        const min = a < b ? a : b
        const max = a > b ? a : b
        return value >= min && value <= max
      },
    },
    'is not between': {
      label: 'is not between',
      target: 'multiple',
      i18nKey: 'filters.number.isNotBetween',
      plural: 'is not',
      match: (cellValue: any, filterValues: any[]) => {
        const a = getValidBigInt(filterValues[0])
        const b = getValidBigInt(filterValues[1])
        if (a === undefined || b === undefined) return true
        const value = getValidBigInt(cellValue)
        if (value === undefined) return false
        const min = a < b ? a : b
        const max = a > b ? a : b
        return value < min || value > max
      },
    },
  },
  { defaultSingle: 'is', defaultMultiple: 'is between' },
)

// ── Date Operators ─────────────────────────────────────────

export const dateOperators = defineOperators<
  | 'is'
  | 'is not'
  | 'is before'
  | 'is on or after'
  | 'is after'
  | 'is on or before'
  | 'is between'
  | 'is not between'
>(
  {
    is: {
      label: 'is',
      target: 'single',
      i18nKey: 'filters.date.is',
      singular: 'is between',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0) return true
        const d1 = filterValues[0]
        if (!(d1 instanceof Date)) return true
        if (!(cellValue instanceof Date)) return false
        return isSameDay(cellValue, d1)
      },
    },
    'is not': {
      label: 'is not',
      target: 'single',
      i18nKey: 'filters.date.isNot',
      singular: 'is not between',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0) return true
        const d1 = filterValues[0]
        if (!(d1 instanceof Date)) return true
        if (!(cellValue instanceof Date)) return false
        return !isSameDay(cellValue, d1)
      },
    },
    'is before': {
      label: 'is before',
      target: 'single',
      i18nKey: 'filters.date.isBefore',
      singular: 'is between',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0) return true
        const d1 = filterValues[0]
        if (!(d1 instanceof Date)) return true
        if (!(cellValue instanceof Date)) return false
        return isBefore(cellValue, startOfDay(d1))
      },
    },
    'is on or after': {
      label: 'is on or after',
      target: 'single',
      i18nKey: 'filters.date.isOnOrAfter',
      singular: 'is between',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0) return true
        const d1 = filterValues[0]
        if (!(d1 instanceof Date)) return true
        if (!(cellValue instanceof Date)) return false
        return isSameDay(cellValue, d1) || isAfter(cellValue, d1)
      },
    },
    'is after': {
      label: 'is after',
      target: 'single',
      i18nKey: 'filters.date.isAfter',
      singular: 'is between',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0) return true
        const d1 = filterValues[0]
        if (!(d1 instanceof Date)) return true
        if (!(cellValue instanceof Date)) return false
        return isAfter(cellValue, endOfDay(d1))
      },
    },
    'is on or before': {
      label: 'is on or before',
      target: 'single',
      i18nKey: 'filters.date.isOnOrBefore',
      singular: 'is between',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0) return true
        const d1 = filterValues[0]
        if (!(d1 instanceof Date)) return true
        if (!(cellValue instanceof Date)) return false
        return isSameDay(cellValue, d1) || isBefore(cellValue, d1)
      },
    },
    'is between': {
      label: 'is between',
      target: 'multiple',
      i18nKey: 'filters.date.isBetween',
      plural: 'is',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length < 2) return true
        const d1 = filterValues[0]
        const d2 = filterValues[1]
        if (!(d1 instanceof Date) || !(d2 instanceof Date)) return true
        if (!(cellValue instanceof Date)) return false
        const start = isBefore(d1, d2) ? d1 : d2
        const end = isBefore(d1, d2) ? d2 : d1
        return isWithinInterval(cellValue, {
          start: startOfDay(start),
          end: endOfDay(end),
        })
      },
    },
    'is not between': {
      label: 'is not between',
      target: 'multiple',
      i18nKey: 'filters.date.isNotBetween',
      plural: 'is not',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length < 2) return true
        const d1 = filterValues[0]
        const d2 = filterValues[1]
        if (!(d1 instanceof Date) || !(d2 instanceof Date)) return true
        if (!(cellValue instanceof Date)) return false
        const start = isBefore(d1, d2) ? d1 : d2
        const end = isBefore(d1, d2) ? d2 : d1
        return !isWithinInterval(cellValue, {
          start: startOfDay(start),
          end: endOfDay(end),
        })
      },
    },
  },
  { defaultSingle: 'is', defaultMultiple: 'is between' },
)

// ── Boolean Operators ──────────────────────────────────────

export const booleanOperators = defineOperators<'is' | 'is not'>(
  {
    is: {
      label: 'is',
      target: 'single',
      i18nKey: 'filters.boolean.is',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0) return true
        const filterVal = filterValues[0] ?? false
        return cellValue === filterVal
      },
    },
    'is not': {
      label: 'is not',
      target: 'single',
      i18nKey: 'filters.boolean.isNot',
      match: (cellValue: any, filterValues: any[]) => {
        if (filterValues.length === 0) return true
        const filterVal = filterValues[0] ?? false
        return cellValue !== filterVal
      },
    },
  },
  { defaultSingle: 'is' },
)

// ── Default Operator Sets Map ──────────────────────────────

export const defaultOperatorSets: Record<BuiltInColumnDataType, OperatorSet> = {
  text: textOperators,
  number: numberOperators,
  bigint: bigIntOperators,
  date: dateOperators,
  boolean: booleanOperators,
  option: optionOperators,
  multiOption: multiOptionOperators,
}
