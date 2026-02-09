// @bazza-ui/data-view — Operator Compilers
// Maps operator IDs to AST Condition nodes.
// This is the server-side counterpart to the `match` functions in operator-sets.ts.

import type { BuiltInColumnDataType } from '../core/types.js'
import type { Condition, FieldRef, JsonSafeValue } from './ast.js'

// ── Compiler Function Type ──────────────────────────────────

/**
 * Compiles a filter operator + values into an AST `Condition` node.
 *
 * This is the server-side counterpart to `OperatorDefinition.match`.
 * Each built-in operator has a compiler that produces the AST node
 * an adapter needs to generate the correct SQL/ORM query.
 */
export type OperatorCompiler = (
  field: FieldRef,
  values: JsonSafeValue[],
) => Condition

/**
 * Map of operator ID → compiler function for a given column type.
 */
export type OperatorCompilerMap = Record<string, OperatorCompiler>

// ── LIKE Escaping ───────────────────────────────────────────

/**
 * Escapes special characters in a LIKE/ILIKE pattern.
 * Handles `%`, `_`, and `\` (the SQL LIKE wildcards).
 */
export function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

// ── Text Compilers ──────────────────────────────────────────

export const textCompilers: OperatorCompilerMap = {
  contains: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'ilike',
    value: `%${escapeLike(String(values[0] ?? ''))}%`,
  }),

  does_not_contain: (field, values) => ({
    kind: 'not',
    condition: {
      kind: 'comparison',
      field,
      op: 'ilike',
      value: `%${escapeLike(String(values[0] ?? ''))}%`,
    },
  }),
}

// ── Option Compilers ────────────────────────────────────────

export const optionCompilers: OperatorCompilerMap = {
  is: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'eq',
    value: values[0] ?? null,
  }),

  is_not: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'neq',
    value: values[0] ?? null,
  }),

  is_any_of: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'in',
    value: values,
  }),

  is_none_of: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'notIn',
    value: values,
  }),
}

// ── Number Compilers ────────────────────────────────────────

export const numberCompilers: OperatorCompilerMap = {
  is: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'eq',
    value: values[0] ?? null,
  }),

  is_not: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'neq',
    value: values[0] ?? null,
  }),

  is_greater_than: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'gt',
    value: values[0] ?? null,
  }),

  is_gte: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'gte',
    value: values[0] ?? null,
  }),

  is_less_than: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'lt',
    value: values[0] ?? null,
  }),

  is_lte: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'lte',
    value: values[0] ?? null,
  }),

  is_between: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'between',
    value: [values[0] ?? null, values[1] ?? null],
  }),

  is_not_between: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'notBetween',
    value: [values[0] ?? null, values[1] ?? null],
  }),
}

// ── BigInt Compilers (same structure as number) ─────────────

// BigInt values are serialized to strings via ColumnType.serialize.
// The adapter deserializes them to the appropriate DB type.
export const bigIntCompilers: OperatorCompilerMap = numberCompilers

// ── Date Compilers ──────────────────────────────────────────

// Date values are serialized to ISO strings via ColumnType.serialize.
// Day boundary logic (startOfDay/endOfDay) is applied here since the
// frontend `match` functions also apply it.

/**
 * Returns the start-of-day ISO string for a date value.
 * If the value is already an ISO string, parses it first.
 */
function startOfDayISO(value: JsonSafeValue): string {
  const date = new Date(value as string | number)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

/**
 * Returns the end-of-day ISO string for a date value.
 */
function endOfDayISO(value: JsonSafeValue): string {
  const date = new Date(value as string | number)
  date.setHours(23, 59, 59, 999)
  return date.toISOString()
}

export const dateCompilers: OperatorCompilerMap = {
  // "is" for dates means "same day" — expand to range [startOfDay, endOfDay]
  is: (field, values) => ({
    kind: 'and',
    conditions: [
      {
        kind: 'comparison',
        field,
        op: 'gte',
        value: startOfDayISO(values[0] ?? null),
      },
      {
        kind: 'comparison',
        field,
        op: 'lte',
        value: endOfDayISO(values[0] ?? null),
      },
    ],
  }),

  is_not: (field, values) => ({
    kind: 'or',
    conditions: [
      {
        kind: 'comparison',
        field,
        op: 'lt',
        value: startOfDayISO(values[0] ?? null),
      },
      {
        kind: 'comparison',
        field,
        op: 'gt',
        value: endOfDayISO(values[0] ?? null),
      },
    ],
  }),

  is_before: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'lt',
    value: startOfDayISO(values[0] ?? null),
  }),

  is_on_or_after: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'gte',
    value: startOfDayISO(values[0] ?? null),
  }),

  is_after: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'gt',
    value: endOfDayISO(values[0] ?? null),
  }),

  is_on_or_before: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'lte',
    value: endOfDayISO(values[0] ?? null),
  }),

  is_between: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'between',
    value: [startOfDayISO(values[0] ?? null), endOfDayISO(values[1] ?? null)],
  }),

  is_not_between: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'notBetween',
    value: [startOfDayISO(values[0] ?? null), endOfDayISO(values[1] ?? null)],
  }),
}

// ── Boolean Compilers ───────────────────────────────────────

export const booleanCompilers: OperatorCompilerMap = {
  is: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'eq',
    value: values[0] ?? null,
  }),

  is_not: (field, values) => ({
    kind: 'comparison',
    field,
    op: 'neq',
    value: values[0] ?? null,
  }),
}

// ── MultiOption Compilers ───────────────────────────────────

// MultiOption is special: the AST nodes differ based on whether the
// field is a direct array/JSON column vs. a many-to-many relation.
// The adapter knows the difference from the FieldRef.path.kind.
//
// For has-many relations: the adapter wraps these in EXISTS subqueries.
// For direct columns: the adapter uses array/JSON operators.
//
// The compiler produces the "intent" (overlaps, contains, in, eq) and
// the adapter translates based on the field path kind.

export const multiOptionCompilers: OperatorCompilerMap = {
  // "include" (single value) — array contains this element
  include: (field, values) => {
    if (field.path.kind === 'hasMany') {
      return { kind: 'comparison', field, op: 'eq', value: values[0] ?? null }
    }
    return { kind: 'comparison', field, op: 'arrayContains', value: values }
  },

  // "exclude" (single value) — array does NOT contain this element
  exclude: (field, values) => {
    if (field.path.kind === 'hasMany') {
      return {
        kind: 'not',
        condition: {
          kind: 'comparison',
          field,
          op: 'eq',
          value: values[0] ?? null,
        },
      }
    }
    return {
      kind: 'not',
      condition: {
        kind: 'comparison',
        field,
        op: 'arrayContains',
        value: values,
      },
    }
  },

  // "include any of" — array overlaps with any of these values
  include_any_of: (field, values) => {
    if (field.path.kind === 'hasMany') {
      return { kind: 'comparison', field, op: 'in', value: values }
    }
    return { kind: 'comparison', field, op: 'arrayOverlaps', value: values }
  },

  // "include all of" — array contains ALL of these values
  include_all_of: (field, values) => {
    if (field.path.kind === 'hasMany') {
      // For has-many: each value needs its own EXISTS subquery, AND'd together
      return {
        kind: 'and',
        conditions: values.map((v) => ({
          kind: 'comparison' as const,
          field,
          op: 'eq' as const,
          value: v,
        })),
      }
    }
    return { kind: 'comparison', field, op: 'arrayContains', value: values }
  },

  // "exclude if any of" — NOT overlaps
  exclude_if_any_of: (field, values) => {
    if (field.path.kind === 'hasMany') {
      return {
        kind: 'not',
        condition: { kind: 'comparison', field, op: 'in', value: values },
      }
    }
    return {
      kind: 'not',
      condition: {
        kind: 'comparison',
        field,
        op: 'arrayOverlaps',
        value: values,
      },
    }
  },

  // "exclude if all" — NOT contains all
  exclude_if_all: (field, values) => {
    if (field.path.kind === 'hasMany') {
      return {
        kind: 'not',
        condition: {
          kind: 'and',
          conditions: values.map((v) => ({
            kind: 'comparison' as const,
            field,
            op: 'eq' as const,
            value: v,
          })),
        },
      }
    }
    return {
      kind: 'not',
      condition: {
        kind: 'comparison',
        field,
        op: 'arrayContains',
        value: values,
      },
    }
  },
}

// ── Built-in Compiler Registry ──────────────────────────────

/**
 * Maps built-in column data types to their operator compilers.
 * Adapters use this as the default, and allow consumers to extend it
 * with custom compilers for custom column types.
 */
export const builtInCompilers: Record<
  BuiltInColumnDataType,
  OperatorCompilerMap
> = {
  text: textCompilers,
  option: optionCompilers,
  number: numberCompilers,
  bigint: bigIntCompilers,
  date: dateCompilers,
  boolean: booleanCompilers,
  multiOption: multiOptionCompilers,
}
